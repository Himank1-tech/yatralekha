import { AxleConfiguration } from '../types/domain';
import { FuelAuditService } from './FuelAuditService';

export interface LiveTruckPosition {
  imei: string;
  vehicleId: string;
  registrationNumber: string;
  axleConfiguration: AxleConfiguration;
  driverName: string;
  driverPhone: string;
  currentTripSerial: string;
  corridor: string;
  currentWaypointIndex: number;
  latitude: number;
  longitude: number;
  speedKmh: number;
  headingDegrees: number;
  odometerKm: number;
  ignitionOn: boolean;
  fuelSensorLitres: number;
  tankCapacityLitres: number;
  fuelPercentage: number;
  siphoningAlert: boolean;
  alertMessage?: string;
  lastPingTimestamp: Date;
  historyTrail: [number, number][]; // [lat, lng]
}

// Real GIS coordinates along Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg (Nagpur to Pune via Shirdi)
export const SAMRUDDHI_MAHAMARG_WAYPOINTS: [number, number][] = [
  [21.0844, 79.0371], // Nagpur - Zero Mile / Hingna Interchange
  [20.9167, 78.6012], // Wardha Interchange
  [20.7381, 78.1124], // Pulgaon
  [20.4851, 77.4892], // Karanja Lad Interchange
  [20.1583, 76.9114], // Malegaon Jahangir
  [19.9822, 76.2415], // Mehkar Interchange
  [19.8410, 75.8821], // Jalna Bypass Interchange
  [19.8762, 75.3433], // Chhatrapati Sambhajinagar (Aurangabad) Bypass
  [19.8211, 74.8820], // Vaijapur Interchange
  [19.7645, 74.4756], // Shirdi / Kopargaon Interchange
  [19.5284, 74.1950], // Sangamner (NH 60 Junction)
  [19.1022, 73.9855], // Narayangaon
  [18.9810, 73.9122], // Rajgurunagar
  [18.7214, 73.8567], // Pune - Chakan Auto Cluster
  [18.5204, 73.8567]  // Pune Central Freight Depot
];

// Real GIS coordinates along NH 53 (Nagpur to Bhandara)
export const NH53_BHANDARA_WAYPOINTS: [number, number][] = [
  [21.1458, 79.0882], // Nagpur Central
  [21.1620, 79.1845], // Pardi Naka
  [21.1890, 79.3210], // Tarodi
  [21.1985, 79.4520], // Mathani NHAI Toll Plaza
  [21.1850, 79.5420], // Mouda Industrial Zone
  [21.1712, 79.6540], // Bhandara Bypass (Ferro Alloys)
  [21.1685, 79.6630]  // Bhandara Steel Depot
];

export class TelematicsTrackingService {
  private static liveTrucks = new Map<string, LiveTruckPosition>();

  public static initialize(): void {
    if (this.liveTrucks.size > 0) return;

    // Truck 1: 12-Wheeler on Samruddhi Mahamarg near Jalna Bypass
    this.liveTrucks.set('867530901234567', {
      imei: '867530901234567',
      vehicleId: 'veh-vidarbha-01',
      registrationNumber: 'MH 40 AK 9988',
      axleConfiguration: '12_WHEELER',
      driverName: 'Sanjay Yadav',
      driverPhone: '+91 98221 14455',
      currentTripSerial: 'TRIP-2026-NGP-PUN-001',
      corridor: 'Nagpur ↔ Pune (Samruddhi Mahamarg)',
      currentWaypointIndex: 6, // Near Jalna
      latitude: SAMRUDDHI_MAHAMARG_WAYPOINTS[6][0],
      longitude: SAMRUDDHI_MAHAMARG_WAYPOINTS[6][1],
      speedKmh: 64.5,
      headingDegrees: 245,
      odometerKm: 18450.2,
      ignitionOn: true,
      fuelSensorLitres: 195.4,
      tankCapacityLitres: 350,
      fuelPercentage: Math.round((195.4 / 350) * 100),
      siphoningAlert: false,
      lastPingTimestamp: new Date(),
      historyTrail: SAMRUDDHI_MAHAMARG_WAYPOINTS.slice(0, 7)
    });

    // Truck 2: 10-Wheeler on NH 53 near Mouda / Bhandara
    this.liveTrucks.set('867530907654321', {
      imei: '867530907654321',
      vehicleId: 'veh-vidarbha-02',
      registrationNumber: 'MH 31 AP 4411',
      axleConfiguration: '10_WHEELER',
      driverName: 'Rameshwar Patil',
      driverPhone: '+91 98223 36677',
      currentTripSerial: 'TRIP-2026-NGP-BHD-004',
      corridor: 'Nagpur ↔ Bhandara (NH 53)',
      currentWaypointIndex: 4, // Near Mouda
      latitude: NH53_BHANDARA_WAYPOINTS[4][0],
      longitude: NH53_BHANDARA_WAYPOINTS[4][1],
      speedKmh: 48.0,
      headingDegrees: 85,
      odometerKm: 42100.0,
      ignitionOn: true,
      fuelSensorLitres: 160.0,
      tankCapacityLitres: 300,
      fuelPercentage: Math.round((160.0 / 300) * 100),
      siphoningAlert: false,
      lastPingTimestamp: new Date(),
      historyTrail: NH53_BHANDARA_WAYPOINTS.slice(0, 5)
    });

    // Truck 3: 16-Wheeler Multi-Axle Trailer in-transit near Shirdi
    this.liveTrucks.set('867530909988776', {
      imei: '867530909988776',
      vehicleId: 'veh-vidarbha-03',
      registrationNumber: 'MH 40 CD 1616',
      axleConfiguration: '16_WHEELER',
      driverName: 'Gurpreet Singh',
      driverPhone: '+91 98229 98811',
      currentTripSerial: 'TRIP-2026-NGP-PUN-008',
      corridor: 'Nagpur ↔ Pune (Samruddhi Mahamarg)',
      currentWaypointIndex: 9, // Near Shirdi Interchange
      latitude: SAMRUDDHI_MAHAMARG_WAYPOINTS[9][0],
      longitude: SAMRUDDHI_MAHAMARG_WAYPOINTS[9][1],
      speedKmh: 58.0,
      headingDegrees: 230,
      odometerKm: 31250.5,
      ignitionOn: true,
      fuelSensorLitres: 245.0,
      tankCapacityLitres: 450,
      fuelPercentage: Math.round((245.0 / 450) * 100),
      siphoningAlert: false,
      lastPingTimestamp: new Date(),
      historyTrail: SAMRUDDHI_MAHAMARG_WAYPOINTS.slice(0, 10)
    });
  }

