import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import apiRouter from '../routes';

// Enable clean JSON serialization for BigInt ledger values
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Healthcheck Endpoint
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      status: 'UP',
      system: 'YatraLekha Fleet & Transport Operating System',
      version: '1.0.0-mvp',
      timestamp: new Date().toISOString(),
      uptimeSeconds: process.uptime()
    });
  });

  // API v1 Routing
  app.use('/api/v1', apiRouter);

  // Global 404 Handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      error: `Endpoint ${req.method} ${req.originalUrl} not found`
    });
  });

  // Global Error Handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({
      error: err.message || 'Internal Server Error'
    });
  });

  return app;
}
