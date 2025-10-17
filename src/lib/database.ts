/**
 * Cliente PostgreSQL seguro para Next.js (Server-Only)
 * 
 * IMPORTANTE: Este archivo NUNCA debe importarse desde componentes 'use client'.
 * Solo usar en:
 * - API Routes (src/app/api/**​/route.ts)
 * - Server Components (componentes sin 'use client')
 * - Server Actions
 * 
 * Para componentes cliente, usar fetch() a las API routes.
 */

import 'server-only';

import { Pool, type PoolClient, type QueryConfig, type QueryResult, type QueryResultRow } from 'pg';

// Guard: Prevenir importación accidental en el cliente
if (typeof window !== 'undefined') {
  throw new Error(
    '❌ src/lib/database.ts solo puede importarse en el SERVIDOR.\n' +
    'Para componentes cliente, usa fetch() a /api/* en su lugar.'
  );
}

// TypeScript global para el pool singleton
declare global {
  // eslint-disable-next-line no-var, @typescript-eslint/no-explicit-any
  var __chirisu_pg_pool__: Pool | undefined;
}

/**
 * Crea una nueva instancia del Pool de PostgreSQL
 */
function createPool(): Pool {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL no está definido.\n' +
      '1. Crea un archivo .env.local\n' +
      '2. Agrega: DATABASE_URL=postgresql://user:pass@localhost:5432/chirisu_dev'
    );
  }

  const isProd = process.env.NODE_ENV === 'production';
  // PGSSLMODE puede venir de la URL de conexión o ser 'disable' en desarrollo
  const sslMode = isProd ? 'require' : 'disable';

  console.log(`📊 Conectando a PostgreSQL (${process.env.NODE_ENV})...`);

  return new Pool({
    connectionString,
    // SSL requerido en producción (Railway, Render, Supabase)
    ssl: sslMode === 'require' ? { rejectUnauthorized: false } : undefined,
    max: 20, // Tamaño máximo del pool
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });
}

/**
 * Singleton Pool - Previene fugas de conexión en hot-reload (desarrollo)
 */
export const pool: Pool = global.__chirisu_pg_pool__ ?? createPool();

if (process.env.NODE_ENV !== 'production') {
  global.__chirisu_pg_pool__ = pool;
}

// Logging de eventos del pool (desarrollo)
if (process.env.NODE_ENV === 'development') {
  pool.on('connect', () => console.log('✅ Cliente PostgreSQL conectado'));
  pool.on('error', (err) => console.error('❌ Error en pool PostgreSQL:', err));
}

/**
 * Ejecuta una query parametrizada de forma segura
 * 
 * @example
 * const result = await query('SELECT * FROM anime WHERE id = $1', [123]);
 * const anime = result.rows[0];
 */
export async function query<T extends QueryResultRow = any>(
  text: string | QueryConfig<any[]>,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();
  try {
    const result = await pool.query<T>(text as any, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⚡ Query ejecutada en ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Error en query PostgreSQL:', error);
    throw error;
  }
}

/**
 * Ejecuta múltiples queries dentro de una transacción
 * Si cualquier query falla, se hace ROLLBACK automáticamente
 * 
 * @example
 * await withTransaction(async (client) => {
 *   await client.query('INSERT INTO users ...');
 *   await client.query('INSERT INTO lists ...');
 * });
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Objeto exportado con API consistente
 */
export const db = {
  query,
  withTransaction,
  pool,
};

export type Db = typeof db;