  public static getLiveFleet(): LiveTruckPosition[] {
    this.initialize();
    return Array.from(this.liveTrucks.values());
  }

  public static getTruckByImei(imei: string): LiveTruckPosition | undefined {
    this.initialize();
    return this.liveTrucks.get(imei);
  }

  /**
   * Advances truck along its corridor route and decrements fuel at standard loaded benchmark (3.0 km/L)
   */
  public static simulateStep(imei: string): LiveTruckPosition {
    this.initialize();
    const truck = this.liveTrucks.get(imei);
    if (!truck) {
      throw new Error(`Truck with IMEI ${imei} not found`);
    }

    const waypoints = truck.corridor.includes('Bhandara')
      ? NH53_BHANDARA_WAYPOINTS
      : SAMRUDDHI_MAHAMARG_WAYPOINTS;

    let nextIndex = truck.currentWaypointIndex + 1;
    if (nextIndex >= waypoints.length) {
      nextIndex = 0; // Loop or turnaround
      truck.historyTrail = [];
    }

    const nextCoord = waypoints[nextIndex];
    truck.currentWaypointIndex = nextIndex;
    truck.latitude = nextCoord[0];
    truck.longitude = nextCoord[1];
    truck.historyTrail.push(nextCoord);

    // Increment odometer by ~35 km per waypoint segment
    const segmentKm = truck.corridor.includes('Bhandara') ? 9.5 : 35.0;
    truck.odometerKm = Math.round((truck.odometerKm + segmentKm) * 10) / 10;

    // Burn diesel at 3.0 km/L benchmark (segmentKm / 3.0)
    const burnedLitres = Math.round((segmentKm / 3.0) * 10) / 10;
    truck.fuelSensorLitres = Math.max(20, Math.round((truck.fuelSensorLitres - burnedLitres) * 10) / 10);
    truck.fuelPercentage = Math.round((truck.fuelSensorLitres / truck.tankCapacityLitres) * 100);

    // Randomize live highway speed slightly (55 - 75 km/h)
    truck.speedKmh = Math.floor(55 + Math.random() * 20);
    truck.ignitionOn = true;
    truck.lastPingTimestamp = new Date();
    truck.siphoningAlert = false;
    truck.alertMessage = undefined;

    return truck;
  }

  /**
   * Simulates an abrupt stationary fuel theft (siphoning) while truck is stopped at a Dhaba
   */
  public static simulateSiphoning(imei: string, dropLitres: number = 25.0): LiveTruckPosition {
    this.initialize();
    const truck = this.liveTrucks.get(imei);
    if (!truck) {
      throw new Error(`Truck with IMEI ${imei} not found`);
    }

    truck.speedKmh = 0;
    truck.ignitionOn = false;
    const oldLevel = truck.fuelSensorLitres;
    truck.fuelSensorLitres = Math.max(10, Math.round((truck.fuelSensorLitres - dropLitres) * 10) / 10);
    truck.fuelPercentage = Math.round((truck.fuelSensorLitres / truck.tankCapacityLitres) * 100);
    truck.siphoningAlert = true;
    truck.alertMessage = `CRITICAL THEFT ALERT: Sudden drop of ${dropLitres}L detected while stationary at Dhaba stop (Was: ${oldLevel}L, Now: ${truck.fuelSensorLitres}L). Triggered POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK.`;
    truck.lastPingTimestamp = new Date();

    return truck;
  }
}
