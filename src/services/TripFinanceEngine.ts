import Decimal from 'decimal.js';
import {
  AxleConfiguration,
  FLEET_ASSET_BENCHMARKS,
  WeightEnforcementInput,
  WeightEnforcementResult,
  TripBillingInput,
  TripBillingResult,
  TripContributionInput,
  TripContributionResult,
  ExpenseBreakdown,
  BackhaulBreakEvenInput,
  BackhaulBreakEvenResult,
  FixedOverheadInput,
  DailyFixedBurnResult
} from '../types/domain';

// Set Decimal precision to 20 digits for precision financial calculations
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

export class TripFinanceEngine {
  /**
   * Enforces legal passing weights according to RTO & Dharam Kanta (Weighbridge) benchmarks.
   * Compares (billed payload + tare weight) against certified Gross Vehicle Weight (GVW).
   */
  public static validateLegalWeight(input: WeightEnforcementInput): WeightEnforcementResult {
    const benchmark = FLEET_ASSET_BENCHMARKS[input.axleConfiguration];
    if (!benchmark) {
      throw new Error(`Unsupported axle configuration: ${input.axleConfiguration}`);
    }

    const billedWeightTonnes = new Decimal(input.billedWeightTonnes);
    if (billedWeightTonnes.isNegative() || billedWeightTonnes.isZero()) {
      throw new Error(`Billed weight must be strictly positive. Received: ${input.billedWeightTonnes}`);
    }

    const billedPayloadKg = billedWeightTonnes.times(1000);
    const tareWeightKg = new Decimal(input.actualTareWeightKg ?? benchmark.unladenTareKg);
    const legalGvwLimitKg = new Decimal(input.customGvwLimitKg ?? benchmark.passingGvwKg);

    const totalCalculatedGvwKg = billedPayloadKg.plus(tareWeightKg);
    const excessPayloadKg = totalCalculatedGvwKg.minus(legalGvwLimitKg);
    const isOverloaded = excessPayloadKg.greaterThan(0);

    return {
      isOverloaded,
      billedWeightTonnes: billedWeightTonnes.toNumber(),
      billedPayloadKg: billedPayloadKg.toNumber(),
      tareWeightKg: tareWeightKg.toNumber(),
      totalCalculatedGvwKg: totalCalculatedGvwKg.toNumber(),
      legalGvwLimitKg: legalGvwLimitKg.toNumber(),
      excessPayloadKg: isOverloaded ? excessPayloadKg.toNumber() : 0,
      alertFlag: isOverloaded ? 'OVERLOAD_RISK_FLAG' : null,
      message: isOverloaded
        ? `OVERLOAD VIOLATION: Total GVW (${totalCalculatedGvwKg.toFixed(2)} kg) exceeds legal passing limit (${legalGvwLimitKg.toFixed(2)} kg) by ${excessPayloadKg.toFixed(2)} kg.`
        : `COMPLIANT: Total GVW (${totalCalculatedGvwKg.toFixed(2)} kg) is within legal passing limit (${legalGvwLimitKg.toFixed(2)} kg).`
    };
  }

  /**
   * Calculates gross freight, advance cash/fuel slip disbursement (70% - 80%),
   * and retained Proof of Delivery (POD) balance (20% - 30%).
   */
  public static calculateTripBilling(input: TripBillingInput): TripBillingResult {
    const billedWeight = new Decimal(input.billedWeightTonnes);
    const rate = new Decimal(input.freightRate);

    if (billedWeight.isNegative() || billedWeight.isZero()) {
      throw new Error('Billed weight must be positive.');
    }
    if (rate.isNegative() || rate.isZero()) {
      throw new Error('Freight rate must be positive.');
    }

    // Default advance split: 75% advance (0.75) if not specified
    const advancePercentage = new Decimal(input.advancePercentage ?? 0.75);
    if (advancePercentage.lessThan(0) || advancePercentage.greaterThan(1)) {
      throw new Error('Advance percentage must be between 0.0 (0%) and 1.0 (100%).');
    }

    let grossFreight: Decimal;
    if (input.rateType === 'PER_TONNE') {
      grossFreight = billedWeight.times(rate).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    } else {
      grossFreight = rate.toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    }

    const advanceAmount = grossFreight.times(advancePercentage).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    // Guarantee exact zero-leakage split: balance = gross - advance
    const balancePodDue = grossFreight.minus(advanceAmount).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const podBalancePercentage = new Decimal(1).minus(advancePercentage);

    return {
      billedWeightTonnes: billedWeight.toNumber(),
      rateType: input.rateType,
      freightRate: rate.toNumber(),
      grossFreight: grossFreight.toNumber(),
      advanceAmount: advanceAmount.toNumber(),
      balancePodDue: balancePodDue.toNumber(),
      advancePercentage: advancePercentage.toNumber(),
      podBalancePercentage: podBalancePercentage.toNumber()
    };
  }

