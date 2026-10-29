import Decimal from 'decimal.js';
import { FuelConsumptionInput, FuelAuditResult, TripExpenseInput } from '../types/domain';

Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export interface MultiPumpParchiReconciliationInput {
  distanceRunKm: number;
  parchiExpenses: TripExpenseInput[];
  initialTankLitres?: number;
  finalTankLitres?: number;
  telematicsReportedConsumptionLitres?: number;
  idleHours?: number;
  unexplainedIdleDropLitres?: number;
}

export interface MultiPumpReconciliationResult extends FuelAuditResult {
  totalParchiLitres: number;
  totalParchiAmount: number;
  averageDieselRate: number;
  telemetryVsParchiDiscrepancyLitres?: number;
}

export class FuelAuditService {
  // Loaded consumption benchmark: 3.0 km/L
  public static readonly BENCHMARK_KMPL = 3.0;
  // Variance Alert Threshold: < 2.6 km/L
  public static readonly ALERT_THRESHOLD_KMPL = 2.6;
  public static readonly ALERT_FLAG = 'POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK';

  /**
   * Audits fuel consumption against the 3.0 km/L benchmark.
   * Flags consumption dropping below 2.6 km/L or unexplained tank drops.
   */
  public static auditFuelConsumption(input: FuelConsumptionInput): FuelAuditResult {
    const distanceKm = new Decimal(input.distanceRunKm);
    if (distanceKm.isNegative() || distanceKm.isZero()) {
      throw new Error(`Distance run must be strictly positive. Received: ${input.distanceRunKm}`);
    }

    // Determine actual fuel consumed:
    // If tank levels are provided: Fuel Consumed = initialTank + purchased - finalTank
    // Otherwise: Fuel Consumed = purchased
    let fuelConsumed: Decimal;
    const purchased = new Decimal(input.totalDieselLitresPurchased);

    if (purchased.isNegative()) {
      throw new Error(`Purchased fuel cannot be negative. Received: ${input.totalDieselLitresPurchased}`);
    }

    if (input.initialTankLitres !== undefined && input.finalTankLitres !== undefined) {
      const initial = new Decimal(input.initialTankLitres);
      const finalTank = new Decimal(input.finalTankLitres);
      if (initial.isNegative() || finalTank.isNegative()) {
        throw new Error('Tank levels cannot be negative.');
      }
      fuelConsumed = initial.plus(purchased).minus(finalTank);
    } else {
      fuelConsumed = purchased;
    }

    if (fuelConsumed.isNegative() || fuelConsumed.isZero()) {
      throw new Error('Total fuel consumed must be greater than zero for audit analysis.');
    }

    // Calculated km/L = distance / fuelConsumed
    const calculatedKmpl = distanceKm.dividedBy(fuelConsumed).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const benchmark = new Decimal(this.BENCHMARK_KMPL);
    const threshold = new Decimal(this.ALERT_THRESHOLD_KMPL);

    // Variance = Calculated km/L - Benchmark km/L
    const varianceKmpl = calculatedKmpl.minus(benchmark).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const variancePercentage = varianceKmpl.dividedBy(benchmark).times(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    // Benchmark fuel expected = distance / 3.0
    const expectedFuelLitres = distanceKm.dividedBy(benchmark).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const fuelDiscrepancyLitres = fuelConsumed.minus(expectedFuelLitres).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const notes: string[] = [];
    let isVarianceAlertTriggered = false;

    // Check mileage threshold: below 2.6 km/L triggers alert
    if (calculatedKmpl.lessThan(threshold)) {
      isVarianceAlertTriggered = true;
      notes.push(
        `CRITICAL VARIANCE: Mileage (${calculatedKmpl.toFixed(2)} km/L) fell below threshold of ${threshold.toFixed(2)} km/L (${variancePercentage.toFixed(1)}% vs 3.0 benchmark). Discrepancy: ${fuelDiscrepancyLitres.toFixed(2)} excess litres burned.`
      );
    } else {
      notes.push(
        `NORMAL CONSUMPTION: Mileage (${calculatedKmpl.toFixed(2)} km/L) meets fleet operational expectations.`
      );
    }

    // Check unexplained idle tank drop / siphoning during idle ignition
    if (input.unexplainedIdleDropLitres && input.unexplainedIdleDropLitres > 0) {
      const drop = new Decimal(input.unexplainedIdleDropLitres);
      isVarianceAlertTriggered = true;
      notes.push(
        `UNEXPLAINED TANK DROP: Detected ${drop.toFixed(2)} Litres sudden level drop during idle/stationary window.`
      );
    }

    return {
      distanceRunKm: distanceKm.toNumber(),
      fuelConsumedLitres: fuelConsumed.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      calculatedKmpl: calculatedKmpl.toNumber(),
      benchmarkKmpl: benchmark.toNumber(),
      varianceKmpl: varianceKmpl.toNumber(),
      variancePercentage: variancePercentage.toNumber(),
      isVarianceAlertTriggered,
      alertFlag: isVarianceAlertTriggered ? this.ALERT_FLAG : null,
      fuelDiscrepancyLitres: fuelDiscrepancyLitres.toNumber(),
      reconciliationNotes: notes
    };
  }

  /**
   * Reconciles multiple pump credit slips (Parchi) along the corridor against telematics sensor data.
   * Handles multi-pump parchi entries with varying diesel rates and pump locations.
   */
  public static reconcileMultiPumpParchi(input: MultiPumpParchiReconciliationInput): MultiPumpReconciliationResult {
    let totalParchiLitres = new Decimal(0);
    let totalParchiAmount = new Decimal(0);

    const dieselSlips = input.parchiExpenses.filter((e) => e.category === 'DIESEL');

    for (const slip of dieselSlips) {
      if (slip.amount < 0) {
        throw new Error(`Parchi amount cannot be negative. Found: ${slip.amount}`);
      }
      totalParchiAmount = totalParchiAmount.plus(new Decimal(slip.amount));

      if (slip.fuelLitres && slip.fuelLitres > 0) {
        totalParchiLitres = totalParchiLitres.plus(new Decimal(slip.fuelLitres));
      } else if (slip.fuelRatePerLitre && slip.fuelRatePerLitre > 0) {
        // Compute litres from amount / rate if litres field omitted on receipt
        const derivedLitres = new Decimal(slip.amount).dividedBy(new Decimal(slip.fuelRatePerLitre));
        totalParchiLitres = totalParchiLitres.plus(derivedLitres);
      }
    }

    if (totalParchiLitres.isZero() && dieselSlips.length > 0) {
      throw new Error('Multi-pump parchi entries must include valid litres or fuel rate per litre.');
    }

    const averageRate = totalParchiLitres.greaterThan(0)
      ? totalParchiAmount.dividedBy(totalParchiLitres).toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
      : new Decimal(0);

    const baseAudit = this.auditFuelConsumption({
      distanceRunKm: input.distanceRunKm,
      totalDieselLitresPurchased: totalParchiLitres.toNumber(),
      initialTankLitres: input.initialTankLitres,
      finalTankLitres: input.finalTankLitres,
      idleHours: input.idleHours,
      unexplainedIdleDropLitres: input.unexplainedIdleDropLitres
    });

    let telemetryVsParchiDiscrepancyLitres: number | undefined;
    if (input.telematicsReportedConsumptionLitres !== undefined) {
      const telem = new Decimal(input.telematicsReportedConsumptionLitres);
      const diff = telem.minus(baseAudit.fuelConsumedLitres).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
      telemetryVsParchiDiscrepancyLitres = diff.toNumber();

      if (diff.abs().greaterThan(5.0)) {
        baseAudit.isVarianceAlertTriggered = true;
        baseAudit.alertFlag = this.ALERT_FLAG;
        baseAudit.reconciliationNotes.push(
          `TELEMATICS MISMATCH: Telematics reported ${telem.toFixed(2)}L vs Parchi/Tank reconciliation of ${baseAudit.fuelConsumedLitres.toFixed(2)}L (Delta: ${diff.toFixed(2)}L).`
        );
      }
    }

    return {
      ...baseAudit,
      totalParchiLitres: totalParchiLitres.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      totalParchiAmount: totalParchiAmount.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      averageDieselRate: averageRate.toNumber(),
      telemetryVsParchiDiscrepancyLitres
    };
  }

  /**
   * Evaluates sudden tank drops between consecutive telematics pings during stationary/idle state.
   */
  public static detectIdleSiphoning(
    previousFuelLevel: number,
    currentFuelLevel: number,
    isIgnitionOn: boolean,
    speedKmh: number,
    timeDeltaSeconds: number
  ): { isSiphoningSuspected: boolean; dropLitres: number; message: string } {
    const prev = new Decimal(previousFuelLevel);
    const curr = new Decimal(currentFuelLevel);
    const drop = prev.minus(curr);

    // Normal idle burn for a commercial heavy truck is ~1.5 to 2.5 Litres per hour (approx 0.04L to 0.07L per minute)
    // If vehicle speed is 0 km/h and fuel drops by > 3 Litres in a short window (< 10 minutes), siphoning is indicated.
    const isStationary = speedKmh <= 1.0;
    const isRapidDrop = drop.greaterThan(3.0); // > 3 litres drop
    const isShortWindow = timeDeltaSeconds <= 600; // <= 10 minutes

    if (isStationary && isRapidDrop && isShortWindow) {
      return {
        isSiphoningSuspected: true,
        dropLitres: drop.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
        message: `SIPHONING ALERT: Sudden loss of ${drop.toFixed(2)} Litres in ${timeDeltaSeconds} seconds while stationary (Ignition: ${isIgnitionOn ? 'IDLE' : 'OFF'}).`
      };
    }

    return {
      isSiphoningSuspected: false,
      dropLitres: drop.greaterThan(0) ? drop.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber() : 0,
      message: 'Fuel flow within normal stationary consumption envelope.'
    };
  }
}
