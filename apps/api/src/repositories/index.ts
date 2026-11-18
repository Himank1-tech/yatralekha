import crypto from 'crypto';
import {
  AxleConfiguration,
  DocumentType,
  RateType,
  TripExpenseInput,
  FreightLoad,
  CallLog,
  VerifiedEntity,
  PodBalanceClaim,
  PodRecoveryStatus,
  VerificationType
} from '../types/domain';
import { JournalEntry } from '../services/LedgerEngine';

export interface OrganizationRecord {
  id: string;
  name: string;
  companyName?: string;
  panOrGst: string;
  gstin?: string;
  pan?: string;
  hubLocation: string;
  hubCity?: string;
  contactPhone: string;
  contactEmail?: string;
  vaultPinHash?: string;
  kycStatus?: string;
  createdAt: Date;
}

export interface UserRecord {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  role: 'OWNER' | 'MUNIM' | 'DRIVER';
  organizationId: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface VehicleRecord {
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
  createdAt: Date;
}

export interface StatutoryDocumentRecord {
  id: string;
  organizationId: string;
  vehicleId: string;
  documentType: DocumentType;
  documentNumber?: string;
  issueDate: Date;
  expiryDate: Date;
  encryptedFileStoragePath: string;
  pinHash: string;
  pinSalt: string;
  isVerified: boolean;
  createdAt: Date;
}

export interface TripRecord {
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
  podClearanceStatus: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'DEFAULTED';
  overloadRiskFlag: boolean;
  overloadExcessKg: number;
  expenses: (TripExpenseInput & { id: string; createdAt: Date })[];
  startedAt: Date;
  completedAt?: Date;
}

export class MemoryStore {
  public static organizations = new Map<string, OrganizationRecord>();
  public static users = new Map<string, UserRecord>();
  public static vehicles = new Map<string, VehicleRecord>();
  public static documents = new Map<string, StatutoryDocumentRecord>();
  public static trips = new Map<string, TripRecord>();
  public static journals = new Map<string, JournalEntry[]>();
  public static loads = new Map<string, FreightLoad>();
  public static callLogs = new Map<string, CallLog>();
  public static verifications = new Map<string, VerifiedEntity>();
  public static podClaims = new Map<string, PodBalanceClaim>();

  public static clear(): void {
    this.organizations.clear();
    this.users.clear();
    this.vehicles.clear();
    this.documents.clear();
    this.trips.clear();
    this.journals.clear();
    this.loads.clear();
    this.callLogs.clear();
    this.verifications.clear();
    this.podClaims.clear();
  }
}

export class UserRepository {
  public static create(data: Omit<UserRecord, 'id' | 'createdAt'>): UserRecord {
    const id = crypto.randomUUID();
    const record: UserRecord = {
      ...data,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    MemoryStore.users.set(id, record);
    return record;
  }

  public static findByEmail(email: string): UserRecord | undefined {
    const normalized = email.trim().toLowerCase();
    for (const u of MemoryStore.users.values()) {
      if (u.email.toLowerCase() === normalized) return u;
    }
    return undefined;
  }

  public static findById(id: string): UserRecord | undefined {
    return MemoryStore.users.get(id);
  }

  public static listByOrganization(organizationId: string): UserRecord[] {
    return Array.from(MemoryStore.users.values()).filter(u => u.organizationId === organizationId);
  }
}

export class OrganizationRepository {
  public static create(data: Omit<OrganizationRecord, 'id' | 'createdAt'>): OrganizationRecord {
    const id = crypto.randomUUID();
    const record: OrganizationRecord = {
      ...data,
      id,
      createdAt: new Date()
    };
    MemoryStore.organizations.set(id, record);
    return record;
  }

  public static findById(id: string): OrganizationRecord | undefined {
    return MemoryStore.organizations.get(id);
  }

