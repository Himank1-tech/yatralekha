export type AxleConfiguration = '10_WHEELER' | '12_WHEELER' | '16_WHEELER';

export interface Vehicle {
  id: string;
  organizationId: string;
  registrationNumber: string;
  chassisNumber: string;
  engineNumber: string;
  axleConfiguration: AxleConfiguration;
  tareWeightKg: number;
  grossVehicleWeightKg: number;
  maxLegalPayloadKg: number;
  monthlyEmi: number;
  crewMonthlyPayroll: number;
  annualInsuranceTax: number;
  ais140Imei?: string;
  currentDriverName?: string;
  currentDriverPhone?: string;
  createdAt: string;
  dailyFixedBurnMetrics?: {
    monthlyEmi: number;
    crewMonthlyPayroll: number;
    proRatedMonthlyInsuranceTaxes: number;
    totalMonthlyFixedCost: number;
    dailyFixedBurn: number;
    hourlyFixedBurn: number;
  };
}

export type RateType = 'PER_TONNE' | 'FIXED';
export type PodClearanceStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'DEFAULTED';

export type ExpenseCategory =
  | 'DIESEL'
  | 'TOLL_FASTAG'
  | 'DRIVER_BHATTA'
  | 'HAMALI'
  | 'RTO_POLICE_CHIT'
  | 'MAINTENANCE';

export type PaymentSource = 'CASH' | 'PUMP_CREDIT_PARCHI' | 'FASTAG_WALLET';

export interface TripExpense {
  id: string;
  category: ExpenseCategory;
  paymentSource: PaymentSource;
  amount: number;
  fuelLitres?: number;
  fuelRatePerLitre?: number;
  pumpStationName?: string;
  pumpSlipNumber?: string;
  receiptHash?: string;
  memo?: string;
  createdAt: string;
}

export interface Trip {
  id: string;
  organizationId: string;
  vehicleId: string;
  tripSerialNumber: string;
  origin: string;
  destination: string;
  corridorDistanceKm: number;
  billedWeightTonnes: number;
  rateType: RateType;
  freightRate: number;
  grossFreightAmount: number;
  advanceAmount: number;
  balancePodDue: number;
  podClearanceStatus: PodClearanceStatus;
  overloadRiskFlag: boolean;
  overloadExcessKg: number;
  expenses: TripExpense[];
  startedAt: string;
  completedAt?: string;
}

export type DocumentType = 'PERMIT' | 'FITNESS' | 'INSURANCE' | 'ROAD_TAX' | 'PUC';
export type ComplianceAlertTier = '30_DAYS' | '15_DAYS' | '3_DAYS' | 'EXPIRED' | 'COMPLIANT';

export interface StatutoryDocument {
  id: string;
  organizationId: string;
  vehicleId: string;
  documentType: DocumentType;
  documentNumber?: string;
  issueDate: string;
  expiryDate: string;
  encryptedFileStoragePath: string;
  isVerified: boolean;
  createdAt: string;
}

export interface ComplianceEvaluation {
  documentType: DocumentType;
  vehicleAgeYears: number;
  isValidityCycleValid: boolean;
  expectedCycleYearsOrMonths: string;
  daysRemaining: number;
  alertTier: ComplianceAlertTier;
  isExpiringSoon: boolean;
  message: string;
}

export interface CorridorDetails {
  corridorKey: string;
  name: string;
  origin: string;
  destination: string;
  oneWayDistanceKm: number;
  estimatedTransitHours: number;
  primaryHighway: string;
  hasExpresswaySection: boolean;
  estimatedTollCost: {
    '10_WHEELER': number;
    '12_WHEELER': number;
    '16_WHEELER': number;
  };
  recommendedRateRangePerMT: {
    min: number;
    max: number;
  };
  dieselEstimate?: {
    corridorDistanceKm: number;
    estimatedDieselLitres: number;
  };
}

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debitPaise: string;
  creditPaise: string;
  memo?: string;
}

export interface JournalEntry {
  entryNumber: string;
  description: string;
  timestamp: string;
  lines: JournalLine[];
  totalDebitPaise: string;
  totalCreditPaise: string;
  isBalanced: boolean;
}

export interface TrialBalanceAccount {
  accountCode: string;
  accountName: string;
  debitRupees: number;
  creditRupees: number;
}
