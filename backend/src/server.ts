
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { createTables, pool } from './db';
import redisClient from './redisClient';
import { v4 as uuidv4 } from 'uuid';
import * as analyticsService from './services/analyticsService';
import bcrypt from 'bcrypt';
// FIX: Import `process` to correctly resolve its type and access the `exit` method.
import process from 'process';

const SALT_ROUNDS = 10;
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for base64 images

// --- MIDDLEWARE ---
// FIX: Changed express.Request, express.Response, and express.NextFunction to Request, Response, and NextFunction to fix type errors.
const userAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    const userEmail = req.headers['x-user-email'] as string;

    if (!userEmail) {
        return res.status(401).json({ message: 'Unauthorized: Missing user identifier' });
    }

    try {
        // Fetch all necessary user info at once to avoid multiple queries later
        const result = await pool.query('SELECT id, name, email, avatar, role FROM users WHERE email = $1', [userEmail]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Unauthorized: User not found' });
        }
        // Attach user info to the request for later use
        (req as any).user = result.rows[0];
        next();
    } catch (err) {
        console.error('User auth error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// FIX: Changed express.Request, express.Response, and express.NextFunction to Request, Response, and NextFunction to fix type errors.
const adminOnlyMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (user && user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ message: 'Forbidden: Admin access required' });
    }
};


// Helper to invalidate products cache
const invalidateProductsCache = async () => {
    if (redisClient.isOpen) {
        const keys = await redisClient.keys('products:*');
        if (keys.length > 0) {
            await redisClient.del(keys);
            console.log(`Invalidated ${keys.length} product cache entries from Redis.`);
        }
    }
};

