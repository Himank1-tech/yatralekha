import { Database } from './index';

async function main() {
  console.log('--- Starting YatraLekha Database Migrations ---');
  try {
    const isConnected = await Database.testConnection();
    if (isConnected) {
      console.log('✓ Connected to PostgreSQL Database.');
      await Database.runMigrations();
      console.log('✓ Database migrations executed successfully.');
    } else {
      console.log('ℹ Notice: PostgreSQL DATABASE_URL not reachable. Local memory store will serve runtime requests.');
    }
  } catch (err: any) {
    console.error('Migration error:', err.message);
  } finally {
    await Database.closePool();
  }
}

if (require.main === module) {
  main().then(() => process.exit(0)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { main };
