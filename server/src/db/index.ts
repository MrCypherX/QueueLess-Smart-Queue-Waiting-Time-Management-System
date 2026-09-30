import { Pool } from 'pg';
import { PGlite } from '@electric-sql/pglite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

let pgPool: Pool | null = null;
let pgliteInstance: PGlite | null = null;

const isPgConnection = Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.trim() !== '');

export async function getDb() {
  if (isPgConnection) {
    if (!pgPool) {
      const ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined;
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl,
      });
      console.log('✅ Connected to external PostgreSQL via pg.Pool');
    }
    return {
      type: 'pg' as const,
      pool: pgPool,
    };
  } else {
    if (!pgliteInstance) {
      const dataDir = process.env.VERCEL
        ? path.resolve('/tmp', 'queueless-pg')
        : path.resolve(process.cwd(), 'data', 'queueless-pg');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      pgliteInstance = new PGlite(dataDir);
      console.log(`✅ Initialized persistent PostgreSQL (PGlite) at: ${dataDir}`);
    }
    return {
      type: 'pglite' as const,
      instance: pgliteInstance,
    };
  }
}

export async function query<T = any>(
  text: string,
  params: unknown[] = []
): Promise<{ rows: T[]; rowCount: number }> {
  const db = await getDb();
  if (db.type === 'pg') {
    const res = await db.pool.query(text, params);
    return {
      rows: res.rows as T[],
      rowCount: res.rowCount ?? res.rows.length,
    };
  } else {
    const res = await db.instance.query(text, params as any[]);
    return {
      rows: res.rows as T[],
      rowCount: res.rows.length,
    };
  }
}

let dbInitPromise: Promise<void> | null = null;

export async function ensureDbInitialized(): Promise<void> {
  if (!dbInitPromise) {
    dbInitPromise = initDb().catch((err) => {
      dbInitPromise = null;
      throw err;
    });
  }
  return dbInitPromise;
}

export async function initDb(): Promise<void> {
  let schemaPath = path.resolve(__dirname, 'schema.sql');
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(__dirname, '../../../src/db/schema.sql');
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), 'src/db/schema.sql');
  }
  if (!fs.existsSync(schemaPath)) {
    schemaPath = path.resolve(process.cwd(), 'server/src/db/schema.sql');
  }
  const sql = fs.readFileSync(schemaPath, 'utf-8');
  console.log('🔄 Executing database migrations...');
  
  const db = await getDb();
  if (db.type === 'pg') {
    await db.pool.query(sql);
  } else {
    await db.instance.exec(sql);
  }
  console.log('✅ Database schema verified and migrated successfully.');
}
