import { Pool } from 'pg';
import dotenv from 'dotenv';
import { logger } from './logger.js';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

pool.on('error', (err) => {
  logger.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export async function initializeDatabase(): Promise<void> {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info('✅ Connected to PostgreSQL:', result.rows[0]);
    client.release();
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
}

export async function query(text: string, params?: any[]): Promise<any> {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (duration > 100) {
      logger.warn(`Slow query (${duration}ms):`, { text, params });
    }
    
    return result;
  } catch (error) {
    logger.error('Database query error:', { text, params, error });
    throw error;
  }
}

export default pool;