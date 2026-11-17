import { Ais140ParsedPacket } from '../types/ais140';

export class Ais140Parser {
  /**
   * Parses an AIS-140 ASCII packet adhering to the MoRTH / Indian ITS standard (port 5179 protocol).
   *
   * Example:
   * $PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,58.4,14250.8,0001,0000,165.4,0.0,BSNL*4A
   */
  public static parse(rawPacket: string): Ais140ParsedPacket {
    if (!rawPacket || typeof rawPacket !== 'string') {
      throw new Error('Raw packet must be a non-empty string.');
    }

    const trimmed = rawPacket.trim();
    if (!trimmed.startsWith('$')) {
      throw new Error(`Invalid AIS-140 packet header: must start with '$'. Received: ${trimmed}`);
    }

    // Split packet and checksum if present (*HEX)
    let payload = trimmed;
    let checksumHex: string | undefined;
    let checksumValid: boolean | undefined;

    const asteriskIndex = trimmed.lastIndexOf('*');
    if (asteriskIndex !== -1) {
      payload = trimmed.substring(0, asteriskIndex);
      checksumHex = trimmed.substring(asteriskIndex + 1);
      checksumValid = this.verifyXorChecksum(payload, checksumHex);
    }

    const parts = payload.split(',');
    const header = parts[0]; // $PKT, $LGN, $HBT, $EPB

    if (parts.length < 18) {
      throw new Error(`Insufficient AIS-140 packet fields. Expected at least 18, got ${parts.length}`);
    }

    const vendorId = parts[1] || undefined;
    const firmwareVersion = parts[2] || undefined;
    const rawPacketType = parts[3]; // NR, EA, LGN, HB

    let packetType: Ais140ParsedPacket['packetType'] = 'UNKNOWN';
    if (header === '$LGN' || rawPacketType === 'LGN') {
      packetType = 'LOGIN';
    } else if (header === '$HBT' || rawPacketType === 'HB') {
      packetType = 'HEARTBEAT';
    } else if (header === '$EPB' || rawPacketType === 'EA') {
      packetType = 'EMERGENCY';
    } else if (header === '$PKT' || rawPacketType === 'NR') {
      packetType = 'NORMAL';
    }

    // parts[4] is alert status / packet status (0 or 1)
    const isGpsValid = parts[5] === 'A';
    const imei = parts[6];
    const vehicleRegistrationNumber = parts[7] || undefined;

    const altitudeMeters = parseFloat(parts[8]) || 0;
    const headingDegrees = parseFloat(parts[9]) || 0;
    const satellites = parseInt(parts[10], 10) || 0;

    // Date & Time: parts[11] is DDMMYY, parts[12] is HHMMSS
    const dateStr = parts[11];
    const timeStr = parts[12];
    const timestamp = this.parseDateTime(dateStr, timeStr);

    // Latitude & Direction
    let latitude = parseFloat(parts[13]) || 0;
    const latDir = parts[14];
    if (latDir === 'S') latitude = -latitude;

    // Longitude & Direction
    let longitude = parseFloat(parts[15]) || 0;
    const longDir = parts[16];
    if (longDir === 'W') longitude = -longitude;

    const speedKmh = parseFloat(parts[17]) || 0;
    const odometerKm = parts[18] ? parseFloat(parts[18]) : 0;

    // Digital Inputs: Bit 0 = Ignition, Bit 1 = Emergency button
    const digitalInputsRaw = parts[19] || '0000';
    const parsedBitmask = parseInt(digitalInputsRaw, 16) || 0;
    const ignitionOn = (parsedBitmask & 0x01) !== 0;
    const emergencyButtonPressed = (parsedBitmask & 0x02) !== 0 || packetType === 'EMERGENCY';

    // Analog Inputs: Fuel sensor litres/voltage
    const fuelSensorLitres = parts[21] ? parseFloat(parts[21]) : undefined;
    const analogInput2 = parts[22] ? parseFloat(parts[22]) : undefined;
    const networkOperator = parts[23] || undefined;

    return {
      rawPacket: trimmed,
      header,
      vendorId,
      firmwareVersion,
      packetType,
      isGpsValid,
      imei,
      vehicleRegistrationNumber,
      timestamp,
      latitude,
      longitude,
      altitudeMeters,
      headingDegrees,
      satellites,
      speedKmh,
      odometerKm,
      ignitionOn,
      emergencyButtonPressed,
      digitalInputsRaw,
      fuelSensorLitres: isNaN(fuelSensorLitres as number) ? undefined : fuelSensorLitres,
      analogInput2: isNaN(analogInput2 as number) ? undefined : analogInput2,
      networkOperator,
      checksumValid
    };
  }

  /**
   * Parses DDMMYY and HHMMSS into a valid UTC Date
   */
  private static parseDateTime(dateStr: string, timeStr: string): Date {
    if (!dateStr || !timeStr || dateStr.length < 6 || timeStr.length < 6) {
      return new Date();
    }

    const day = parseInt(dateStr.substring(0, 2), 10);
    const month = parseInt(dateStr.substring(2, 4), 10) - 1; // 0-indexed month
    const year = 2000 + parseInt(dateStr.substring(4, 6), 10);

    const hours = parseInt(timeStr.substring(0, 2), 10);
    const minutes = parseInt(timeStr.substring(2, 4), 10);
    const seconds = parseInt(timeStr.substring(4, 6), 10);

    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }

  /**
   * Verifies standard NMEA/AIS-140 XOR checksum
   */
  private static verifyXorChecksum(payload: string, expectedHex: string): boolean {
    // Strip leading '$' for XOR calculation
    const content = payload.startsWith('$') ? payload.substring(1) : payload;
    let checksum = 0;
    for (let i = 0; i < content.length; i++) {
      checksum ^= content.charCodeAt(i);
    }
    const computedHex = checksum.toString(16).toUpperCase().padStart(2, '0');
    return computedHex === expectedHex.trim().toUpperCase();
  }
}
