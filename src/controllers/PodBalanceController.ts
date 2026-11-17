import { Request, Response } from 'express';
import { PodBalanceRepository } from '../repositories';

export class PodBalanceController {
  public static list(req: Request, res: Response): void {
    try {
      const claims = PodBalanceRepository.list();
      const totalBalanceDue = claims
        .filter((c) => c.recoveryStatus !== 'SETTLED')
        .reduce((sum, c) => sum + Number(c.balanceDue), 0);
      const totalOverdueCount = claims.filter((c) => c.isOverdue).length;

      res.json({
        success: true,
        count: claims.length,
        totalBalanceDue,
        totalOverdueCount,
        data: claims
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static create(req: Request, res: Response): void {
    try {
      const {
        tripId,
        brokerName,
        brokerPhone,
        biltyNumber,
        origin,
        destination,
        vehicleNumber,
        totalFreight,
        advancePaid,
        balanceDue,
        unloadingDate,
        dueDate,
        podDocumentUrl,
        disputeNotes
      } = req.body;

      if (!brokerName || !brokerPhone || !totalFreight || !vehicleNumber) {
        res.status(400).json({ success: false, error: 'Missing required POD balance claim fields' });
        return;
      }

      const total = Number(totalFreight);
      const adv = advancePaid !== undefined ? Number(advancePaid) : Math.round(total * 0.75);
      const bal = balanceDue !== undefined ? Number(balanceDue) : total - adv;

      const claim = PodBalanceRepository.create({
        tripId,
        brokerName,
        brokerPhone,
        biltyNumber: biltyNumber || `BLT-${Math.floor(100000 + Math.random() * 900000)}`,
        origin: origin || 'Nagpur',
        destination: destination || 'Pune',
        vehicleNumber,
        totalFreight: total,
        advancePaid: adv,
        balanceDue: bal,
        unloadingDate: unloadingDate ? new Date(unloadingDate) : new Date(Date.now() - 10 * 86400000),
        dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() - 3 * 86400000),
        recoveryStatus: 'PENDING',
        podDocumentUrl,
        disputeNotes
      });

      res.status(201).json({ success: true, data: claim });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static generateLegalNotice(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      const result = PodBalanceRepository.generateNotice(id);
      if (!result) {
        res.status(404).json({ success: false, error: `Claim ${id} not found` });
        return;
      }

      res.json({
        success: true,
        message: 'Formal Payment Demand Notice & WhatsApp Recovery Link Generated',
        data: result
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static settle(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      const { notes } = req.body;
      const claim = PodBalanceRepository.updateStatus(id, 'SETTLED', notes || 'Payment received and reconciled');
      if (!claim) {
        res.status(404).json({ success: false, error: `Claim ${id} not found` });
        return;
      }

      res.json({
        success: true,
        message: 'POD Balance marked as fully settled and cleared from Escrow Khata',
        data: claim
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
