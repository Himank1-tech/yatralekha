import { Pool, PoolConfig } from 'pg';
import fs from 'fs';
import path from 'path';

export interface DatabaseConfig {
  connectionString?: string;
  host?: string;
  port?: number;
  user?: string;
  password?: string;
  database?: string;
  ssl?: boolean | object;
}

let pool: Pool | null = null;
let isDbConnected: boolean | null = null;

export class Database {
  /**
   * Initializes or returns the PostgreSQL connection pool.
   * Auto-configures SSL for Neon and cloud PostgreSQL providers.
   */
  public static getPool(config?: DatabaseConfig): Pool {
    if (!pool) {
      const connStr = config?.connectionString || process.env.DATABASE_URL;
      const isCloudOrSsl = connStr && (connStr.includes('neon.tech') || connStr.includes('sslmode=require') || !connStr.includes('localhost'));

      const poolConfig: PoolConfig = connStr
        ? {
            connectionString: connStr,
            ssl: isCloudOrSsl ? { rejectUnauthorized: false } : undefined,
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
          }
        : {
            host: config?.host || process.env.PGHOST || 'localhost',
            port: config?.port || (process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432),
            user: config?.user || process.env.PGUSER || 'postgres',
            password: config?.password || process.env.PGPASSWORD || 'postgres',
            database: config?.database || process.env.PGDATABASE || 'yatralekha',
            ssl: config?.ssl || (process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined),
            max: 20,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 5000
          };

      pool = new Pool(poolConfig);

      // Handle pool errors gracefully without crashing the server process
      pool.on('error', (err) => {
        console.warn('[Database Pool Warning]:', err.message);
      });
    }
    return pool;
  }

  /**
   * Tests whether the database connection is live and reachable.
   */
  public static async testConnection(): Promise<boolean> {
    try {
      const p = this.getPool();
      const client = await p.connect();
      try {
        await client.query('SELECT 1');
        isDbConnected = true;
        return true;
      } finally {
        client.release();
      }
    } catch (err: any) {
      isDbConnected = false;
      return false;
    }
  }

  public static isConnected(): boolean | null {
    return isDbConnected;
  }

  /**
   * Runs all migrations in sequence idempotently against the target PostgreSQL database
   */
  public static async runMigrations(poolInstance?: Pool): Promise<void> {
    const p = poolInstance ?? this.getPool();
    const migrationsDir = path.join(__dirname, 'migrations');
    
    // Look in dist or src migrations directory
    const resolvedDir = fs.existsSync(migrationsDir)
      ? migrationsDir
      : path.join(__dirname, '../src/migrations');

    if (!fs.existsSync(resolvedDir)) {
      console.warn(`[Database Migration] Warning: Migrations directory not found at ${resolvedDir}`);
      return;
    }

    const migrationFiles = fs
      .readdirSync(resolvedDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log(`[Database Migration] Found ${migrationFiles.length} migration file(s) to execute...`);

    for (const file of migrationFiles) {
      const filePath = path.join(resolvedDir, file);
      console.log(`[Database Migration] Executing ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf8');
      try {
        await p.query(sql);
        console.log(`[Database Migration] ✓ Successfully executed ${file}`);
      } catch (err: any) {
        console.warn(`[Database Migration] Note for ${file}: ${err.message}`);
      }
    }
    console.log('[Database Migration] All migrations complete.');
  }

  /**
   * Gracefully shuts down database pool
   */
  public static async closePool(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
      isDbConnected = null;
    }
  }
}

