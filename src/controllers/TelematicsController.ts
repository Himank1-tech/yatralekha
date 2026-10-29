import { Request, Response } from 'express';
import { TelematicsIngestionWorker } from '../services/TelematicsIngestionWorker';

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
}
