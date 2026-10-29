import { Request, Response } from 'express';
import { FuelAuditService } from '../services/FuelAuditService';

export class FuelAuditController {
  public static auditTrip(req: Request, res: Response): void {
    try {
      const {
        distanceRunKm,
        totalDieselLitresPurchased,
        initialTankLitres,
        finalTankLitres,
        unexplainedIdleDropLitres
      } = req.body;

      if (!distanceRunKm || totalDieselLitresPurchased === undefined) {
        res.status(400).json({
          error: 'Missing required fuel audit fields: distanceRunKm, totalDieselLitresPurchased'
        });
        return;
      }

      const result = FuelAuditService.auditFuelConsumption({
        distanceRunKm: Number(distanceRunKm),
        totalDieselLitresPurchased: Number(totalDieselLitresPurchased),
        initialTankLitres: initialTankLitres !== undefined ? Number(initialTankLitres) : undefined,
        finalTankLitres: finalTankLitres !== undefined ? Number(finalTankLitres) : undefined,
        unexplainedIdleDropLitres:
          unexplainedIdleDropLitres !== undefined ? Number(unexplainedIdleDropLitres) : undefined
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static reconcileMultiPump(req: Request, res: Response): void {
    try {
      const {
        distanceRunKm,
        parchiExpenses,
        initialTankLitres,
        finalTankLitres,
        telematicsReportedConsumptionLitres,
        unexplainedIdleDropLitres
      } = req.body;

      if (!distanceRunKm || !parchiExpenses || !Array.isArray(parchiExpenses)) {
        res.status(400).json({
          error: 'Missing required fields: distanceRunKm, parchiExpenses (array)'
        });
        return;
      }

      const result = FuelAuditService.reconcileMultiPumpParchi({
        distanceRunKm: Number(distanceRunKm),
        parchiExpenses,
        initialTankLitres: initialTankLitres !== undefined ? Number(initialTankLitres) : undefined,
        finalTankLitres: finalTankLitres !== undefined ? Number(finalTankLitres) : undefined,
        telematicsReportedConsumptionLitres:
          telematicsReportedConsumptionLitres !== undefined
            ? Number(telematicsReportedConsumptionLitres)
            : undefined,
        unexplainedIdleDropLitres:
          unexplainedIdleDropLitres !== undefined ? Number(unexplainedIdleDropLitres) : undefined
      });

      res.json({ success: true, data: result });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static checkSiphoning(req: Request, res: Response): void {
    try {
      const {
        previousFuelLevel,
        currentFuelLevel,
        isIgnitionOn,
        speedKmh,
        timeDeltaSeconds
      } = req.body;

      if (
        previousFuelLevel === undefined ||
        currentFuelLevel === undefined ||
        isIgnitionOn === undefined ||
        speedKmh === undefined ||
        !timeDeltaSeconds
      ) {
        res.status(400).json({
          error:
            'Missing required siphoning check fields: previousFuelLevel, currentFuelLevel, isIgnitionOn, speedKmh, timeDeltaSeconds'
        });
        return;
      }

      const check = FuelAuditService.detectIdleSiphoning(
        Number(previousFuelLevel),
        Number(currentFuelLevel),
        Boolean(isIgnitionOn),
        Number(speedKmh),
        Number(timeDeltaSeconds)
      );

      res.json({ success: true, data: check });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }
}
