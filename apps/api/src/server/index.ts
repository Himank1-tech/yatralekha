import { createApp } from './app';
import { Ais140SocketServer } from './Ais140SocketServer';
import { seedDatabase } from '../database/seed';
import { Database } from '@fleetpilot/db';

async function bootstrap() {
  // 1. Seed in-memory baseline
  seedDatabase();

  // 2. Test PostgreSQL Database connection & run cloud migrations if DATABASE_URL is set
  if (process.env.DATABASE_URL) {
    try {
      const isConnected = await Database.testConnection();
      if (isConnected) {
        console.log('[YatraLekha Database] Connected to PostgreSQL. Running migrations...');
        await Database.runMigrations();
        console.log('[YatraLekha Database] Cloud migrations complete.');
      } else {
        console.warn('[YatraLekha Database] Warning: Could not connect to PostgreSQL. Using in-memory fallback store.');
      }
    } catch (err: any) {
      console.warn('[YatraLekha Database] Migration notice:', err.message);
    }
  }

  const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
  const AIS140_PORT = process.env.AIS140_PORT ? parseInt(process.env.AIS140_PORT, 10) : 5179;

  const app = createApp();

  const httpServer = app.listen(HTTP_PORT, () => {
    console.log(`[YatraLekha API] HTTP Server active on http://localhost:${HTTP_PORT}`);
    console.log(`[YatraLekha API] Health check at http://localhost:${HTTP_PORT}/api/v1/health`);
  });

  const ais140Server = new Ais140SocketServer({
    port: AIS140_PORT,
    onPacketIngested: (event) => {
      if (event.isSiphoningAlert) {
        console.warn(`[TELEMATICS ALERT] ${event.alertMessage} (IMEI: ${event.packet.imei})`);
      }
    }
  });

  ais140Server
    .start()
    .then(() => {
      console.log(`[YatraLekha Telematics] AIS-140 TCP Socket listening on port ${AIS140_PORT}`);
    })
    .catch((err) => {
      console.warn(`[YatraLekha Telematics] Port ${AIS140_PORT} unavailable (${err.message}). Using HTTP Webhook /api/v1/telematics/ais140.`);
    });

  const shutdown = async () => {
    console.log('Shutting down YatraLekha servers...');
    httpServer.close();
    await ais140Server.stop();
    await Database.closePool();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  console.error('Bootstrap failure:', err);
  process.exit(1);
});
