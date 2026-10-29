import { createApp } from './app';
import { Ais140SocketServer } from './Ais140SocketServer';
import { seedDatabase } from '../database/seed';

// Automatically seed operational baseline for pilot fleet
seedDatabase();

const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const AIS140_PORT = process.env.AIS140_PORT ? parseInt(process.env.AIS140_PORT, 10) : 5179;

const app = createApp();

const httpServer = app.listen(HTTP_PORT, () => {
  console.log(`[YatraLekha API] HTTP Server active on http://localhost:${HTTP_PORT}`);
  console.log(`[YatraLekha API] Health check at http://localhost:${HTTP_PORT}/health`);
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
    console.warn(`[YatraLekha Telematics] Could not bind port ${AIS140_PORT}: ${err.message}`);
  });

process.on('SIGTERM', async () => {
  console.log('Shutting down YatraLekha servers...');
  httpServer.close();
  await ais140Server.stop();
  process.exit(0);
});
