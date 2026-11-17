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

// ==========================================
// YatraLekha v2.0 Super-App Domain Types
// ==========================================

export type FreightLoadStatus = 'AVAILABLE' | 'BOOKED' | 'EXPIRED';
export type BodyType = 'DALA' | 'CONTAINER' | 'FLATBED' | 'TANKER';

export interface FreightLoad {
  id: string;
  origin: string;
  destination: string;
  corridorName: string;
  materialType: string;
  weightTonnes: number;
  requiredAxleType: AxleConfiguration | 'TRAILER';
  bodyType: BodyType;
  offeredRate: number;
  rateType: RateType;
  advancePercent: number;
  balancePaymentTerms: string;
  shipperName: string;
  shipperPhone: string;
  isVerifiedShipper: boolean;
  status: FreightLoadStatus;
  createdAt: Date;
}

export type ContactRole = 'Broker' | 'Driver' | 'Shipper' | 'Mandi Agent' | 'Pump Agent';
export type CallType = 'INCOMING' | 'OUTGOING' | 'MISSED';
export type DealStatus = 'RATE_CONFIRMED' | 'RATE_TOO_LOW' | 'POD_FOLLOWUP' | 'EN_ROUTE' | 'NEGOTIATING';

export interface CallLog {
  id: string;
  organizationId: string;
  contactName: string;
  contactRole: ContactRole;
  phoneNumber: string;
  laneDiscussed: string;
  callType: CallType;
  durationSeconds: number;
  dealStatus: DealStatus;
  notes?: string;
  createdAt: Date;
}

export type VerificationType = 'VAHAN_RC' | 'SARATHI_DL' | 'PAN_KYC' | 'AADHAAR_KYC';

export interface VerifiedEntity {
  id: string;
  organizationId: string;
  verificationType: VerificationType;
  identifierNumber: string;
  holderName?: string;
  verificationStatus: 'VERIFIED' | 'FAILED' | 'PENDING';
  payload: Record<string, any>;
  verifiedAt: Date;
}

export type PodRecoveryStatus = 'PENDING' | 'OVERDUE' | 'LEGAL_NOTICE_SENT' | 'SETTLED';

export interface PodBalanceClaim {
  id: string;
  tripId?: string;
  brokerName: string;
  brokerPhone: string;
  biltyNumber: string;
  origin: string;
  destination: string;
  vehicleNumber: string;
  totalFreight: number;
  advancePaid: number;
  balanceDue: number;
  unloadingDate: Date;
  dueDate: Date;
  recoveryStatus: PodRecoveryStatus;
  daysOverdue: number;
  isOverdue: boolean;
  podDocumentUrl?: string;
  disputeNotes?: string;
  brokerRiskTier: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK_DEF_DEFAULTER';
  createdAt: Date;
}

export interface AntiOverloadCalculation {
  registrationNumber: string;
  axleConfiguration: AxleConfiguration;
  passingGvwKg: number;
  tareWeightKg: number;
  legalMaxPayloadKg: number;
  actualLoadedPayloadKg: number;
  actualGrossWeightKg: number;
  isOverloaded: boolean;
  excessWeightKg: number;
  excessTonnes: number;
  section194BaseFine: number;
  section194ExcessFine: number;
  totalSection194Fine: number;
  riskSeverity: 'SAFE_COMPLIANT' | 'CRITICAL_OVERLOAD_RISK';
}
