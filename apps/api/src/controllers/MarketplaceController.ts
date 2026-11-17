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
      res.json({
        success: true,
        message: 'Load successfully reserved and locked for transport dispatch',
        data: booked
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
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
