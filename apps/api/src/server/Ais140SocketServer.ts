import net from 'net';
import { TelematicsIngestionWorker, TelemetryIngestionEvent } from '../services/TelematicsIngestionWorker';

export interface Ais140SocketServerConfig {
  port?: number;
  host?: string;
  onPacketIngested?: (event: TelemetryIngestionEvent) => void;
}

export class Ais140SocketServer {
  private server: net.Server | null = null;
  public readonly port: number;
  public readonly host: string;
  private onPacketIngested?: (event: TelemetryIngestionEvent) => void;

  constructor(config?: Ais140SocketServerConfig) {
    // Port 5179 is the official Indian ITS / Traccar port for AIS-140 devices
    this.port = config?.port ?? 5179;
    this.host = config?.host ?? '0.0.0.0';
    this.onPacketIngested = config?.onPacketIngested;
  }

  /**
   * Starts TCP socket listening for AIS-140 tracking hardware
   */
  public start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = net.createServer((socket) => {
        let buffer = '';

        socket.on('data', (chunk) => {
          buffer += chunk.toString('utf8');

          // Packets are typically newline-terminated or ended by '*'
          const lines = buffer.split(/\r?\n/);
          // Keep incomplete tail in buffer
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('$')) continue;

            try {
              const event = TelematicsIngestionWorker.processRawPacket(trimmed);
              if (this.onPacketIngested) {
                this.onPacketIngested(event);
              }

              // Send standard ACK to tracker if required
              // e.g. for login packets: $LGN_ACK or general ACK
              if (event.packet.packetType === 'LOGIN') {
                socket.write('$ACK,LGN,1*\r\n');
              }
            } catch (err) {
              // Silently ignore or log malformed hardware fragments
            }
          }
        });

        socket.on('error', () => {
          // Socket connection error handled gracefully
        });
      });

      this.server.on('error', (err) => {
        reject(err);
      });

      this.server.listen(this.port, this.host, () => {
        resolve();
      });
    });
  }

  /**
   * Shuts down TCP socket server
   */
  public stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          this.server = null;
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}
