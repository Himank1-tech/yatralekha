import { Request, Response } from 'express';
import { TelematicsIngestionWorker } from '../services/TelematicsIngestionWorker';
import { TelematicsTrackingService } from '../services/TelematicsTrackingService';

export interface DriverPing {
  tripToken: string;
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
  timestamp: string;
  updatedAt: Date;
}

export const DriverPingStore = new Map<string, DriverPing>();

export class TelematicsController {
  public static postAis140(req: Request, res: Response): void {
    try {
      const { imei, latitude, longitude, speed, ignition, fuelLevel, timestamp } = req.body;
      if (!imei) {
        res.status(400).json({ error: 'Missing IMEI' });
        return;
      }
      const truck = TelematicsTrackingService.getTruckByImei(String(imei));
      if (truck) {
        if (latitude !== undefined) truck.latitude = Number(latitude);
        if (longitude !== undefined) truck.longitude = Number(longitude);
        if (speed !== undefined) truck.speedKmh = Number(speed);
        if (fuelLevel !== undefined) truck.fuelSensorLitres = Number(fuelLevel);
        truck.lastPingTimestamp = new Date();
      }
      res.json({
        success: true,
        message: 'AIS-140 telemetry ping ingested',
        imei,
        timestamp: timestamp || new Date().toISOString()
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static postDriverPing(req: Request, res: Response): void {
    try {
      const { tripToken, latitude, longitude, speed, accuracy, timestamp } = req.body;
      if (!tripToken || latitude === undefined || longitude === undefined) {
        res.status(400).json({ error: 'Missing tripToken or coordinates (latitude, longitude)' });
        return;
      }
      DriverPingStore.set(String(tripToken), {
        tripToken: String(tripToken),
        latitude: Number(latitude),
        longitude: Number(longitude),
        speed: Number(speed || 0),
        accuracy: Number(accuracy || 0),
        timestamp: timestamp || new Date().toISOString(),
        updatedAt: new Date()
      });
      res.json({
        success: true,
        message: 'Driver mobile GPS coordinate ingested',
        tripToken
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

  public static getDriverTrip(req: Request, res: Response): void {
    try {
      const { tripToken } = req.params;
      const ping = DriverPingStore.get(String(tripToken));
      res.json({
        success: true,
        trip: {
          tripToken,
          origin: 'Nagpur Logistics Park (Hingna MIDC)',
          destination: 'Pune (Chakan Auto Cluster)',
          corridor: 'Samruddhi Mahamarg Expressway',
          vehicleNumber: 'MH 40 AK 9988',
          driverName: 'Sanjay Yadav',
          driverPhone: '+91 98221 14455',
          material: 'Automotive Steel Coils',
          weightTonnes: 24.0,
          currentLocation: ping
            ? { latitude: ping.latitude, longitude: ping.longitude, speed: ping.speed, accuracy: ping.accuracy, updatedAt: ping.updatedAt }
            : { latitude: 20.9374, longitude: 77.7796, speed: 64.5, accuracy: 15.0, updatedAt: new Date() }
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  }

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
