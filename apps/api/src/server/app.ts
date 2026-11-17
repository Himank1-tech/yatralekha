import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import apiRouter from '../routes';
import { Database } from '@fleetpilot/db';

// Enable clean JSON serialization for BigInt ledger values
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export function createApp(): Express {
  const app = express();

  // Permissive CORS for Public Cloud Deployment (Vercel, Render, Local)
  const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:4000'
  ].filter(Boolean) as string[];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, or same-origin)
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          origin.endsWith('.onrender.com') ||
          origin.includes('localhost')
        ) {
          return callback(null, true);
        }
        return callback(null, true); // Permissive public API mode for fleet operators
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id']
    })
  );

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true, limit: '15mb' }));

  // Healthcheck Endpoints (for UptimeRobot keep-alive pings & Render readiness)
  const healthHandler = (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      db: Database.isConnected() ? 'connected' : 'in-memory-fallback',
      system: 'YatraLekha Heavy-Haul Fleet OS & Marketplace',
      version: '2.0.0-prod',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    });
  };

  app.get('/health', healthHandler);
  app.get('/api/v1/health', healthHandler);

  // API v1 Routing
  app.use('/api/v1', apiRouter);

  // Serve Frontend Production SPA if apps/web/dist or client/dist exists
  const clientDistPaths = [
    path.join(__dirname, '../../web/dist'),
    path.join(__dirname, '../../../apps/web/dist'),
    path.join(process.cwd(), 'apps/web/dist'),
    path.join(__dirname, '../../client/dist'),
    path.join(process.cwd(), 'client/dist')
  ];

  const clientDist = clientDistPaths.find((p) => fs.existsSync(p));

  if (clientDist) {
    app.use(express.static(clientDist));
    app.use((req: Request, res: Response, next: NextFunction) => {
      if (req.method === 'GET' && !req.originalUrl.startsWith('/api') && !req.originalUrl.startsWith('/health')) {
        return res.sendFile(path.join(clientDist, 'index.html'));
      }
      next();
    });
  }

  // Global 404 Handler for API endpoints
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