  public static list(): OrganizationRecord[] {
    return Array.from(MemoryStore.organizations.values());
  }
}

export class VehicleRepository {
  public static create(data: Omit<VehicleRecord, 'id' | 'createdAt' | 'maxLegalPayloadKg'>): VehicleRecord {
    const id = crypto.randomUUID();
    const maxLegalPayloadKg = data.grossVehicleWeightKg - data.tareWeightKg;
    const record: VehicleRecord = {
      ...data,
      id,
      maxLegalPayloadKg,
      createdAt: new Date()
    };
    MemoryStore.vehicles.set(id, record);
    return record;
  }

  public static findById(id: string): VehicleRecord | undefined {
    return MemoryStore.vehicles.get(id);
  }

  public static findByImei(imei: string): VehicleRecord | undefined {
    return Array.from(MemoryStore.vehicles.values()).find((v) => v.ais140Imei === imei);
  }

  public static findByRegistration(regNo: string): VehicleRecord | undefined {
    const clean = regNo.replace(/[\s-]/g, '').toUpperCase();
    return Array.from(MemoryStore.vehicles.values()).find(
      (v) => v.registrationNumber.replace(/[\s-]/g, '').toUpperCase() === clean
    );
  }

  public static listByOrganization(organizationId: string): VehicleRecord[] {
    return Array.from(MemoryStore.vehicles.values()).filter((v) => v.organizationId === organizationId);
  }
}

export class ComplianceRepository {
  public static createDocument(data: Omit<StatutoryDocumentRecord, 'id' | 'createdAt'>): StatutoryDocumentRecord {
    const id = crypto.randomUUID();
    const record: StatutoryDocumentRecord = {
      ...data,
      id,
      createdAt: new Date()
    };
    MemoryStore.documents.set(id, record);
    return record;
  }

  public static findById(id: string): StatutoryDocumentRecord | undefined {
    return MemoryStore.documents.get(id);
  }

  public static listByVehicle(vehicleId: string): StatutoryDocumentRecord[] {
    return Array.from(MemoryStore.documents.values()).filter((d) => d.vehicleId === vehicleId);
  }
}

export class TripRepository {
  public static create(data: Omit<TripRecord, 'id' | 'expenses' | 'startedAt'> & { startedAt?: Date }): TripRecord {
    const id = crypto.randomUUID();
    const record: TripRecord = {
      ...data,
      id,
      expenses: [],
      startedAt: data.startedAt ?? new Date()
    };
    MemoryStore.trips.set(id, record);
    return record;
  }

  public static findById(id: string): TripRecord | undefined {
    return MemoryStore.trips.get(id);
  }

  public static addExpense(tripId: string, expense: TripExpenseInput): TripRecord {
    const trip = this.findById(tripId);
    if (!trip) {
      throw new Error(`Trip ${tripId} not found`);
    }

    const expRecord = {
      ...expense,
      id: crypto.randomUUID(),
      createdAt: new Date()
    };
    trip.expenses.push(expRecord);
    return trip;
  }

  public static updatePodStatus(
    tripId: string,
    status: 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'DEFAULTED'
  ): TripRecord {
    const trip = this.findById(tripId);
    if (!trip) {
      throw new Error(`Trip ${tripId} not found`);
    }
    trip.podClearanceStatus = status;
    if (status === 'VERIFIED') {
      trip.completedAt = new Date();
    }
    return trip;
  }

  public static listByOrganization(organizationId: string): TripRecord[] {
    return Array.from(MemoryStore.trips.values()).filter((t) => t.organizationId === organizationId);
  }
}

export class LedgerRepository {
  public static saveJournalEntry(tripId: string, journal: JournalEntry): void {
    const list = MemoryStore.journals.get(tripId) ?? [];
    list.push(journal);
    MemoryStore.journals.set(tripId, list);
  }

  public static getTripJournals(tripId: string): JournalEntry[] {
    return MemoryStore.journals.get(tripId) ?? [];
  }

  public static listAll(): JournalEntry[] {
    const all: JournalEntry[] = [];
    for (const entries of MemoryStore.journals.values()) {
      all.push(...entries);
    }
    return all;
  }
}


export class FreightLoadRepository {
  public static create(data: Omit<FreightLoad, 'id' | 'createdAt'>): FreightLoad {
    const id = crypto.randomUUID();
    const record: FreightLoad = {
      ...data,
      id,
      createdAt: new Date()
    };
    MemoryStore.loads.set(id, record);
    return record;
  }

