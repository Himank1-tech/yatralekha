import { Ais140Parser } from '../parsers/Ais140Parser';
import { Ais140ParsedPacket } from '../types/ais140';
import { FuelAuditService } from './FuelAuditService';

export interface TelemetryIngestionEvent {
  packet: Ais140ParsedPacket;
  isSiphoningAlert: boolean;
  siphoningDropLitres?: number;
  alertMessage?: string;
  dbRow: {
    imei: string;
    packetTimestamp: Date;
    latitude: number;
    longitude: number;
    speedKmh: number;
    headingDeg: number;
    odometerKm: number;
    ignitionStatus: boolean;
    fuelSensorLitres?: number;
    digitalInputs: string;
    rawPacketPayload: string;
    isGpsValid: boolean;
  };
}

export class TelematicsIngestionWorker {
  // In-memory cache of the latest ping per IMEI for real-time variance detection
  private static latestPingsByImei = new Map<string, Ais140ParsedPacket>();

  /**
   * Ingests, decodes, and evaluates a single raw AIS-140 stream packet.
   */
  public static processRawPacket(rawPacket: string): TelemetryIngestionEvent {
    const packet = Ais140Parser.parse(rawPacket);
    const previousPing = this.latestPingsByImei.get(packet.imei);

    let isSiphoningAlert = false;
    let siphoningDropLitres: number | undefined;
    let alertMessage: string | undefined;

    if (
      previousPing &&
      previousPing.fuelSensorLitres !== undefined &&
      packet.fuelSensorLitres !== undefined
    ) {
      const timeDeltaSeconds = Math.max(
        1,
        Math.round((packet.timestamp.getTime() - previousPing.timestamp.getTime()) / 1000)
      );

      const siphoningCheck = FuelAuditService.detectIdleSiphoning(
        previousPing.fuelSensorLitres,
        packet.fuelSensorLitres,
        packet.ignitionOn,
        packet.speedKmh,
        timeDeltaSeconds
      );

      if (siphoningCheck.isSiphoningSuspected) {
        isSiphoningAlert = true;
        siphoningDropLitres = siphoningCheck.dropLitres;
        alertMessage = siphoningCheck.message;
      }
    }

    // Update memory cache
    this.latestPingsByImei.set(packet.imei, packet);

    return {
      packet,
      isSiphoningAlert,
      siphoningDropLitres,
      alertMessage,
      dbRow: {
        imei: packet.imei,
        packetTimestamp: packet.timestamp,
        latitude: packet.latitude,
        longitude: packet.longitude,
        speedKmh: packet.speedKmh,
        headingDeg: packet.headingDegrees,
        odometerKm: packet.odometerKm,
        ignitionStatus: packet.ignitionOn,
        fuelSensorLitres: packet.fuelSensorLitres,
        digitalInputs: packet.digitalInputsRaw,
        rawPacketPayload: packet.rawPacket,
        isGpsValid: packet.isGpsValid
      }
    };
  }

  /**
   * Clears in-memory telemetry state (useful for tests and service reboots)
   */
  public static resetState(): void {
    this.latestPingsByImei.clear();
  }
}
