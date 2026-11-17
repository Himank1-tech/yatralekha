/**
 * AIS-140 Telematics Protocol Types
 * Indian ITS Standard Specification
 */

export interface Ais140ParsedPacket {
  rawPacket: string;
  header: string; // e.g., '$PKT', '$LGN', '$EPB'
  vendorId?: string;
  firmwareVersion?: string;
  packetType: 'NORMAL' | 'EMERGENCY' | 'LOGIN' | 'HEARTBEAT' | 'UNKNOWN';
  isGpsValid: boolean;
  imei: string;
  vehicleRegistrationNumber?: string;
  timestamp: Date;
  latitude: number;
  longitude: number;
  altitudeMeters: number;
  headingDegrees: number;
  satellites: number;
  speedKmh: number;
  odometerKm: number;
  ignitionOn: boolean;
  emergencyButtonPressed: boolean;
  digitalInputsRaw: string;
  fuelSensorLitres?: number;
  analogInput2?: number;
  gsmSignalStrength?: number;
  networkOperator?: string;
  checksumValid?: boolean;
}