  public static list(filter?: {
    origin?: string;
    destination?: string;
    axleType?: string;
    materialType?: string;
    status?: string;
  }): FreightLoad[] {
    let result = Array.from(MemoryStore.loads.values());
    if (filter?.status) {
      result = result.filter((l) => l.status === filter.status);
    }
    if (filter?.origin) {
      const q = filter.origin.toLowerCase();
      result = result.filter((l) => l.origin.toLowerCase().includes(q));
    }
    if (filter?.destination) {
      const q = filter.destination.toLowerCase();
      result = result.filter((l) => l.destination.toLowerCase().includes(q));
    }
    if (filter?.axleType && filter.axleType !== 'ALL') {
      result = result.filter((l) => l.requiredAxleType === filter.axleType);
    }
    if (filter?.materialType && filter.materialType !== 'ALL') {
      result = result.filter((l) => l.materialType.toLowerCase().includes(filter.materialType!.toLowerCase()));
    }
    return result;
  }

  public static findById(id: string): FreightLoad | undefined {
    return MemoryStore.loads.get(id);
  }

  public static bookLoad(id: string): FreightLoad | undefined {
    const load = MemoryStore.loads.get(id);
    if (load) {
      load.status = 'BOOKED';
      MemoryStore.loads.set(id, load);
    }
    return load;
  }
}

export class CallLogRepository {
  public static create(data: Omit<CallLog, 'id' | 'createdAt'>): CallLog {
    const id = crypto.randomUUID();
    const record: CallLog = {
      ...data,
      id,
      createdAt: new Date()
    };
    MemoryStore.callLogs.set(id, record);
    return record;
  }

  public static list(search?: string): CallLog[] {
    let list = Array.from(MemoryStore.callLogs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          c.phoneNumber.includes(q) ||
          c.laneDiscussed.toLowerCase().includes(q) ||
          (c.notes && c.notes.toLowerCase().includes(q))
      );
    }
    return list;
  }

  public static findById(id: string): CallLog | undefined {
    return MemoryStore.callLogs.get(id);
  }

  public static delete(id: string): boolean {
    return MemoryStore.callLogs.delete(id);
  }
}

export class VerificationRepository {
  public static create(data: Omit<VerifiedEntity, 'id' | 'verifiedAt'>): VerifiedEntity {
    const id = crypto.randomUUID();
    const record: VerifiedEntity = {
      ...data,
      id,
      verifiedAt: new Date()
    };
    MemoryStore.verifications.set(id, record);
    return record;
  }

  public static findByIdentifier(identifier: string, type: VerificationType): VerifiedEntity | undefined {
    const cleanId = identifier.replace(/[\s-]/g, '').toUpperCase();
    return Array.from(MemoryStore.verifications.values()).find(
      (v) => v.verificationType === type && v.identifierNumber.replace(/[\s-]/g, '').toUpperCase() === cleanId
    );
  }

  public static list(): VerifiedEntity[] {
    return Array.from(MemoryStore.verifications.values()).sort(
      (a, b) => b.verifiedAt.getTime() - a.verifiedAt.getTime()
    );
  }
}

export class PodBalanceRepository {
  public static create(
    data: Omit<PodBalanceClaim, 'id' | 'createdAt' | 'daysOverdue' | 'isOverdue' | 'brokerRiskTier' | 'recoveryStatus'> & {
      recoveryStatus?: PodRecoveryStatus;
    }
  ): PodBalanceClaim {
    const id = crypto.randomUUID();
    const now = new Date();
    const dueTime = new Date(data.dueDate).getTime();
    const diffDays = Math.max(0, Math.floor((now.getTime() - dueTime) / (1000 * 60 * 60 * 24)));
    const isOverdue = diffDays > 0;
    
    let brokerRiskTier: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK_DEF_DEFAULTER' = 'LOW_RISK';
    if (diffDays > 15) {
      brokerRiskTier = 'HIGH_RISK_DEF_DEFAULTER';
    } else if (diffDays > 0) {
      brokerRiskTier = 'MODERATE_RISK';
    }

    const record: PodBalanceClaim = {
      ...data,
      id,
      recoveryStatus: data.recoveryStatus || 'PENDING',
      daysOverdue: diffDays,
      isOverdue,
      brokerRiskTier,
      createdAt: now
    };
    MemoryStore.podClaims.set(id, record);
    return record;
  }

