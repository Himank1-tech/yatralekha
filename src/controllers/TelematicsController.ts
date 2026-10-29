import { Request, Response } from 'express';
import { TelematicsIngestionWorker } from '../services/TelematicsIngestionWorker';
import { TelematicsTrackingService } from '../services/TelematicsTrackingService';

export class TelematicsController {
  public static ingestPing(req: Request, res: Response): void {
    try {
      const { rawPacket } = req.body;

      if (!rawPacket || typeof rawPacket !== 'string') {
        res.status(400).json({ error: 'Missing rawPacket string (AIS-140 standard)' });
        return;
      }

      const event = TelematicsIngestionWorker.processRawPacket(rawPacket);

      res.status(200).json({
        success: true,
        data: event
      });
    } catch (err: any) {
      res.status(400).json({ error: `AIS-140 parsing failure: ${err.message}` });
    }
  }

  public static getLiveFleet(req: Request, res: Response): void {
    const fleet = TelematicsTrackingService.getLiveFleet();
    res.json({
      success: true,
      count: fleet.length,
      data: fleet
    });
  }

  public static getTruckByImei(req: Request, res: Response): void {
    const imei = req.params.imei as string;
    const truck = TelematicsTrackingService.getTruckByImei(imei);
    if (!truck) {
      res.status(404).json({ error: `Truck with IMEI ${imei} not found` });
      return;
    }
    res.json({ success: true, data: truck });
  }

  public static simulateStep(req: Request, res: Response): void {
    try {
      const { imei } = req.body;
      if (!imei) {
        res.status(400).json({ error: 'Missing IMEI' });
        return;
      }
      const updated = TelematicsTrackingService.simulateStep(String(imei));
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static simulateSiphoning(req: Request, res: Response): void {
    try {
      const { imei, dropLitres } = req.body;
      if (!imei) {
        res.status(400).json({ error: 'Missing IMEI' });
        return;
      }
      const drop = dropLitres ? Number(dropLitres) : 25.0;
      const updated = TelematicsTrackingService.simulateSiphoning(String(imei), drop);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
