import { Request, Response } from 'express';
import { OrganizationRepository } from '../repositories';

export class OrganizationController {
  public static create(req: Request, res: Response): void {
    try {
      const { name, panOrGst, hubLocation, contactPhone, contactEmail } = req.body;

      if (!name || !panOrGst || !hubLocation || !contactPhone) {
        res.status(400).json({
          error: 'Missing required organization fields: name, panOrGst, hubLocation, contactPhone'
        });
        return;
      }

      const org = OrganizationRepository.create({
        name,
        panOrGst,
        hubLocation,
        contactPhone,
        contactEmail
      });

      res.status(201).json({
        success: true,
        data: org
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static list(req: Request, res: Response): void {
    const list = OrganizationRepository.list();
    res.json({ success: true, count: list.length, data: list });
  }

  public static getById(req: Request, res: Response): void {
    const orgId = req.params.id as string;
    const org = OrganizationRepository.findById(orgId);
    if (!org) {
      res.status(404).json({ error: `Organization ${orgId} not found` });
      return;
    }
    res.json({ success: true, data: org });
  }
}