  public static list(): PodBalanceClaim[] {
    const now = new Date();
    const list = Array.from(MemoryStore.podClaims.values()).map((c) => {
      const dueTime = new Date(c.dueDate).getTime();
      const diffDays = Math.max(0, Math.floor((now.getTime() - dueTime) / (1000 * 60 * 60 * 24)));
      const isOverdue = diffDays > 0 && c.recoveryStatus !== 'SETTLED';
      let risk: 'LOW_RISK' | 'MODERATE_RISK' | 'HIGH_RISK_DEF_DEFAULTER' = 'LOW_RISK';
      if (diffDays > 15) risk = 'HIGH_RISK_DEF_DEFAULTER';
      else if (diffDays > 0) risk = 'MODERATE_RISK';

      c.daysOverdue = diffDays;
      c.isOverdue = isOverdue;
      c.brokerRiskTier = risk;
      return c;
    });

    return list.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }

  public static findById(id: string): PodBalanceClaim | undefined {
    return MemoryStore.podClaims.get(id);
  }

  public static updateStatus(id: string, status: PodRecoveryStatus, notes?: string): PodBalanceClaim | undefined {
    const claim = MemoryStore.podClaims.get(id);
    if (claim) {
      claim.recoveryStatus = status;
      if (notes) {
        claim.disputeNotes = notes;
      }
      MemoryStore.podClaims.set(id, claim);
    }
    return claim;
  }

  public static generateNotice(id: string): { noticeText: string; whatsappUrl: string } | null {
    const claim = MemoryStore.podClaims.get(id);
    if (!claim) return null;

    const org = (claim as any).organizationId ? OrganizationRepository.findById((claim as any).organizationId) : undefined;
    const orgName = org?.companyName || org?.name || 'Fleet Operator Accounts & Recovery Sentinel';

    const noticeText = `*FORMAL PAYMENT DEMAND NOTICE - YATRA LEKHA FREIGHT ESCROW*\n\n` +
      `To: *${claim.brokerName}* (${claim.brokerPhone})\n` +
      `From: *${orgName}*\n\n` +
      `*Subject:* Immediate Payment of Overdue POD Balance (Bilty #${claim.biltyNumber})\n\n` +
      `Dear Sir/Madam,\n` +
      `Vehicle *${claim.vehicleNumber}* completed freight consignment delivery for route *${claim.origin} ➔ ${claim.destination}* on *${new Date(claim.unloadingDate).toLocaleDateString('en-IN')}*.\n\n` +
      `• Total Agreed Freight: ₹${claim.totalFreight.toLocaleString('en-IN')}\n` +
      `• Loading Advance Received (75%): ₹${claim.advancePaid.toLocaleString('en-IN')}\n` +
      `• Outstanding POD Balance (25%): *₹${claim.balanceDue.toLocaleString('en-IN')}*\n` +
      `• Agreed Payment Grace Period Due Date: *${new Date(claim.dueDate).toLocaleDateString('en-IN')}*\n` +
      `• Current Overdue Delay: *${claim.daysOverdue} Days*\n\n` +
      `Acknowledged Proof of Delivery (POD) with consignee stamp has already been handed over. Failure to clear balance within 48 hours will trigger statutory reporting under Indian Commercial Transport Recovery Guidelines and broker blacklisting on the YatraLekha Freight Exchange.\n\n` +
      `Regards,\nAccounts & Recovery Sentinel\n${orgName}`;

    const cleanPhone = claim.brokerPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const whatsappUrl = `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(noticeText)}`;

    // Update status to LEGAL_NOTICE_SENT
    this.updateStatus(id, 'LEGAL_NOTICE_SENT');

    return { noticeText, whatsappUrl };
  }
}
