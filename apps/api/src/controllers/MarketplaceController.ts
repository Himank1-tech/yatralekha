import { Request, Response } from 'express';
import { FreightLoadRepository } from '../repositories';

// Default preferred corridors for heavy-haulers in Central/Western India
let preferredLanesStore = [
  {
    id: 'lane-1',
    origin: 'Nagpur',
    destination: 'Pune',
    corridor: 'Samruddhi Mahamarg (Expressway)',
    recommendedRatePerTon: 1150,
    activeAlerts: true
  },
  {
    id: 'lane-2',
    origin: 'Nagpur',
    destination: 'Bhandara',
    corridor: 'NH 53 (Steel Corridor)',
    recommendedRatePerTon: 230,
    activeAlerts: true
  },
  {
    id: 'lane-3',
    origin: 'Pune',
    destination: 'Bhiwandi / Mumbai',
    corridor: 'Mumbai-Pune Expressway',
    recommendedRatePerTon: 750,
    activeAlerts: true
  }
];

interface SseClient {
  id: string;
  res: Response;
}

let sseClients: SseClient[] = [];

export function broadcastMarketplaceEvent(event: string, data: any): void {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client connection likely dropped
    }
  });
}

export class MarketplaceController {
  public static listLoads(req: Request, res: Response): void {
    try {
      const { origin, destination, axleType, materialType, status } = req.query as {
        origin?: string;
        destination?: string;
        axleType?: string;
        materialType?: string;
        status?: string;
      };

      const loads = FreightLoadRepository.list({
        origin,
        destination,
        axleType,
        materialType,
        status: status || 'AVAILABLE'
      });

      res.json({
        success: true,
        count: loads.length,
        data: loads
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static createLoad(req: Request, res: Response): void {
    try {
      const {
        origin,
        destination,
        corridorName,
        materialType,
        weightTonnes,
        requiredAxleType,
        bodyType,
        offeredRate,
        rateType,
        advancePercent,
        balancePaymentTerms,
        shipperName,
        shipperPhone,
        isVerifiedShipper
      } = req.body;

      if (!origin || !destination || !materialType || !weightTonnes || !offeredRate || !shipperName || !shipperPhone) {
        res.status(400).json({ success: false, error: 'Missing required freight load fields' });
        return;
      }

      const load = FreightLoadRepository.create({
        origin,
        destination,
        corridorName: corridorName || `${origin} ➔ ${destination}`,
        materialType,
        weightTonnes: Number(weightTonnes),
        requiredAxleType: requiredAxleType || '12_WHEELER',
        bodyType: bodyType || 'DALA',
        offeredRate: Number(offeredRate),
        rateType: rateType || 'PER_TONNE',
        advancePercent: advancePercent !== undefined ? Number(advancePercent) : 75.0,
        balancePaymentTerms: balancePaymentTerms || 'Balance upon POD in 3 days',
        shipperName,
        shipperPhone,
        isVerifiedShipper: isVerifiedShipper !== undefined ? Boolean(isVerifiedShipper) : true,
        status: 'AVAILABLE'
      });

      broadcastMarketplaceEvent('load_created', load);

      res.status(201).json({ success: true, data: load });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static bookLoad(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      const booked = FreightLoadRepository.bookLoad(id);
      if (!booked) {
        res.status(404).json({ success: false, error: `Load ${id} not found` });
        return;
      }

      broadcastMarketplaceEvent('load_booked', booked);

      res.json({
        success: true,
        message: 'Load successfully reserved and locked for transport dispatch',
        data: booked
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/v1/loads/stream
   * Server-Sent Events (SSE) live stream for freight marketplace loads
   */
  public static streamLoads(req: Request, res: Response): void {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.flushHeaders?.();

    const clientId = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const client: SseClient = { id: clientId, res };
    sseClients.push(client);

    // Send initial snapshot of available freight loads
    const currentLoads = FreightLoadRepository.list({ status: 'AVAILABLE' });
    res.write(`event: snapshot\ndata: ${JSON.stringify(currentLoads)}\n\n`);

    // Keep connection alive with 20s heartbeat
    const heartbeatTimer = setInterval(() => {
      try {
        res.write(`: heartbeat\n\n`);
      } catch {
        clearInterval(heartbeatTimer);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(heartbeatTimer);
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  }

  public static getPreferredLanes(req: Request, res: Response): void {
    res.json({
      success: true,
      count: preferredLanesStore.length,
      data: preferredLanesStore
    });
  }

  public static savePreferredLanes(req: Request, res: Response): void {
    try {
      const { lanes } = req.body;
      if (Array.isArray(lanes)) {
        preferredLanesStore = lanes;
      }
      res.json({
        success: true,
        message: 'Preferred corridors updated successfully',
        data: preferredLanesStore
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
