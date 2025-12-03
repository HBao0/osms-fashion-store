import { pool } from '../db';

export const getSalesSummary = async () => {
    const totalRevenueResult = await pool.query(`SELECT SUM(total) as "totalRevenue" FROM orders WHERE status = 'Đã giao'`);
    const totalOrdersResult = await pool.query(`SELECT COUNT(*) as "totalOrders" FROM orders`);
    const newOrdersResult = await pool.query(`SELECT COUNT(*) as "newOrders" FROM orders WHERE status = 'Đang xử lý'`);
    
    const monthlyRevenueResult = await pool.query(`
        SELECT 
            TO_CHAR(date, 'YYYY-MM') as month,
            SUM(total) as revenue
        FROM orders
        WHERE status = 'Đã giao'
        GROUP BY month
        ORDER BY month ASC;
    `);

    const summary = {
        totalRevenue: totalRevenueResult.rows[0].totalRevenue || 0,
        totalOrders: totalOrdersResult.rows[0].totalOrders || 0,
        newOrders: newOrdersResult.rows[0].newOrders || 0,
        monthlyRevenue: monthlyRevenueResult.rows,
    };

    return summary;
};
