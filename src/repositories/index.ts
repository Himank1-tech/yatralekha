import crypto from 'crypto';
import { AxleConfiguration, DocumentType, RateType, TripExpenseInput } from '../types/domain';
import { JournalEntry } from '../services/LedgerEngine';

export interface OrganizationRecord {
  id: string;
  name: string;
  panOrGst: string;
  hubLocation: string;
  contactPhone: string;
  contactEmail?: string;
  createdAt: Date;
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
  public static vehicles = new Map<string, VehicleRecord>();
  public static documents = new Map<string, StatutoryDocumentRecord>();
  public static trips = new Map<string, TripRecord>();
  public static journals = new Map<string, JournalEntry[]>();

  public static clear(): void {
    this.organizations.clear();
    this.vehicles.clear();
    this.documents.clear();
    this.trips.clear();
    this.journals.clear();
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
