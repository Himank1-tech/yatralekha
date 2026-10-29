import {
  OrganizationRepository,
  VehicleRepository,
  ComplianceRepository,
  TripRepository,
  LedgerRepository
} from '../repositories';
import { DocumentSecurityService } from '../services/DocumentSecurityService';
import { LedgerEngine } from '../services/LedgerEngine';
import { TelematicsTrackingService } from '../services/TelematicsTrackingService';

export function seedDatabase(): void {
  // 1. Seed Organization
  const org = OrganizationRepository.create({
    name: 'Vidarbha Heavy Haulers Pvt Ltd',
    panOrGst: '27AABCV1234F1Z8',
    hubLocation: 'Nagpur Logistics Park, Hingna, Maharashtra',
    contactPhone: '+91 98220 01122',
    contactEmail: 'operations@vidarbhahaulers.in'
  });

  // 2. Seed Fleet Vehicles
  const v1 = VehicleRepository.create({
    organizationId: org.id,
    registrationNumber: 'MH 40 AK 9988',
    chassisNumber: 'MAT628400K12904',
    engineNumber: 'CUMMINS6BT9988',
    axleConfiguration: '12_WHEELER',
    tareWeightKg: 11000,
    grossVehicleWeightKg: 35000,
    monthlyEmi: 48000,
    crewMonthlyPayroll: 17000, // ₹12k Driver + ₹5k Cleaner
    annualInsuranceTax: 60000,
    ais140Imei: '867530901234567',
    currentDriverName: 'Sanjay Yadav',
    currentDriverPhone: '+91 98221 14455'
  });

  const v2 = VehicleRepository.create({
    organizationId: org.id,
    registrationNumber: 'MH 31 AP 4411',
    chassisNumber: 'MAT109288J99120',
    engineNumber: 'TATA697TC4411',
    axleConfiguration: '10_WHEELER',
    tareWeightKg: 9000,
    grossVehicleWeightKg: 28000,
    monthlyEmi: 38000,
    crewMonthlyPayroll: 17000,
    annualInsuranceTax: 50000,
    ais140Imei: '867530907654321',
    currentDriverName: 'Rameshwar Patil',
    currentDriverPhone: '+91 98223 36677'
  });

  const v3 = VehicleRepository.create({
    organizationId: org.id,
    registrationNumber: 'MH 40 CD 1616',
    chassisNumber: 'MAT991823H00129',
    engineNumber: 'AL6DTI1616',
    axleConfiguration: '16_WHEELER',
    tareWeightKg: 17500,
    grossVehicleWeightKg: 47500,
    monthlyEmi: 78000,
    crewMonthlyPayroll: 17000,
    annualInsuranceTax: 72000,
    ais140Imei: '867530909988776',
    currentDriverName: 'Gurpreet Singh',
    currentDriverPhone: '+91 98229 98811'
  });

  // 3. Seed Statutory Documents with PIN Hashing (PIN: 8821)
  const pinCreds = DocumentSecurityService.hashDocumentPin('8821');

  ComplianceRepository.createDocument({
    organizationId: org.id,
    vehicleId: v1.id,
    documentType: 'FITNESS',
    documentNumber: 'MH40/FORM38/2026/0019',
    issueDate: new Date('2025-01-01'),
    expiryDate: new Date('2027-01-01'),
    encryptedFileStoragePath: '/secure/vault/docs/MH40AK9988_FITNESS.enc',
    pinHash: pinCreds.pinHash,
    pinSalt: pinCreds.salt,
    isVerified: true
  });

  ComplianceRepository.createDocument({
    organizationId: org.id,
    vehicleId: v1.id,
    documentType: 'PERMIT',
    documentNumber: 'AIP/MH/2022/8812',
    issueDate: new Date('2022-04-10'),
    expiryDate: new Date('2027-04-10'),
    encryptedFileStoragePath: '/secure/vault/docs/MH40AK9988_PERMIT.enc',
    pinHash: pinCreds.pinHash,
    pinSalt: pinCreds.salt,
    isVerified: true
  });

  // Urgent: Road Tax expires in 3 days!
  const today = new Date();
  const taxExpiry = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000);
  ComplianceRepository.createDocument({
    organizationId: org.id,
    vehicleId: v2.id,
    documentType: 'ROAD_TAX',
    documentNumber: 'TAX/MAH/Q3/2026',
    issueDate: new Date('2026-08-01'),
    expiryDate: taxExpiry,
    encryptedFileStoragePath: '/secure/vault/docs/MH31AP4411_ROAD_TAX.enc',
    pinHash: pinCreds.pinHash,
    pinSalt: pinCreds.salt,
    isVerified: true
  });

  // Warning: PUC expires in 17 days!
  const pucExpiry = new Date(today.getTime() + 17 * 24 * 60 * 60 * 1000);
  ComplianceRepository.createDocument({
    organizationId: org.id,
    vehicleId: v2.id,
    documentType: 'PUC',
    documentNumber: 'PUC-MH-2026-9921',
    issueDate: new Date('2026-05-15'),
    expiryDate: pucExpiry,
    encryptedFileStoragePath: '/secure/vault/docs/MH31AP4411_PUC.enc',
    pinHash: pinCreds.pinHash,
    pinSalt: pinCreds.salt,
    isVerified: true
  });

  // 4. Seed Active Trips & Khata
  // Trip 1: Long Haul Nagpur to Pune (24.5 MT @ ₹1,150/MT)
  const trip1 = TripRepository.create({
    organizationId: org.id,
    vehicleId: v1.id,
    tripSerialNumber: 'TRIP-2026-NGP-PUN-001',
    origin: 'Nagpur (Hingna MIDC)',
    destination: 'Pune (Chakan Auto Cluster)',
    corridorDistanceKm: 720,
    billedWeightTonnes: 24.5,
    rateType: 'PER_TONNE',
    freightRate: 1150,
    grossFreightAmount: 28175.0,
    advanceAmount: 21131.25,
    balancePodDue: 7043.75,
    podClearanceStatus: 'PENDING',
    overloadRiskFlag: false,
    overloadExcessKg: 0,
    startedAt: new Date(Date.now() - 36 * 3600 * 1000)
  });

  // Add Itemized Expenses for Trip 1
  TripRepository.addExpense(trip1.id, {
    category: 'DIESEL',
    paymentSource: 'PUMP_CREDIT_PARCHI',
    amount: 11520,
    fuelLitres: 120,
    fuelRatePerLitre: 96,
    pumpStationName: 'BPCL Highway Oasis - Karanja Lad',
    pumpSlipNumber: 'PARCHI-10492'
  });

  TripRepository.addExpense(trip1.id, {
    category: 'DIESEL',
    paymentSource: 'PUMP_CREDIT_PARCHI',
    amount: 11400,
    fuelLitres: 120,
    fuelRatePerLitre: 95,
    pumpStationName: 'IOCL Swagat - Jalna Bypass',
    pumpSlipNumber: 'PARCHI-8821'
  });

  TripRepository.addExpense(trip1.id, {
    category: 'TOLL_FASTAG',
    paymentSource: 'FASTAG_WALLET',
    amount: 3950,
    memo: 'Samruddhi Mahamarg FASTag Toll'
  });

  TripRepository.addExpense(trip1.id, {
    category: 'DRIVER_BHATTA',
    paymentSource: 'CASH',
    amount: 2500,
    memo: 'Driver & cleaner food allowance'
  });

  TripRepository.addExpense(trip1.id, {
    category: 'HAMALI',
    paymentSource: 'CASH',
    amount: 1000,
    memo: 'Loading hamali at Nagpur warehouse'
  });

  // Trip 2: Short Haul Nagpur to Bhandara (22.0 MT Fixed Contract)
  const trip2 = TripRepository.create({
    organizationId: org.id,
    vehicleId: v2.id,
    tripSerialNumber: 'TRIP-2026-NGP-BHD-004',
    origin: 'Nagpur Steel Yard',
    destination: 'Bhandara Ferro Alloys',
    corridorDistanceKm: 65,
    billedWeightTonnes: 22.0,
    rateType: 'FIXED',
    freightRate: 5500,
    grossFreightAmount: 5500.0,
    advanceAmount: 4400.0,
    balancePodDue: 1100.0,
    podClearanceStatus: 'VERIFIED',
    overloadRiskFlag: false,
    overloadExcessKg: 0,
    startedAt: new Date(Date.now() - 12 * 3600 * 1000)
  });

  // Trip 3: 16-Wheeler Multi-Axle Consignment (29.5 MT @ ₹1,180/MT)
  const trip3 = TripRepository.create({
    organizationId: org.id,
    vehicleId: v3.id,
    tripSerialNumber: 'TRIP-2026-NGP-PUN-008',
    origin: 'Nagpur Heavy Machinery Yard',
    destination: 'Pune Talegaon Industrial Hub',
    corridorDistanceKm: 720,
    billedWeightTonnes: 29.5,
    rateType: 'PER_TONNE',
    freightRate: 1180,
    grossFreightAmount: 34810.0,
    advanceAmount: 26107.5,
    balancePodDue: 8702.5,
    podClearanceStatus: 'PENDING',
    overloadRiskFlag: false,
    overloadExcessKg: 0,
    startedAt: new Date(Date.now() - 6 * 3600 * 1000)
  });

  // 5. Seed Double-Entry Freight Ledger Journals
  const billing1 = {
    billedWeightTonnes: trip1.billedWeightTonnes,
    rateType: trip1.rateType,
    freightRate: trip1.freightRate,
    grossFreight: trip1.grossFreightAmount,
    advanceAmount: trip1.advanceAmount,
    balancePodDue: trip1.balancePodDue,
    advancePercentage: 0.75,
    podBalancePercentage: 0.25
  };

  const inv1 = LedgerEngine.generateFreightInvoiceJournal(trip1.tripSerialNumber, billing1);
  LedgerRepository.saveJournalEntry(trip1.id, inv1);

  const adv1 = LedgerEngine.generateAdvanceDisbursementJournal(
    trip1.tripSerialNumber,
    billing1,
    6131.25,
    15000.0
  );
  LedgerRepository.saveJournalEntry(trip1.id, adv1);

  const billing2 = {
    billedWeightTonnes: trip2.billedWeightTonnes,
    rateType: trip2.rateType,
    freightRate: trip2.freightRate,
    grossFreight: trip2.grossFreightAmount,
    advanceAmount: trip2.advanceAmount,
    balancePodDue: trip2.balancePodDue,
    advancePercentage: 0.8,
    podBalancePercentage: 0.2
  };
  const inv2 = LedgerEngine.generateFreightInvoiceJournal(trip2.tripSerialNumber, billing2);
  LedgerRepository.saveJournalEntry(trip2.id, inv2);

  const pod2 = LedgerEngine.generatePodSettlementJournal(trip2.tripSerialNumber, billing2);
  LedgerRepository.saveJournalEntry(trip2.id, pod2);

  // 6. Initialize Real-Time Telematics Tracking
  TelematicsTrackingService.initialize();

  console.log('[YatraLekha Database] Seeded Organization, Fleet, Documents, Trips, and Ledger.');
}
