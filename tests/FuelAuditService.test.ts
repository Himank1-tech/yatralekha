import { FuelAuditService } from '../src/services/FuelAuditService';
import { TripExpenseInput } from '../src/types/domain';

describe('FuelAuditService', () => {
  describe('Benchmark & Variance Evaluation', () => {
    test('verifies exact 3.0 km/L loaded consumption baseline with zero discrepancy', () => {
      // 720 km running on 240 Litres = 3.00 km/L
      const result = FuelAuditService.auditFuelConsumption({
        distanceRunKm: 720,
        totalDieselLitresPurchased: 240
      });

      expect(result.calculatedKmpl).toBe(3.0);
      expect(result.benchmarkKmpl).toBe(3.0);
      expect(result.varianceKmpl).toBe(0.0);
      expect(result.variancePercentage).toBe(0.0);
      expect(result.isVarianceAlertTriggered).toBe(false);
      expect(result.alertFlag).toBeNull();
      expect(result.fuelDiscrepancyLitres).toBe(0.0);
    });

    test('triggers POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK when mileage falls below 2.6 km/L', () => {
      // 720 km with 300 Litres consumed = 2.40 km/L (< 2.6 threshold)
      const result = FuelAuditService.auditFuelConsumption({
        distanceRunKm: 720,
        totalDieselLitresPurchased: 300
      });

      expect(result.calculatedKmpl).toBe(2.4);
      expect(result.isVarianceAlertTriggered).toBe(true);
      expect(result.alertFlag).toBe('POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK');
      // At 3.0 km/L, 720 km should take 240L -> Discrepancy is 300 - 240 = 60 Litres excess
      expect(result.fuelDiscrepancyLitres).toBe(60.0);
      expect(result.reconciliationNotes[0]).toContain('CRITICAL VARIANCE');
    });

    test('considers tank level deltas (initial + purchased - final) for true burn', () => {
      // Initial: 100L, Purchased: 200L, Final: 50L -> Consumed: 100 + 200 - 50 = 250L
      // Distance: 750 km -> 750 / 250 = 3.00 km/L
      const result = FuelAuditService.auditFuelConsumption({
        distanceRunKm: 750,
        totalDieselLitresPurchased: 200,
        initialTankLitres: 100,
        finalTankLitres: 50
      });

      expect(result.fuelConsumedLitres).toBe(250.0);
      expect(result.calculatedKmpl).toBe(3.0);
      expect(result.isVarianceAlertTriggered).toBe(false);
    });

    test('triggers alert if unexplained idle drop is reported', () => {
      // Mileage is 3.1 km/L (good), but 12L disappeared while stationary
      const result = FuelAuditService.auditFuelConsumption({
        distanceRunKm: 620,
        totalDieselLitresPurchased: 200,
        unexplainedIdleDropLitres: 12.0
      });

      expect(result.isVarianceAlertTriggered).toBe(true);
      expect(result.alertFlag).toBe('POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK');
      expect(result.reconciliationNotes.some((n) => n.includes('UNEXPLAINED TANK DROP'))).toBe(true);
    });
  });

  describe('Multi-Pump Parchi Reconciliation', () => {
    test('reconciles multiple pump slips across highway corridor', () => {
      // Nagpur to Pune corridor with 2 diesel fill-ups at partner pumps
      const parchiExpenses: TripExpenseInput[] = [
        {
          category: 'DIESEL',
          paymentSource: 'PUMP_CREDIT_PARCHI',
          amount: 11400,
          fuelLitres: 120,
          fuelRatePerLitre: 95.0,
          pumpStationName: 'BPCL Highway Oasis - Karanja Lad',
          pumpSlipNumber: 'PARCHI-BPCL-10492'
        },
        {
          category: 'DIESEL',
          paymentSource: 'PUMP_CREDIT_PARCHI',
          amount: 11520,
          fuelLitres: 120,
          fuelRatePerLitre: 96.0,
          pumpStationName: 'IOCL Swagat - Jalna Bypass',
          pumpSlipNumber: 'PARCHI-IOCL-8821'
        }
      ];

      const reconciliation = FuelAuditService.reconcileMultiPumpParchi({
        distanceRunKm: 720,
        parchiExpenses
      });

      expect(reconciliation.totalParchiLitres).toBe(240);
      expect(reconciliation.totalParchiAmount).toBe(22920);
      expect(reconciliation.averageDieselRate).toBe(95.5); // (11400 + 11520) / 240
      expect(reconciliation.calculatedKmpl).toBe(3.0);
      expect(reconciliation.isVarianceAlertTriggered).toBe(false);
    });

    test('flags discrepancy when telematics sensor does not match aggregate pump slips', () => {
      const parchiExpenses: TripExpenseInput[] = [
        {
          category: 'DIESEL',
          paymentSource: 'PUMP_CREDIT_PARCHI',
          amount: 19000,
          fuelLitres: 200,
          fuelRatePerLitre: 95.0
        }
      ];

      // Slips report 200L consumed, but telematics sensor logged 230L burned (30L unaccounted)
      const reconciliation = FuelAuditService.reconcileMultiPumpParchi({
        distanceRunKm: 600,
        parchiExpenses,
        telematicsReportedConsumptionLitres: 230
      });

      expect(reconciliation.telemetryVsParchiDiscrepancyLitres).toBe(30);
      expect(reconciliation.isVarianceAlertTriggered).toBe(true);
      expect(reconciliation.reconciliationNotes.some((n) => n.includes('TELEMATICS MISMATCH'))).toBe(true);
    });
  });

  describe('Idle Siphoning Detection', () => {
    test('identifies sudden stationary drop as siphoning', () => {
      // Vehicle stopped (0 km/h), fuel dropped from 180L to 165L (15L drop) in 180 seconds
      const check = FuelAuditService.detectIdleSiphoning(180, 165, false, 0, 180);

      expect(check.isSiphoningSuspected).toBe(true);
      expect(check.dropLitres).toBe(15);
      expect(check.message).toContain('SIPHONING ALERT');
    });

    test('ignores normal minor consumption while vehicle is running/moving', () => {
      // Vehicle moving at 45 km/h, 2L consumed over 300 seconds
      const check = FuelAuditService.detectIdleSiphoning(150, 148, true, 45, 300);

      expect(check.isSiphoningSuspected).toBe(false);
      expect(check.dropLitres).toBe(2);
    });
  });
});