  /**
   * Calculates net trip contribution and flags negative margins:
   * Net Contribution = Gross Billed Freight - (Diesel + FASTag Toll + Driver Bhatta + Hamali + Incidentals/Chits)
   */
  public static calculateTripContribution(input: TripContributionInput): TripContributionResult {
    const grossFreight = new Decimal(input.grossFreightAmount);

    let dieselTotal = new Decimal(0);
    let tollFastagTotal = new Decimal(0);
    let driverBhattaTotal = new Decimal(0);
    let hamaliTotal = new Decimal(0);
    let incidentalsChitsTotal = new Decimal(0);
    let maintenanceTotal = new Decimal(0);

    for (const exp of input.expenses) {
      const expAmt = new Decimal(exp.amount);
      if (expAmt.isNegative()) {
        throw new Error(`Expense amount cannot be negative. Found: ${exp.amount} for category ${exp.category}`);
      }

      switch (exp.category) {
        case 'DIESEL':
          dieselTotal = dieselTotal.plus(expAmt);
          break;
        case 'TOLL_FASTAG':
          tollFastagTotal = tollFastagTotal.plus(expAmt);
          break;
        case 'DRIVER_BHATTA':
          driverBhattaTotal = driverBhattaTotal.plus(expAmt);
          break;
        case 'HAMALI':
          hamaliTotal = hamaliTotal.plus(expAmt);
          break;
        case 'RTO_POLICE_CHIT':
          incidentalsChitsTotal = incidentalsChitsTotal.plus(expAmt);
          break;
        case 'MAINTENANCE':
          maintenanceTotal = maintenanceTotal.plus(expAmt);
          break;
      }
    }

    const totalExpenses = dieselTotal
      .plus(tollFastagTotal)
      .plus(driverBhattaTotal)
      .plus(hamaliTotal)
      .plus(incidentalsChitsTotal)
      .plus(maintenanceTotal)
      .toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const netContribution = grossFreight.minus(totalExpenses).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    let operatingMarginPercent = 0;
    if (!grossFreight.isZero()) {
      operatingMarginPercent = netContribution
        .dividedBy(grossFreight)
        .times(100)
        .toDecimalPlaces(2, Decimal.ROUND_HALF_UP)
        .toNumber();
    }

    const breakdown: ExpenseBreakdown = {
      dieselTotal: dieselTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      tollFastagTotal: tollFastagTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      driverBhattaTotal: driverBhattaTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      hamaliTotal: hamaliTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      incidentalsChitsTotal: incidentalsChitsTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      maintenanceTotal: maintenanceTotal.toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber(),
      totalExpenses: totalExpenses.toNumber()
    };

    return {
      grossFreightAmount: grossFreight.toNumber(),
      expenseBreakdown: breakdown,
      netContribution: netContribution.toNumber(),
      operatingMarginPercent,
      isLossMaking: netContribution.isNegative()
    };
  }

  /**
   * Return Load (Backhaul) Break-Even Calculator:
   * Min Acceptable Rate = (Projected Return Diesel + Tolls + Driver Bhatta + Daily Allocated EMI) / Rated Return Payload
   */
  public static calculateBackhaulBreakEven(input: BackhaulBreakEvenInput): BackhaulBreakEvenResult {
    const payload = new Decimal(input.ratedReturnPayloadTonnes);
    if (payload.isNegative() || payload.isZero()) {
      throw new Error('Rated return payload tonnes must be positive.');
    }

    const diesel = new Decimal(input.projectedReturnDieselCost);
    const tolls = new Decimal(input.projectedTollsCost);
    const bhatta = new Decimal(input.driverBhattaCost);
    const emi = new Decimal(input.dailyAllocatedEmi);

    const totalDirectReturnCost = diesel.plus(tolls).plus(bhatta).plus(emi).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const minRatePerTonne = totalDirectReturnCost.dividedBy(payload).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      ratedReturnPayloadTonnes: payload.toNumber(),
      totalDirectReturnCost: totalDirectReturnCost.toNumber(),
      minAcceptableFreightRatePerTonne: minRatePerTonne.toNumber(),
      minAcceptableLumpSum: totalDirectReturnCost.toNumber()
    };
  }

  /**
   * Fixed Payroll & Fleet Capital Amortization:
   * Daily Fixed Burn = (Monthly EMI + Crew Payroll + Pro-rated Insurance/Taxes) / 30
   */
  public static calculateDailyFixedBurn(input: FixedOverheadInput): DailyFixedBurnResult {
    const emi = new Decimal(input.monthlyEmi);
    const driverSalary = new Decimal(input.driverMonthlySalary ?? 12000); // Standard Driver ₹12k
    const cleanerSalary = new Decimal(input.cleanerMonthlySalary ?? 5000);  // Standard Cleaner ₹5k
    const crewPayroll = driverSalary.plus(cleanerSalary);

    const annualInsuranceTaxes = new Decimal(input.annualInsuranceAndTaxes ?? 60000);
    const proRatedInsuranceTaxes = annualInsuranceTaxes.dividedBy(12).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    const totalMonthly = emi.plus(crewPayroll).plus(proRatedInsuranceTaxes).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const daysInMonth = new Decimal(input.daysInMonth ?? 30);

    const dailyBurn = totalMonthly.dividedBy(daysInMonth).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
    const hourlyBurn = dailyBurn.dividedBy(24).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);

    return {
      monthlyEmi: emi.toNumber(),
      crewMonthlyPayroll: crewPayroll.toNumber(),
      proRatedMonthlyInsuranceTaxes: proRatedInsuranceTaxes.toNumber(),
      totalMonthlyFixedCost: totalMonthly.toNumber(),
      dailyFixedBurn: dailyBurn.toNumber(),
      hourlyFixedBurn: hourlyBurn.toNumber()
    };
  }
}
