import { Request, Response } from 'express';
import { CorridorRoutingService } from '../routing/CorridorRoutingService';

export class CorridorController {
  public static list(req: Request, res: Response): void {
    const list = Object.values(CorridorRoutingService.CORRIDORS);
    res.json({ success: true, count: list.length, data: list });
  }

  public static getDetails(req: Request, res: Response): void {
    try {
      const paramKey = (req.params.key as string).toUpperCase() as 'NAGPUR_PUNE' | 'NAGPUR_BHANDARA';
      const corridor = CorridorRoutingService.getCorridor(paramKey);
      const dieselEstimate = CorridorRoutingService.estimateBaselineDieselConsumption(paramKey);

      res.json({
        success: true,
        data: {
          ...corridor,
          dieselEstimate
        }
      });
    } catch (err: any) {
      res.status(404).json({ error: err.message });
    }
  }
}
