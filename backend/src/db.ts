import { Pool } from 'pg';
import { seedDatabase } from './seed';

// Use environment variables for database connection, with defaults for local dev
export const pool = new Pool({
  user: process.env.DB_USER || 'osms_user',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'osms_store',
  password: process.env.DB_PASSWORD || 'osms123',
  port: parseInt(process.env.DB_PORT || '5432', 10),
});


export const createTables = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'user',
        phone VARCHAR(50),
        avatar TEXT,
        "birthDate" DATE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id UUID PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255),
        description TEXT,
        category VARCHAR(255),
        style VARCHAR(255),
        sizes TEXT[],
        colors TEXT[],
        price NUMERIC(10, 0),
        discount INT,
        "finalPrice" NUMERIC(10, 0),
        images TEXT[],
        sku VARCHAR(255),
        stock INT,
        rating REAL,
        "isFlashSale" BOOLEAN,
        "isNew" BOOLEAN,
        "heelHeight" VARCHAR(255)
      );
    `);
     // Add indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_name ON products(name);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_category ON products(category);`);
    await client.query(`CREATE EXTENSION IF NOT EXISTS "unaccent";`);
    
    // Use a simple, immutable function for the index.
    // Explicitly call unaccent with the 'unaccent' dictionary to prevent
    // PostgreSQL from incorrectly resolving the function.
    await client.query(`
      CREATE OR REPLACE FUNCTION f_unaccent(text)
      RETURNS text AS
      $func$
      SELECT unaccent('unaccent', $1)
      $func$ LANGUAGE sql IMMUTABLE;
    `);
    
    // Use the new immutable function for the index
    await client.query(`CREATE INDEX IF NOT EXISTS idx_product_name_unaccent ON products (f_unaccent(name));`);


    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        "userEmail" VARCHAR(255) NOT NULL,
        date TIMESTAMPTZ NOT NULL,
        items JSONB,
        subtotal NUMERIC(10, 0),
        discount NUMERIC(10, 0),
        total NUMERIC(10, 0),
        status VARCHAR(50),
        "shippingInfo" JSONB,
        "voucherCode" VARCHAR(255),
        "paymentMethod" VARCHAR(50) NOT NULL DEFAULT 'COD'
      );
    `);
    
    await client.query(`
       CREATE TABLE IF NOT EXISTS logs (
        id UUID PRIMARY KEY,
        timestamp TIMESTAMPTZ NOT NULL,
        "userEmail" VARCHAR(255) NOT NULL,
        "userName" VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        details TEXT
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vouchers (
        code VARCHAR(255) PRIMARY KEY,
        type VARCHAR(50) NOT NULL, -- 'percent', 'fixed'
        value NUMERIC(10, 2) NOT NULL,
        description TEXT,
        "minPurchase" NUMERIC(10, 2) DEFAULT 0,
        "expiresAt" TIMESTAMPTZ,
        "isActive" BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id UUID PRIMARY KEY,
        "productId" UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        "userId" UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        "userName" VARCHAR(255) NOT NULL,
        "userAvatar" TEXT,
        rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE ("productId", "userId")
      );
    `);

    await client.query(`CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON reviews("productId");`);


    // Check if seeding is needed
    const res = await client.query('SELECT COUNT(*) FROM products');
    if (res.rows[0].count === '0') {
      console.log('Database is empty, seeding initial data...');
      await seedDatabase(client);
      console.log('Seeding complete.');
    } else {
       console.log('Database already contains data, skipping seed.');
    }

    await client.query('COMMIT');
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
};