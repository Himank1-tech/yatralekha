import { Ais140Parser } from '../src/parsers/Ais140Parser';
import { TelematicsIngestionWorker } from '../src/services/TelematicsIngestionWorker';

describe('Ais140Parser & TelematicsIngestionWorker', () => {
  beforeEach(() => {
    TelematicsIngestionWorker.resetState();
  });

  describe('AIS-140 Packet Parser', () => {
    test('correctly decodes standard $PKT tracking packet', () => {
      // Sample AIS-140 packet
      // $PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,58.4,14250.8,0001,0000,165.4,0.0,Airtel
      const raw =
        '$PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,58.4,14250.8,0001,0000,165.4,0.0,Airtel';

      const parsed = Ais140Parser.parse(raw);

      expect(parsed.header).toBe('$PKT');
      expect(parsed.vendorId).toBe('MIND');
      expect(parsed.firmwareVersion).toBe('v2.1');
      expect(parsed.packetType).toBe('NORMAL');
      expect(parsed.isGpsValid).toBe(true);
      expect(parsed.imei).toBe('867530901234567');
      expect(parsed.vehicleRegistrationNumber).toBe('MH40AK1234');
      expect(parsed.latitude).toBeCloseTo(21.1458);
      expect(parsed.longitude).toBeCloseTo(79.0882);
      expect(parsed.speedKmh).toBe(58.4);
      expect(parsed.odometerKm).toBe(14250.8);
      expect(parsed.ignitionOn).toBe(true); // Bit 0 of '0001' is 1
      expect(parsed.emergencyButtonPressed).toBe(false);
      expect(parsed.fuelSensorLitres).toBe(165.4);
      expect(parsed.networkOperator).toBe('Airtel');
    });

    test('detects ignition OFF from bitmask', () => {
      const raw =
        '$PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,0.0,14250.8,0000,0000,165.4,0.0,Airtel';

      const parsed = Ais140Parser.parse(raw);
      expect(parsed.ignitionOn).toBe(false);
      expect(parsed.speedKmh).toBe(0.0);
    });

    test('identifies Emergency SOS button press ($EPB / bitmask 0003)', () => {
      const raw =
        '$EPB,MIND,v2.1,EA,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,0.0,14250.8,0003,0000,165.4,0.0,Airtel';

      const parsed = Ais140Parser.parse(raw);
      expect(parsed.packetType).toBe('EMERGENCY');
      expect(parsed.emergencyButtonPressed).toBe(true);
    });

    test('verifies XOR checksum when present (*HEX)', () => {
      // Calculate checksum for: PKT,TEST,v1.0,NR,1,A,123456789012345,MH31AP9999,0,0,10,291026,120000,20.0,N,78.0,E,0,0,0000,0000,100,0,Jio
      const payloadWithoutDollar =
        'PKT,TEST,v1.0,NR,1,A,123456789012345,MH31AP9999,0,0,10,291026,120000,20.0,N,78.0,E,0,0,0000,0000,100,0,Jio';

      let chk = 0;
      for (let i = 0; i < payloadWithoutDollar.length; i++) {
        chk ^= payloadWithoutDollar.charCodeAt(i);
      }
      const chkHex = chk.toString(16).toUpperCase().padStart(2, '0');

      const rawWithChecksum = `$${payloadWithoutDollar}*${chkHex}`;
      const parsed = Ais140Parser.parse(rawWithChecksum);
      expect(parsed.checksumValid).toBe(true);
    });

    test('rejects non-AIS-140 payload lacking $ header', () => {
      expect(() => {
        Ais140Parser.parse('INVALID_PAYLOAD_STRING');
      }).toThrow("Invalid AIS-140 packet header: must start with '$'");
    });
  });

  describe('TelematicsIngestionWorker Pipeline', () => {
    test('processes stream ping and detects sudden stationary fuel drop (siphoning)', () => {
      // First ping: Stationary vehicle at Dhaba on Samruddhi Mahamarg, Fuel: 180 Litres
      const ping1 =
        '$PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,140000,20.5000,N,78.5000,E,0.0,14250.8,0000,0000,180.0,0.0,Airtel';
      const event1 = TelematicsIngestionWorker.processRawPacket(ping1);
      expect(event1.isSiphoningAlert).toBe(false);

      // Second ping 2 minutes later (14:02:00): Speed 0 km/h, Fuel dropped to 160 Litres (20L lost!)
      const ping2 =
        '$PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,140200,20.5000,N,78.5000,E,0.0,14250.8,0000,0000,160.0,0.0,Airtel';
      const event2 = TelematicsIngestionWorker.processRawPacket(ping2);

      expect(event2.isSiphoningAlert).toBe(true);
      expect(event2.siphoningDropLitres).toBe(20.0);
      expect(event2.alertMessage).toContain('SIPHONING ALERT');
      expect(event2.dbRow.imei).toBe('867530901234567');
      expect(event2.dbRow.fuelSensorLitres).toBe(160.0);
    });
  });
});
