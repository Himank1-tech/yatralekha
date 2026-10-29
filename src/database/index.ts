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
}

let pool: Pool | null = null;

export class Database {
  /**
   * Initializes or returns the PostgreSQL connection pool.
   */
  public static getPool(config?: DatabaseConfig): Pool {
    if (!pool) {
      const poolConfig: PoolConfig = {
        connectionString: config?.connectionString || process.env.DATABASE_URL,
        host: config?.host || process.env.PGHOST || 'localhost',
        port: config?.port || (process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5432),
        user: config?.user || process.env.PGUSER || 'postgres',
        password: config?.password || process.env.PGPASSWORD || 'postgres',
        database: config?.database || process.env.PGDATABASE || 'yatralekha',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000
      };

      pool = new Pool(poolConfig);
    }
    return pool;
  }

  /**
   * Runs the 001_initial_schema.sql migration against the target PostgreSQL database
   */
  public static async runMigrations(poolInstance?: Pool): Promise<void> {
    const client = poolInstance ?? this.getPool();
    const migrationPath = path.join(__dirname, 'migrations', '001_initial_schema.sql');
    if (!fs.existsSync(migrationPath)) {
      throw new Error(`Migration file not found at ${migrationPath}`);
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    await client.query(sql);
  }

  /**
   * Gracefully shuts down database pool
   */
  public static async closePool(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
    }
  }
}