// --- API ROUTES ---

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/categories', async (req: Request, res: Response) => {
    try {
        const result = await pool.query(`
            SELECT category as name, COUNT(*)::int as count 
            FROM products 
            GROUP BY category 
            ORDER BY name ASC
        `);
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching categories:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/products', async (req: Request, res: Response) => {
    const { search, category, style, color, size, minPrice, maxPrice, sortBy, page = '1', limit = '20' } = req.query;
    const cacheKey = `products:${JSON.stringify(req.query)}`;

    try {
        if (redisClient.isOpen) {
            const cachedData = await redisClient.get(cacheKey);
            if (cachedData) {
                console.log(`[Redis Cache HIT] for key: ${cacheKey}`);
                return res.json(JSON.parse(cachedData));
            }
             console.log(`[Redis Cache MISS] for key: ${cacheKey}`);
        }

        const pageNum = parseInt(page as string, 10) || 1;
        const limitNum = parseInt(limit as string, 10) || 20;
        const offset = (pageNum - 1) * limitNum;

        let query = 'SELECT * FROM products';
        const conditions: string[] = [];
        const queryParams: any[] = [];
        let paramIndex = 1;

        if (search) {
            conditions.push(`f_unaccent(name) ILIKE f_unaccent($${paramIndex++})`);
            queryParams.push(`%${search}%`);
        }
        if (category && category !== 'all') {
            conditions.push(`category = $${paramIndex++}`);
            queryParams.push(category);
        }
        if (style) {
            conditions.push(`style = $${paramIndex++}`);
            queryParams.push(style);
        }
        if (color) {
            conditions.push(`$${paramIndex} = ANY(colors)`);
            queryParams.push(color);
            paramIndex++;
        }
        if (size) {
            conditions.push(`$${paramIndex} = ANY(sizes)`);
            queryParams.push(size);
            paramIndex++;
        }
        if (minPrice) {
            conditions.push(`"finalPrice" >= $${paramIndex++}`);
            queryParams.push(minPrice);
        }
        if (maxPrice) {
            conditions.push(`"finalPrice" <= $${paramIndex++}`);
            queryParams.push(maxPrice);
        }
        
        const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
        query += ` ${whereClause}`;
        
        // Count total items with filters
        const countQuery = `SELECT COUNT(*) FROM products ${whereClause}`;
        const totalResult = await pool.query(countQuery, queryParams);
        const totalItems = parseInt(totalResult.rows[0].count, 10);
        const totalPages = Math.ceil(totalItems / limitNum);

        // Add sorting
        switch (sortBy) {
            case 'price_asc':
                query += ' ORDER BY "finalPrice" ASC';
                break;
            case 'price_desc':
                query += ' ORDER BY "finalPrice" DESC';
                break;
            case 'newest':
                query += ' ORDER BY "isNew" DESC, name ASC'; // Assuming no created_at, using isNew
                break;
            default:
                 query += ' ORDER BY name ASC';
        }

        query += ` LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        queryParams.push(limitNum, offset);

        const result = await pool.query(query, queryParams);
        
        const responseData = {
            data: result.rows,
            totalPages,
            currentPage: pageNum,
            totalItems
        };

        if (redisClient.isOpen) {
            await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 600 });
        }

        res.json(responseData);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/products/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/products', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    try {
        const productData = req.body;
        const newId = productData.id || uuidv4();
        const columns = ['id', 'name', 'slug', 'description', 'category', 'style', 'sizes', 'colors', 'price', 'discount', 'finalPrice', 'images', 'sku', 'stock', 'rating', 'isFlashSale', 'isNew', 'heelHeight'];
        const values = columns.map(col => productData[col] ?? null);
        
        const result = await pool.query(
          `INSERT INTO products (${columns.map(c => `"${c}"`).join(', ')}) VALUES (${columns.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *`,
          [newId, ...values.slice(1)]
        );

        await invalidateProductsCache();
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.put('/api/products/:id', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const productData = req.body;
        const columns = ['name', 'slug', 'description', 'category', 'style', 'sizes', 'colors', 'price', 'discount', 'finalPrice', 'images', 'sku', 'stock', 'rating', 'isFlashSale', 'isNew', 'heelHeight'];
        const fields = columns.map((col, i) => `"${col}" = $${i + 1}`).join(', ');
        const values = columns.map(col => productData[col] ?? null);

        const result = await pool.query(
            `UPDATE products SET ${fields} WHERE id = $${columns.length + 1} RETURNING *`, 
            [...values, id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Product not found' });
        }
        await invalidateProductsCache();
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.delete('/api/products/:id', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM products WHERE id = $1', [id]);
        await invalidateProductsCache();
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Users
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/users', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const result = await pool.query('SELECT id, name, email, role, phone, avatar, "birthDate" FROM users');
    res.json(result.rows);
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/users', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const { name, email, password, role, phone, avatar, birthDate } = req.body;
    try {
        if (!password) {
            return res.status(400).json({ message: 'Password is required for new users.' });
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = { id: uuidv4(), name, email, password: passwordHash, role, phone, avatar, birthDate };

        const result = await pool.query('INSERT INTO users (id, name, email, password, role, phone, avatar, "birthDate") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, name, email, role, phone, avatar, "birthDate"', 
            [newUser.id, name, email, newUser.password, role, phone, avatar, birthDate]);
        res.status(201).json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ message: 'Email này đã được sử dụng.' });
        } else {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.put('/api/users/:id', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email, role, phone, avatar, birthDate, password } = req.body;
    try {
        let result;
        if (password) {
            const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
            result = await pool.query(
                'UPDATE users SET name = $1, email = $2, role = $3, phone = $4, avatar = $5, "birthDate" = $6, password = $7 WHERE id = $8 RETURNING id, name, email, role, phone, avatar, "birthDate"', 
                [name, email, role, phone, avatar, birthDate, passwordHash, id]
            );
        } else {
            result = await pool.query(
                'UPDATE users SET name = $1, email = $2, role = $3, phone = $4, avatar = $5, "birthDate" = $6 WHERE id = $7 RETURNING id, name, email, role, phone, avatar, "birthDate"', 
                [name, email, role, phone, avatar, birthDate, id]
            );
        }
        res.json(result.rows[0]);
    } catch (err: any) {
        if (err.code === '23505') { // Unique violation
            res.status(409).json({ message: 'Email này đã được sử dụng.' });
        } else {
            console.error(err);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.patch('/api/users/:id/password', userAuthMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    const requestUser = (req as any).user;

    // A user can change their own password, or an admin can change anyone's
    if (requestUser.id !== id && requestUser.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: You can only change your own password.' });
    }

    try {
        const result = await pool.query('SELECT password FROM users WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Mật khẩu hiện tại không chính xác.' });
        }

        const newPasswordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [newPasswordHash, id]);

        res.json({ message: 'Đổi mật khẩu thành công.' });
    } catch (err) {
        console.error('Password change error:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.delete('/api/users/:id', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        await pool.query('DELETE FROM users WHERE id = $1', [id]);
        res.status(204).send();
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Auth
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/auth/login', async (req: Request, res: Response) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
        const user = result.rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không chính xác.' });
        }
        const { password: _, ...userToSend } = user;
        res.json(userToSend);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/auth/register', async (req: Request, res: Response) => {
    const { name, email, password } = req.body;
    try {
        const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ message: 'Email này đã được sử dụng.' });
        }
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        const newUser = { id: uuidv4(), name, email, password: passwordHash, role: 'user' };
        const result = await pool.query('INSERT INTO users (id, name, email, password, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role', 
            [newUser.id, name, email, newUser.password, 'user']);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Orders
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/orders', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const result = await pool.query('SELECT * FROM orders ORDER BY date DESC');
    res.json(result.rows);
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/orders', userAuthMiddleware, async (req: Request, res: Response) => {
    let { items, subtotal, discount, total, shippingInfo, voucherCode, paymentMethod, paymentProvider } = req.body;
    const user = (req as any).user;
    // DEBUG: log incoming request headers and body to help diagnose order creation issues
    try {
        console.log('POST /api/orders - headers:', req.headers);
        console.log('POST /api/orders - body:', JSON.stringify(req.body));
    } catch (logErr) {
        console.error('Failed to log request body for /api/orders', logErr);
    }
    
    const status = paymentMethod === 'Online' ? 'Chờ thanh toán' : 'Đang xử lý';

    // Sanitize and normalize order inputs to avoid DB insertion issues
    // DEBUG: show types and small preview to help debug invalid JSON being sent
    console.log('POST /api/orders - items type:', typeof items);
    try {
        console.log('POST /api/orders - items preview:', typeof items === 'string' ? (items as string).slice(0,500) : JSON.stringify(items).slice(0,500));
    } catch (e) {
        console.log('POST /api/orders - items preview failed to stringify', e);
    }
    console.log('POST /api/orders - shippingInfo type:', typeof shippingInfo);
    try {
        console.log('POST /api/orders - shippingInfo preview:', typeof shippingInfo === 'string' ? (shippingInfo as string).slice(0,500) : JSON.stringify(shippingInfo).slice(0,500));
    } catch (e) {
        console.log('POST /api/orders - shippingInfo preview failed to stringify', e);
    }
    // Ensure numeric values
    subtotal = subtotal ? Number(subtotal) : 0;
    discount = discount ? Number(discount) : 0;
    total = total ? Number(total) : 0;
    // Ensure items and shippingInfo are plain JSON strings (we'll cast to jsonb in query)
    const itemsJson = typeof items === 'string' ? items : JSON.stringify(items || []);
    const shippingJson = typeof shippingInfo === 'string' ? shippingInfo : JSON.stringify(shippingInfo || {});

    const newOrder = {
        id: `DH-${Date.now()}`,
        userEmail: user.email,
        date: new Date().toISOString(),
        items: itemsJson,
        subtotal,
        discount,
        total,
        status,
        shippingInfo: shippingJson,
        voucherCode,
        paymentMethod,
        paymentProvider: paymentProvider || null,
    };

    // DEBUG: log short summary
    console.log('Creating order', { id: newOrder.id, userEmail: newOrder.userEmail, total: newOrder.total, paymentMethod: newOrder.paymentMethod });

    try {
        // Insert into DB: items and shippingInfo are JSONB columns; ensure we pass JS objects (pg will serialize)
    const itemsObj = typeof newOrder.items === 'string' ? JSON.parse(newOrder.items as string) : newOrder.items;
    const shippingObj = typeof newOrder.shippingInfo === 'string' ? JSON.parse(newOrder.shippingInfo as string) : newOrder.shippingInfo;

    // Serialize explicitly to JSON strings and cast to jsonb in the query to avoid any driver/encoding mismatch
    const itemsStr = JSON.stringify(itemsObj);
    const shippingStr = JSON.stringify(shippingObj);

    // DEBUG: inspect actual parameters we'll pass to pg
        try {
            console.log('DEBUG before INSERT - itemsObj typeof:', typeof itemsObj, 'isArray:', Array.isArray(itemsObj));
            console.log('DEBUG before INSERT - itemsObj json preview:', JSON.stringify(itemsObj).slice(0,1200));
        } catch (e) {
            console.log('DEBUG stringify itemsObj failed', e);
        }
        try {
            console.log('DEBUG before INSERT - shippingObj typeof:', typeof shippingObj);
            console.log('DEBUG before INSERT - shippingObj json preview:', JSON.stringify(shippingObj).slice(0,1200));
        } catch (e) {
            console.log('DEBUG stringify shippingObj failed', e);
        }

        await pool.query(
            'INSERT INTO orders (id, "userEmail", date, items, subtotal, discount, total, status, "shippingInfo", "voucherCode", "paymentMethod") VALUES ($1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9::jsonb, $10, $11)',
            [newOrder.id, newOrder.userEmail, newOrder.date, itemsStr, newOrder.subtotal, newOrder.discount, newOrder.total, newOrder.status, shippingStr, newOrder.voucherCode, newOrder.paymentMethod]
        );

        // Return created order with parsed JSON fields
        const returnedOrder = { ...newOrder, items: JSON.parse(newOrder.items as string), shippingInfo: JSON.parse(newOrder.shippingInfo as string) };
        res.status(201).json(returnedOrder);
    } catch (err) {
        console.error('Create order error:', err);
        const message = (err && (err as any).message) ? (err as any).message : 'Internal server error';
        res.status(500).json({ message });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.patch('/api/orders/:id/status', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.patch('/api/orders/:id/confirm_payment', userAuthMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE orders SET status = 'Đang xử lý' WHERE id = $1 AND status = 'Chờ thanh toán' RETURNING *`,
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found or not awaiting payment.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.patch('/api/orders/:id/cancel', userAuthMiddleware, async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            `UPDATE orders SET status = 'Đã hủy' WHERE id = $1 RETURNING *`,
            [id]
        );
         if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Order not found.' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});


// Logs
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/logs', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    const result = await pool.query('SELECT * FROM logs ORDER BY timestamp DESC');
    res.json(result.rows);
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/logs', userAuthMiddleware, async (req: Request, res: Response) => {
    const { action, details } = req.body;
    const user = (req as any).user;
    const newLog = {
        id: uuidv4(),
        timestamp: new Date(),
        userEmail: user.email,
        userName: user.name, // Directly from enhanced middleware
        action,
        details
    };
    try {
        await pool.query('INSERT INTO logs (id, timestamp, "userEmail", "userName", action, details) VALUES ($1, $2, $3, $4, $5, $6)',
            [newLog.id, newLog.timestamp, newLog.userEmail, newLog.userName, newLog.action, newLog.details]);
        res.status(201).json(newLog);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Vouchers
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/vouchers/apply', userAuthMiddleware, async (req: Request, res: Response) => {
    const { code, subtotal } = req.body;
    if (!code || typeof subtotal !== 'number') {
        return res.status(400).json({ message: 'Mã voucher và tổng tiền là bắt buộc.' });
    }
    try {
        const result = await pool.query('SELECT * FROM vouchers WHERE code = $1 AND "isActive" = TRUE', [code.toUpperCase()]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Mã voucher không hợp lệ hoặc đã hết hạn.' });
        }
        const voucher = result.rows[0];
        if (voucher.expiresAt && new Date(voucher.expiresAt) < new Date()) {
             return res.status(400).json({ message: 'Mã voucher đã hết hạn.' });
        }
        if (subtotal < voucher.minPurchase) {
            return res.status(400).json({ message: `Voucher này yêu cầu đơn hàng tối thiểu ${Number(voucher.minPurchase).toLocaleString('vi-VN')}đ.` });
        }
        res.json(voucher);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Analytics
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/analytics/summary', userAuthMiddleware, adminOnlyMiddleware, async (req: Request, res: Response) => {
    try {
        const summary = await analyticsService.getSalesSummary();
        res.json(summary);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Reviews
// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.get('/api/products/:id/reviews', async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await pool.query(
            'SELECT * FROM reviews WHERE "productId" = $1 ORDER BY "createdAt" DESC',
            [id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error('Error fetching reviews:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// FIX: Changed express.Request and express.Response to Request and Response to fix type errors.
app.post('/api/products/:id/reviews', userAuthMiddleware, async (req: Request, res: Response) => {
    const { id: productId } = req.params;
    const { rating, comment } = req.body;
    const user = (req as any).user;

    if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating is required and must be between 1 and 5.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const { name: userName, avatar: userAvatar } = user;

        // Insert the new review
        const reviewResult = await client.query(
            `INSERT INTO reviews (id, "productId", "userId", "userName", "userAvatar", rating, comment)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [uuidv4(), productId, user.id, userName, userAvatar, rating, comment]
        );
        const newReview = reviewResult.rows[0];

        // Recalculate and update the product's average rating
        const avgRatingResult = await client.query(
            'SELECT AVG(rating) as "avgRating" FROM reviews WHERE "productId" = $1',
            [productId]
        );
        const newAvgRating = parseFloat(avgRatingResult.rows[0].avgRating).toFixed(1);

        await client.query(
            'UPDATE products SET rating = $1 WHERE id = $2',
            [newAvgRating, productId]
        );
        
        await client.query('COMMIT');
        
        await invalidateProductsCache();

        res.status(201).json(newReview);
    } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '23505') { // unique_violation
            return res.status(409).json({ message: 'Bạn đã đánh giá sản phẩm này rồi.' });
        }
        console.error('Error submitting review:', err);
        res.status(500).json({ message: 'Internal server error' });
    } finally {
        client.release();
    }
});


// Start server
const startServer = async () => {
    try {
        await createTables();
        app.listen(PORT, () => {
            console.log(`Backend server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
