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
  podDocumentPath?: string;
  podSubmissionDate?: string;
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

// ==========================================
// YatraLekha v2.0 Super-App UI Types
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
  createdAt: string;
}

export interface PreferredLane {
  id: string;
  origin: string;
  destination: string;
  corridor: string;
  recommendedRatePerTon: number;
  activeAlerts: boolean;
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
  createdAt: string;
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
  verifiedAt: string;
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
  unloadingDate: string;
  dueDate: string;
  recoveryStatus: PodRecoveryStatus;
  daysOverdue: number;
  isOverdue: boolean;
  podDocumentUrl?: string;
  disputeNotes?: string;
  brokerRiskTier: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK_DEF_DEFAULTER';
  createdAt: string;
}

export interface YatraMitraVoiceMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actionRoute?: string;
  actionLabel?: string;
}
