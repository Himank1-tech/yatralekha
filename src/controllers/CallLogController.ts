import { Request, Response } from 'express';
import { CallLogRepository } from '../repositories';

export class CallLogController {
  public static list(req: Request, res: Response): void {
    try {
      const { search } = req.query as { search?: string };
      const logs = CallLogRepository.list(search);
      res.json({
        success: true,
        count: logs.length,
        data: logs
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static create(req: Request, res: Response): void {
    try {
      const {
        organizationId,
        contactName,
        contactRole,
        phoneNumber,
        laneDiscussed,
        callType,
        durationSeconds,
        dealStatus,
        notes
      } = req.body;

      if (!contactName || !phoneNumber) {
        res.status(400).json({ success: false, error: 'contactName and phoneNumber are required' });
        return;
      }

      const log = CallLogRepository.create({
        organizationId: organizationId || 'org-default',
        contactName,
        contactRole: contactRole || 'Broker',
        phoneNumber,
        laneDiscussed: laneDiscussed || 'Nagpur ↔ Pune',
        callType: callType || 'OUTGOING',
        durationSeconds: durationSeconds ? Number(durationSeconds) : 0,
        dealStatus: dealStatus || 'NEGOTIATING',
        notes: notes || ''
      });

      res.status(201).json({ success: true, data: log });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  public static delete(req: Request, res: Response): void {
    try {
      const id = req.params.id as string;
      const deleted = CallLogRepository.delete(id);
      if (!deleted) {
        res.status(404).json({ success: false, error: `Call log ${id} not found` });
        return;
      }
      res.json({ success: true, message: 'Call log deleted' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
