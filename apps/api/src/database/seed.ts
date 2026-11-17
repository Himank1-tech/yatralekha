import {
  OrganizationRepository,
  UserRepository,
  VehicleRepository,
  ComplianceRepository,
  TripRepository,
  LedgerRepository,
  FreightLoadRepository,
  CallLogRepository,
  VerificationRepository,
  PodBalanceRepository
} from '../repositories';
import { DocumentSecurityService } from '../services/DocumentSecurityService';
import { LedgerEngine } from '../services/LedgerEngine';
import { TelematicsTrackingService } from '../services/TelematicsTrackingService';

export function seedDatabase(): void {
  // 1. Seed Organization
  const org = OrganizationRepository.create({
    name: 'Vidarbha Heavy Haulers Pvt Ltd',
    companyName: 'Vidarbha Heavy Haulers Pvt Ltd',
    panOrGst: '27AABCV1234F1Z8',
    gstin: '27AABCV1234F1Z8',
    pan: 'AABCV1234F',
    hubLocation: 'Nagpur Logistics Park, Hingna, Maharashtra',
    hubCity: 'Nagpur (Hingna MIDC)',
    contactPhone: '+91 98220 01122',
    contactEmail: 'rajeshwar@vidarbhaheavy.com',
    vaultPinHash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // '1234' / 'password'
    kycStatus: 'VERIFIED'
  });

  // Seed default OWNER user for Vidarbha Heavy Haulers
  UserRepository.create({
    fullName: 'Rajeshwar Patil',
    email: 'rajeshwar@vidarbhaheavy.com',
    phone: '+91 98220 01122',
    passwordHash: '$2a$10$vI8aWBnW3fID.ZQ4/zo1G.q1lRps.9cGLcZEiGDMVr5yUP1KUOYem', // DemoPass@123 & password
    role: 'OWNER',
    organizationId: org.id
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

  // 6. Seed Freight Marketplace Loads (Backhauls & Corridor Demands)
  FreightLoadRepository.create({
    origin: 'Nagpur (MIHAN Logistic Park)',
    destination: 'Pune (Chakan Auto Cluster)',
    corridorName: 'Samruddhi Mahamarg Expressway',
    materialType: 'Auto Body Stampings & Pressed Parts',
    weightTonnes: 23.5,
    requiredAxleType: '12_WHEELER',
    bodyType: 'CONTAINER',
    offeredRate: 1150,
    rateType: 'PER_TONNE',
    advancePercent: 75.0,
    balancePaymentTerms: 'Balance on POD within 3 days',
    shipperName: 'Ritco Logistics TransSolutions',
    shipperPhone: '+91 98221 44550',
    isVerifiedShipper: true,
    status: 'AVAILABLE'
  });

  FreightLoadRepository.create({
    origin: 'Bhandara (Sunflag Complex)',
    destination: 'Pune (Bhosari MIDC)',
    corridorName: 'NH 53 & Samruddhi Corridor',
    materialType: 'Alloy Steel Billets & Wire Rods',
    weightTonnes: 19.0,
    requiredAxleType: '10_WHEELER',
    bodyType: 'DALA',
    offeredRate: 1220,
    rateType: 'PER_TONNE',
    advancePercent: 80.0,
    balancePaymentTerms: 'Balance on POD within 4 days',
    shipperName: 'VRL Logistics Hub Bhandara',
    shipperPhone: '+91 94220 88711',
    isVerifiedShipper: true,
    status: 'AVAILABLE'
  });

  FreightLoadRepository.create({
    origin: 'Nagpur (Kalmeshwar MIDC)',
    destination: 'Bhiwandi / Mumbai Warehouses',
    corridorName: 'Nagpur-Mumbai Expressway',
    materialType: 'Pressed Cotton Bales & Yarn',
    weightTonnes: 28.5,
    requiredAxleType: '16_WHEELER',
    bodyType: 'FLATBED',
    offeredRate: 1350,
    rateType: 'PER_TONNE',
    advancePercent: 75.0,
    balancePaymentTerms: 'Balance on POD within 5 days',
    shipperName: 'Vidarbha Cotton Mandi Consortium',
    shipperPhone: '+91 98230 11990',
    isVerifiedShipper: true,
    status: 'AVAILABLE'
  });

  FreightLoadRepository.create({
    origin: 'Pune (Chakan Phase 2)',
    destination: 'Nagpur (Hingna MIDC)',
    corridorName: 'Pune ➔ Nagpur Return Corridor (Backhaul)',
    materialType: 'Tractor Spares & Castings',
    weightTonnes: 22.0,
    requiredAxleType: '12_WHEELER',
    bodyType: 'DALA',
    offeredRate: 980,
    rateType: 'PER_TONNE',
    advancePercent: 70.0,
    balancePaymentTerms: 'Balance on POD within 3 days',
    shipperName: 'Western India Mandi Transport Syndicate',
    shipperPhone: '+91 97660 33211',
    isVerifiedShipper: false,
    status: 'AVAILABLE'
  });

  // 7. Seed Call Logs & Broker Interactions
  CallLogRepository.create({
    organizationId: org.id,
    contactName: 'Mohan Sharma (Sharma Freight)',
    contactRole: 'Broker',
    phoneNumber: '+91 98221 44550',
    laneDiscussed: 'Nagpur ➔ Pune (23.5 MT Steel)',
    callType: 'OUTGOING',
    durationSeconds: 145,
    dealStatus: 'RATE_CONFIRMED',
    notes: 'Agreed on ₹1,150/MT with 75% loading advance slip via IOCL Chhatrapati Square pump.'
  });

  CallLogRepository.create({
    organizationId: org.id,
    contactName: 'Kailash Mundra (Apex Roadways)',
    contactRole: 'Broker',
    phoneNumber: '+91 98229 11002',
    laneDiscussed: 'Pune ➔ Nagpur Return',
    callType: 'INCOMING',
    durationSeconds: 85,
    dealStatus: 'RATE_TOO_LOW',
    notes: 'Offered ₹750/MT for return load. Rejected - below break-even threshold of ₹850/MT.'
  });

  CallLogRepository.create({
    organizationId: org.id,
    contactName: 'Sanjay Yadav (Driver v1)',
    contactRole: 'Driver',
    phoneNumber: '+91 98221 14455',
    laneDiscussed: 'Jalna Toll Plaza Stretch',
    callType: 'OUTGOING',
    durationSeconds: 65,
    dealStatus: 'EN_ROUTE',
    notes: 'Confirmed crossed Mehkar interchange on Samruddhi. Tank level 240L, tire pressure OK.'
  });

  CallLogRepository.create({
    organizationId: org.id,
    contactName: 'Satish Gokhale (Gokhale Transport)',
    contactRole: 'Broker',
    phoneNumber: '+91 98228 99123',
    laneDiscussed: 'Overdue POD Balance Recovery (Bilty #BLT-849201)',
    callType: 'OUTGOING',
    durationSeconds: 190,
    dealStatus: 'POD_FOLLOWUP',
    notes: 'Requested urgent release of ₹6,800 pending for 18 days. Promised payment tomorrow morning.'
  });

  // 8. Seed Verified Government RTO & KYC Records
  VerificationRepository.create({
    organizationId: org.id,
    verificationType: 'VAHAN_RC',
    identifierNumber: 'MH 40 AK 9988',
    holderName: org.name,
    verificationStatus: 'VERIFIED',
    payload: {
      registrationNumber: 'MH40AK9988',
      rtoOffice: 'MH-40 (Nagpur Rural)',
      vehicleClass: 'Heavy Goods Vehicle (HGV)',
      makerModel: 'Tata Motors Signa 3523.TK',
      axleConfiguration: '12_WHEELER',
      passingGvwKg: 35000,
      unladenTareKg: 11000,
      maxLegalPayloadKg: 24000,
      fitnessExpiryDate: '2027-01-01',
      fitnessStatus: 'ACTIVE_VALID',
      nationalPermitStatus: 'ALL_INDIA_PERMIT_ACTIVE (Valid till 2027-04-10)',
      insuranceStatus: 'COMPREHENSIVE_VALID (Policy #3201003120)',
      roadTaxStatus: 'PAID_ANNUAL'
    }
  });

  VerificationRepository.create({
    organizationId: org.id,
    verificationType: 'SARATHI_DL',
    identifierNumber: 'MH14 20180012345',
    holderName: 'Sanjay Yadav',
    verificationStatus: 'VERIFIED',
    payload: {
      dlNumber: 'MH14 20180012345',
      driverName: 'Sanjay Yadav',
      issuingRto: 'MH-14 Pimpri Chinchwad',
      vehicleClassesAuthorized: ['TRANS (Heavy Commercial Goods)', 'HMV'],
      commercialTransportEndorsement: {
        hasEndorsement: true,
        status: 'VALID_ENDORSED',
        badgeNumber: 'MH/TR/COMM/12345',
        validUntil: '2028-08-13'
      }
    }
  });

  // 9. Seed Balance Bhaada (POD Escrow Claims)
  PodBalanceRepository.create({
    tripId: trip1.id,
    brokerName: 'Ritco Logistics TransSolutions',
    brokerPhone: '+91 98221 44550',
    biltyNumber: 'BLT-902188',
    origin: 'Nagpur (MIHAN)',
    destination: 'Pune (Chakan)',
    vehicleNumber: 'MH 40 AK 9988',
    totalFreight: 27600,
    advancePaid: 20700,
    balanceDue: 6900,
    unloadingDate: new Date(Date.now() - 4 * 86400000),
    dueDate: new Date(Date.now() + 1 * 86400000),
    podDocumentUrl: '/pod-scans/blt-902188.jpg',
    disputeNotes: 'Consignee received 24.0 MT steel coils in good condition. Stamped POD received.'
  });

  PodBalanceRepository.create({
    brokerName: 'Satish Gokhale (Gokhale Transport Syndicate)',
    brokerPhone: '+91 98228 99123',
    biltyNumber: 'BLT-849201',
    origin: 'Nagpur (Hingna)',
    destination: 'Bhiwandi Logistic Hub',
    vehicleNumber: 'MH 31 AP 4411',
    totalFreight: 26400,
    advancePaid: 19600,
    balanceDue: 6800,
    unloadingDate: new Date(Date.now() - 25 * 86400000),
    dueDate: new Date(Date.now() - 18 * 86400000),
    podDocumentUrl: '/pod-scans/blt-849201.jpg',
    disputeNotes: 'Broker avoiding phone calls. Overdue past 18 days beyond 7-day credit grace period.'
  });

  PodBalanceRepository.create({
    brokerName: 'Kailash Mundra (Apex Roadways Agency)',
    brokerPhone: '+91 98229 11002',
    biltyNumber: 'BLT-718820',
    origin: 'Wardha Steel Complex',
    destination: 'Pune Bhosari',
    vehicleNumber: 'MH 40 CD 1616',
    totalFreight: 38000,
    advancePaid: 28500,
    balanceDue: 9500,
    unloadingDate: new Date(Date.now() - 10 * 86400000),
    dueDate: new Date(Date.now() - 5 * 86400000),
    podDocumentUrl: '/pod-scans/blt-718820.jpg',
    disputeNotes: 'Overdue by 5 days. Sent first verbal reminder via call.'
  });

  // 10. Initialize Real-Time Telematics Tracking
  TelematicsTrackingService.initialize();

  console.log('[YatraLekha Database] Seeded Organization, Fleet, Documents, Trips, Marketplace Loads, Call Logs, and POD Escrow.');
}
