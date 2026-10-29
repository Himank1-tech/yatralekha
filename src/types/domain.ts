/**
 * YatraLekha Domain Types & Constants
 * Core domain specifications for Indian heavy-haul commercial fleet management
 */

export type AxleConfiguration = '10_WHEELER' | '12_WHEELER' | '16_WHEELER';

export interface VehicleAssetBenchmark {
  axleConfiguration: AxleConfiguration;
  passingGvwKg: number;
  unladenTareKg: number;
  maxLegalPayloadKg: number;
  description: string;
}

export const FLEET_ASSET_BENCHMARKS: Record<AxleConfiguration, VehicleAssetBenchmark> = {
  '10_WHEELER': {
    axleConfiguration: '10_WHEELER',
    passingGvwKg: 28000,
    unladenTareKg: 9000,
    maxLegalPayloadKg: 19000,
    description: '10-Wheeler (6x2 rigid haulage)'
  },
  '12_WHEELER': {
    axleConfiguration: '12_WHEELER',
    passingGvwKg: 35000,
    unladenTareKg: 11000,
    maxLegalPayloadKg: 24000,
    description: '12-Wheeler (8x2 lift-axle haulage)'
  },
  '16_WHEELER': {
    axleConfiguration: '16_WHEELER',
    passingGvwKg: 47500,
    unladenTareKg: 17500,
    maxLegalPayloadKg: 30000,
    description: '16-Wheeler (Twin-steer multi-axle trailer)'
  }
};

export interface WeightEnforcementInput {
  axleConfiguration: AxleConfiguration;
  billedWeightTonnes: number;
  actualTareWeightKg?: number; // Optional custom tare, defaults to standard benchmark
  customGvwLimitKg?: number;   // Optional custom RC passing GVW
}

export interface WeightEnforcementResult {
  isOverloaded: boolean;
  billedWeightTonnes: number;
  billedPayloadKg: number;
  tareWeightKg: number;
  totalCalculatedGvwKg: number;
  legalGvwLimitKg: number;
  excessPayloadKg: number;
  alertFlag: 'OVERLOAD_RISK_FLAG' | null;
  message: string;
}

export type RateType = 'PER_TONNE' | 'FIXED';

export type ExpenseCategory =
  | 'DIESEL'
  | 'TOLL_FASTAG'
  | 'DRIVER_BHATTA'
  | 'HAMALI'
  | 'RTO_POLICE_CHIT'
  | 'MAINTENANCE';

export type PaymentSource = 'CASH' | 'PUMP_CREDIT_PARCHI' | 'FASTAG_WALLET';

export interface TripExpenseInput {
  category: ExpenseCategory;
  paymentSource: PaymentSource;
  amount: number;
  fuelLitres?: number;
  fuelRatePerLitre?: number;
  pumpStationName?: string;
  pumpSlipNumber?: string;
  receiptHash?: string;
  memo?: string;
}

export interface TripBillingInput {
  billedWeightTonnes: number;
  rateType: RateType;
  freightRate: number; // ₹ per MT or fixed ₹ lump-sum
  advancePercentage?: number; // Typically 70% to 80% (0.70 to 0.80)
}

export interface TripBillingResult {
  billedWeightTonnes: number;
  rateType: RateType;
  freightRate: number;
  grossFreight: number;
  advanceAmount: number;
  balancePodDue: number;
  advancePercentage: number;
  podBalancePercentage: number;
}

export interface TripContributionInput {
  grossFreightAmount: number;
  expenses: TripExpenseInput[];
}

export interface ExpenseBreakdown {
  dieselTotal: number;
  tollFastagTotal: number;
  driverBhattaTotal: number;
  hamaliTotal: number;
  incidentalsChitsTotal: number;
  maintenanceTotal: number;
  totalExpenses: number;
}

export interface TripContributionResult {
  grossFreightAmount: number;
  expenseBreakdown: ExpenseBreakdown;
  netContribution: number;
  operatingMarginPercent: number;
  isLossMaking: boolean;
}

export interface BackhaulBreakEvenInput {
  projectedReturnDieselCost: number;
  projectedTollsCost: number;
  driverBhattaCost: number;
  dailyAllocatedEmi: number;
  ratedReturnPayloadTonnes: number;
}

export interface BackhaulBreakEvenResult {
  ratedReturnPayloadTonnes: number;
  totalDirectReturnCost: number;
  minAcceptableFreightRatePerTonne: number;
  minAcceptableLumpSum: number;
}

export interface FixedOverheadInput {
  monthlyEmi: number;
  driverMonthlySalary?: number; // Defaults to ₹12,000
  cleanerMonthlySalary?: number; // Defaults to ₹5,000
  annualInsuranceAndTaxes?: number; // Defaults to ₹60,000
  daysInMonth?: number; // Defaults to 30
}

export interface DailyFixedBurnResult {
  monthlyEmi: number;
  crewMonthlyPayroll: number;
  proRatedMonthlyInsuranceTaxes: number;
  totalMonthlyFixedCost: number;
  dailyFixedBurn: number;
  hourlyFixedBurn: number;
}

export interface FuelConsumptionInput {
  distanceRunKm: number;
  totalDieselLitresPurchased: number;
  initialTankLitres?: number;
  finalTankLitres?: number;
  idleHours?: number;
  unexplainedIdleDropLitres?: number;
}

export interface FuelAuditResult {
  distanceRunKm: number;
  fuelConsumedLitres: number;
  calculatedKmpl: number;
  benchmarkKmpl: number; // 3.0 km/L
  varianceKmpl: number;
  variancePercentage: number;
  isVarianceAlertTriggered: boolean;
  alertFlag: 'POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK' | null;
  fuelDiscrepancyLitres: number; // Litres consumed above benchmark
  reconciliationNotes: string[];
}

export type DocumentType = 'PERMIT' | 'FITNESS' | 'INSURANCE' | 'ROAD_TAX' | 'PUC';

export interface DocumentVerificationInput {
  documentType: DocumentType;
  vehicleRegistrationDate: Date;
  issueDate: Date;
  expiryDate: Date;
  currentDate?: Date;
}

export type ComplianceAlertTier = '30_DAYS' | '15_DAYS' | '3_DAYS' | 'EXPIRED' | 'COMPLIANT';

export interface ComplianceEvaluationResult {
  documentType: DocumentType;
  vehicleAgeYears: number;
  isValidityCycleValid: boolean;
  expectedCycleYearsOrMonths: string;
  daysRemaining: number;
  alertTier: ComplianceAlertTier;
  isExpiringSoon: boolean;
  message: string;
}
