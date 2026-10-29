import { TripFinanceEngine } from '../src/services/TripFinanceEngine';
import { TripExpenseInput } from '../src/types/domain';

describe('TripFinanceEngine', () => {
  describe('Asset Specifications & Legal Weight Enforcement', () => {
    test('10-Wheeler (6x2): compliant within 19.0 MT legal payload limit', () => {
      const result = TripFinanceEngine.validateLegalWeight({
        axleConfiguration: '10_WHEELER',
        billedWeightTonnes: 19.0
      });

      expect(result.isOverloaded).toBe(false);
      expect(result.alertFlag).toBeNull();
      expect(result.totalCalculatedGvwKg).toBe(28000); // 19000 payload + 9000 tare
      expect(result.excessPayloadKg).toBe(0);
    });

    test('10-Wheeler (6x2): triggers OVERLOAD_RISK_FLAG when exceeding 28.0 MT GVW', () => {
      const result = TripFinanceEngine.validateLegalWeight({
        axleConfiguration: '10_WHEELER',
        billedWeightTonnes: 21.5 // 2.5 MT overload
      });

      expect(result.isOverloaded).toBe(true);
      expect(result.alertFlag).toBe('OVERLOAD_RISK_FLAG');
      expect(result.excessPayloadKg).toBe(2500);
      expect(result.totalCalculatedGvwKg).toBe(30500);
      expect(result.message).toContain('OVERLOAD VIOLATION');
    });

    test('12-Wheeler (8x2): verifies 24.0 MT payload benchmark against 35.0 MT GVW', () => {
      const result = TripFinanceEngine.validateLegalWeight({
        axleConfiguration: '12_WHEELER',
        billedWeightTonnes: 24.0
      });

      expect(result.isOverloaded).toBe(false);
      expect(result.totalCalculatedGvwKg).toBe(35000); // 24000 payload + 11000 tare
      expect(result.legalGvwLimitKg).toBe(35000);
    });

    test('16-Wheeler: handles fractional weighbridge weights with exact precision', () => {
      // 30.005 MT payload -> exceeds 30.0 MT legal payload by 5 kg
      const result = TripFinanceEngine.validateLegalWeight({
        axleConfiguration: '16_WHEELER',
        billedWeightTonnes: 30.005
      });

      expect(result.isOverloaded).toBe(true);
      expect(result.excessPayloadKg).toBe(5);
      expect(result.alertFlag).toBe('OVERLOAD_RISK_FLAG');
    });

    test('accepts custom tare weight from physical Dharam Kanta weighbridge ticket', () => {
      const result = TripFinanceEngine.validateLegalWeight({
        axleConfiguration: '10_WHEELER',
        billedWeightTonnes: 18.5,
        actualTareWeightKg: 9600 // heavier custom body
      });

      // 18500 + 9600 = 28100 kg (> 28000 kg GVW limit)
      expect(result.isOverloaded).toBe(true);
      expect(result.excessPayloadKg).toBe(100);
      expect(result.alertFlag).toBe('OVERLOAD_RISK_FLAG');
    });

    test('rejects negative or zero billed weight', () => {
      expect(() => {
        TripFinanceEngine.validateLegalWeight({
          axleConfiguration: '10_WHEELER',
          billedWeightTonnes: 0
        });
      }).toThrow('Billed weight must be strictly positive');
    });
  });

  describe('Route Economics & Khata Cash-Flow Mechanics', () => {
    test('Long-Haul (Nagpur ↔ Pune, ~720 km): computes 75% advance & 25% POD balance split to exact paise', () => {
      const billing = TripFinanceEngine.calculateTripBilling({
        billedWeightTonnes: 24.5,
        rateType: 'PER_TONNE',
        freightRate: 1150, // ₹1,150 / MT
        advancePercentage: 0.75
      });

      // Gross = 24.5 * 1150 = 28,175.00
      expect(billing.grossFreight).toBe(28175.0);
      // Advance = 28,175 * 0.75 = 21,131.25
      expect(billing.advanceAmount).toBe(21131.25);
      // POD Balance = 28,175 - 21,131.25 = 7,043.75
      expect(billing.balancePodDue).toBe(7043.75);
      expect(billing.grossFreight).toBe(billing.advanceAmount + billing.balancePodDue);
    });

    test('Short-Haul (Nagpur ↔ Bhandara, ~65 km): handles fixed rate contract', () => {
      const billing = TripFinanceEngine.calculateTripBilling({
        billedWeightTonnes: 22.0,
        rateType: 'FIXED',
        freightRate: 5500, // ₹5,500 fixed round-trip rate
        advancePercentage: 0.8
      });

      expect(billing.grossFreight).toBe(5500.0);
      expect(billing.advanceAmount).toBe(4400.0); // 80%
      expect(billing.balancePodDue).toBe(1100.0);  // 20%
    });

    test('Trip Contribution Formula: computes operating margin across all expense categories', () => {
      const expenses: TripExpenseInput[] = [
        { category: 'DIESEL', paymentSource: 'PUMP_CREDIT_PARCHI', amount: 16500 },
        { category: 'TOLL_FASTAG', paymentSource: 'FASTAG_WALLET', amount: 3800 },
        { category: 'DRIVER_BHATTA', paymentSource: 'CASH', amount: 2500 },
        { category: 'HAMALI', paymentSource: 'CASH', amount: 1200 },
        { category: 'RTO_POLICE_CHIT', paymentSource: 'CASH', amount: 500 }
      ];

      const contribution = TripFinanceEngine.calculateTripContribution({
        grossFreightAmount: 32000,
        expenses
      });

      // Total Expenses = 16500 + 3800 + 2500 + 1200 + 500 = 24500
      expect(contribution.expenseBreakdown.totalExpenses).toBe(24500);
      // Net Contribution = 32000 - 24500 = 7500
      expect(contribution.netContribution).toBe(7500);
      // Margin = (7500 / 32000) * 100 = 23.44%
      expect(contribution.operatingMarginPercent).toBe(23.44);
      expect(contribution.isLossMaking).toBe(false);
    });

    test('Negative Margin: accurately detects loss-making trip when operating burn exceeds freight', () => {
      const expenses: TripExpenseInput[] = [
        { category: 'DIESEL', paymentSource: 'PUMP_CREDIT_PARCHI', amount: 22000 },
        { category: 'TOLL_FASTAG', paymentSource: 'FASTAG_WALLET', amount: 4500 },
        { category: 'MAINTENANCE', paymentSource: 'CASH', amount: 8000 } // sudden breakdown
      ];

      const contribution = TripFinanceEngine.calculateTripContribution({
        grossFreightAmount: 30000,
        expenses
      });

      // Total Expenses = 34500
      // Net Contribution = 30000 - 34500 = -4500
      expect(contribution.netContribution).toBe(-4500);
      expect(contribution.operatingMarginPercent).toBe(-15.0);
      expect(contribution.isLossMaking).toBe(true);
    });

    test('Return Load (Backhaul) Break-Even Calculator: computes min acceptable rate per MT', () => {
      const breakEven = TripFinanceEngine.calculateBackhaulBreakEven({
        projectedReturnDieselCost: 14500,
        projectedTollsCost: 3500,
        driverBhattaCost: 2000,
        dailyAllocatedEmi: 1500,
        ratedReturnPayloadTonnes: 24.0
      });

      // Total direct return cost = 14500 + 3500 + 2000 + 1500 = 21,500
      expect(breakEven.totalDirectReturnCost).toBe(21500);
      // Min rate per MT = 21500 / 24 = 895.83
      expect(breakEven.minAcceptableFreightRatePerTonne).toBe(895.83);
      expect(breakEven.minAcceptableLumpSum).toBe(21500);
    });

    test('Daily Fixed Burn: computes crew payroll (₹17k), EMI, and pro-rated insurance', () => {
      const burn = TripFinanceEngine.calculateDailyFixedBurn({
        monthlyEmi: 45000, // Typical 10-wheeler EMI
        driverMonthlySalary: 12000,
        cleanerMonthlySalary: 5000,
        annualInsuranceAndTaxes: 60000, // ₹5,000 / mo
        daysInMonth: 30
      });

      expect(burn.crewMonthlyPayroll).toBe(17000);
      expect(burn.proRatedMonthlyInsuranceTaxes).toBe(5000);
      // Total monthly = 45000 + 17000 + 5000 = 67,000
      expect(burn.totalMonthlyFixedCost).toBe(67000);
      // Daily burn = 67000 / 30 = 2233.33
      expect(burn.dailyFixedBurn).toBe(2233.33);
      // Hourly burn = 2233.33 / 24 = 93.06
      expect(burn.hourlyFixedBurn).toBe(93.06);
    });
  });
});
