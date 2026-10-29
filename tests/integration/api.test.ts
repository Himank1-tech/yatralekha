import request from 'supertest';
import { createApp } from '../../src/server/app';
import { MemoryStore } from '../../src/repositories';
import { TelematicsIngestionWorker } from '../../src/services/TelematicsIngestionWorker';

describe('YatraLekha API Integration Test Suite', () => {
  const app = createApp();

  beforeEach(() => {
    MemoryStore.clear();
    TelematicsIngestionWorker.resetState();
  });

  describe('GET /health', () => {
    test('returns service health and system information', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.system).toContain('YatraLekha');
      expect(res.body.version).toBe('1.0.0-mvp');
    });
  });

  describe('Full Operational Khata & Telematics Lifecycle', () => {
    test('executes end-to-end fleet onboarding, trip billing, khata split, expenses, and ledger reconciliation', async () => {
      // 1. Onboard Transporter Organization
      const orgRes = await request(app)
        .post('/api/v1/organizations')
        .send({
          name: 'Vidarbha Heavy Haulers Pvt Ltd',
          panOrGst: '27AABCV1234F1Z8',
          hubLocation: 'Nagpur Logistics Park, Hingna, Maharashtra',
          contactPhone: '+919822001122',
          contactEmail: 'operations@vidarbhahaulers.in'
        });

      expect(orgRes.status).toBe(201);
      const orgId = orgRes.body.data.id;
      expect(orgId).toBeDefined();

      // 2. Register Heavy-Haul Vehicle (12-Wheeler 8x2)
      const vehRes = await request(app)
        .post('/api/v1/vehicles')
        .send({
          organizationId: orgId,
          registrationNumber: 'MH 40 AK 9988',
          chassisNumber: 'MAT628400K12904',
          engineNumber: 'CUMMINS6BT9988',
          axleConfiguration: '12_WHEELER',
          monthlyEmi: 48000,
          crewMonthlyPayroll: 17000, // ₹12k Driver + ₹5k Cleaner
          annualInsuranceTax: 60000,
          ais140Imei: '867530901234567',
          currentDriverName: 'Sanjay Yadav',
          currentDriverPhone: '+919876543210'
        });

      expect(vehRes.status).toBe(201);
      const vehicleId = vehRes.body.data.id;
      expect(vehRes.body.data.tareWeightKg).toBe(11000);
      expect(vehRes.body.data.grossVehicleWeightKg).toBe(35000);
      expect(vehRes.body.data.maxLegalPayloadKg).toBe(24000);
      expect(vehRes.body.data.dailyFixedBurnMetrics.crewMonthlyPayroll).toBe(17000);
      // Daily burn: (48000 + 17000 + 5000) / 30 = ₹2,333.33 / day
      expect(vehRes.body.data.dailyFixedBurnMetrics.dailyFixedBurn).toBe(2333.33);

      // 3. Register Statutory Document with Mahavitran-style PIN Security
      const docRes = await request(app)
        .post('/api/v1/compliance/documents')
        .send({
          organizationId: orgId,
          vehicleId,
          documentType: 'FITNESS',
          documentNumber: 'MH40/FORM38/2026/0019',
          issueDate: '2025-01-01',
          expiryDate: '2027-01-01',
          encryptedFileStoragePath: '/secure/vault/docs/MH40AK9988_FITNESS.enc',
          accessPin: '8821'
        });

      expect(docRes.status).toBe(201);
      const docId = docRes.body.data.id;

      // 3.1 Verify Access with Correct PIN
      const pinSuccess = await request(app)
        .post(`/api/v1/compliance/documents/${docId}/verify-pin`)
        .send({ pin: '8821' });
      expect(pinSuccess.status).toBe(200);
      expect(pinSuccess.body.data.filePath).toBe('/secure/vault/docs/MH40AK9988_FITNESS.enc');

      // 3.2 Deny Access with Incorrect PIN
      const pinFail = await request(app)
        .post(`/api/v1/compliance/documents/${docId}/verify-pin`)
        .send({ pin: '0000' });
      expect(pinFail.status).toBe(401);

      // 3.3 Run Watchdog Audit for Vehicle
      const watchdogRes = await request(app).get(`/api/v1/compliance/vehicles/${vehicleId}/watchdog`);
      expect(watchdogRes.status).toBe(200);
      expect(watchdogRes.body.documentsAudited).toBe(1);

      // 4. Create Trip (Nagpur ↔ Pune, ~720 km corridor)
      // Rate: ₹1,150 / MT, Payload: 23.5 MT (within 24.0 MT legal limit)
      const tripRes = await request(app)
        .post('/api/v1/trips')
        .send({
          organizationId: orgId,
          vehicleId,
          tripSerialNumber: 'TRIP-2026-NGP-PUN-001',
          origin: 'Nagpur, Maharashtra',
          destination: 'Pune, Maharashtra',
          corridorDistanceKm: 720,
          billedWeightTonnes: 23.5,
          rateType: 'PER_TONNE',
          freightRate: 1150,
          advancePercentage: 0.75
        });

      expect(tripRes.status).toBe(201);
      const tripId = tripRes.body.data.trip.id;
      // Gross Freight = 23.5 * 1150 = 27,025.00
      expect(tripRes.body.data.billing.grossFreight).toBe(27025.0);
      // Advance (75%) = 20,268.75
      expect(tripRes.body.data.billing.advanceAmount).toBe(20268.75);
      // Retained POD Balance (25%) = 6,756.25
      expect(tripRes.body.data.billing.balancePodDue).toBe(6756.25);
      expect(tripRes.body.data.weightValidation.isOverloaded).toBe(false);

      // 5. Add Trip Expenses (Fuel Parchi, FASTag, Bhatta, Hamali, Chit)
      await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .send({
          category: 'DIESEL',
          paymentSource: 'PUMP_CREDIT_PARCHI',
          amount: 14500,
          fuelLitres: 150,
          fuelRatePerLitre: 96.67,
          pumpStationName: 'BPCL Highway Oasis - Karanja Lad',
          pumpSlipNumber: 'PARCHI-BPCL-1002'
        });

      await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .send({
          category: 'TOLL_FASTAG',
          paymentSource: 'FASTAG_WALLET',
          amount: 3950,
          memo: 'Samruddhi Mahamarg FASTag Toll'
        });

      await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .send({
          category: 'DRIVER_BHATTA',
          paymentSource: 'CASH',
          amount: 2500,
          memo: 'Driver & cleaner trip allowance'
        });

      await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .send({
          category: 'HAMALI',
          paymentSource: 'CASH',
          amount: 1000,
          memo: 'Unloading charges at Pune warehouse'
        });

      await request(app)
        .post(`/api/v1/trips/${tripId}/expenses`)
        .send({
          category: 'RTO_POLICE_CHIT',
          paymentSource: 'CASH',
          amount: 500,
          memo: 'Entry checkpoint entry receipt'
        });

      // 6. Check Trip Finance Contribution
      const financeRes = await request(app).get(`/api/v1/trips/${tripId}/finance`);
      expect(financeRes.status).toBe(200);
      // Total expenses = 14500 + 3950 + 2500 + 1000 + 500 = 22,450
      expect(financeRes.body.data.contribution.expenseBreakdown.totalExpenses).toBe(22450);
      // Net Contribution = 27025 - 22450 = 4,575.00
      expect(financeRes.body.data.contribution.netContribution).toBe(4575.0);
      expect(financeRes.body.data.contribution.isLossMaking).toBe(false);

      // 7. Settle POD Balance (Clearance upon delivery verification)
      const podRes = await request(app).post(`/api/v1/trips/${tripId}/pod-settle`);
      expect(podRes.status).toBe(200);
      expect(podRes.body.data.trip.podClearanceStatus).toBe('VERIFIED');
      expect(podRes.body.data.ledgerJournal.isBalanced).toBe(true);

      // 8. Verify Platform Double-Entry Trial Balance
      const tbRes = await request(app).get('/api/v1/ledger/trial-balance');
      expect(tbRes.status).toBe(200);
      expect(tbRes.body.trialBalance.isBalanced).toBe(true);
      expect(tbRes.body.trialBalance.totalDebitRupees).toBe(tbRes.body.trialBalance.totalCreditRupees);
    });
  });

  describe('POST /api/v1/trips/backhaul-breakeven', () => {
    test('calculates minimum acceptable backhaul rate for Pune -> Nagpur return load', async () => {
      const res = await request(app)
        .post('/api/v1/trips/backhaul-breakeven')
        .send({
          projectedReturnDieselCost: 14500,
          projectedTollsCost: 3950,
          driverBhattaCost: 2000,
          dailyAllocatedEmi: 1600, // Pro-rated EMI
          ratedReturnPayloadTonnes: 24.0
        });

      expect(res.status).toBe(200);
      // Total direct return cost = 14500 + 3950 + 2000 + 1600 = 22,050
      expect(res.body.data.totalDirectReturnCost).toBe(22050);
      // Min rate per MT = 22050 / 24 = 918.75
      expect(res.body.data.minAcceptableFreightRatePerTonne).toBe(918.75);
    });
  });

  describe('Fuel Variance & Siphoning Audit Endpoints', () => {
    test('POST /api/v1/fuel-audit/trip-audit flags low mileage < 2.6 km/L', async () => {
      // 720 km running on 300L = 2.4 km/L
      const res = await request(app)
        .post('/api/v1/fuel-audit/trip-audit')
        .send({
          distanceRunKm: 720,
          totalDieselLitresPurchased: 300
        });

      expect(res.status).toBe(200);
      expect(res.body.data.calculatedKmpl).toBe(2.4);
      expect(res.body.data.isVarianceAlertTriggered).toBe(true);
      expect(res.body.data.alertFlag).toBe('POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK');
    });

    test('POST /api/v1/fuel-audit/siphon-check detects stationary tank drop', async () => {
      const res = await request(app)
        .post('/api/v1/fuel-audit/siphon-check')
        .send({
          previousFuelLevel: 200,
          currentFuelLevel: 180, // 20L drop
          isIgnitionOn: false,
          speedKmh: 0,
          timeDeltaSeconds: 300 // 5 minutes
        });

      expect(res.status).toBe(200);
      expect(res.body.data.isSiphoningSuspected).toBe(true);
      expect(res.body.data.dropLitres).toBe(20);
    });
  });

  describe('AIS-140 Telematics & Corridor Endpoints', () => {
    test('POST /api/v1/telematics/ping ingests raw tracker packet', async () => {
      const raw =
        '$PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,58.4,14250.8,0001,0000,165.4,0.0,Airtel';

      const res = await request(app).post('/api/v1/telematics/ping').send({ rawPacket: raw });

      expect(res.status).toBe(200);
      expect(res.body.data.packet.imei).toBe('867530901234567');
      expect(res.body.data.packet.ignitionOn).toBe(true);
      expect(res.body.data.packet.speedKmh).toBe(58.4);
    });

    test('POST /api/v1/ocr/extract extracts Indian logistics metadata', async () => {
      const text = `
        MAHARASHTRA RTO REGISTRATION: MH 40 AK 9988
        E-WAY BILL NO: 991827364512
        BILTY NO: LR-2026-8812
        GROSS WT: 35.00 MT
        TARE WT: 11.00 MT
      `;

      const res = await request(app).post('/api/v1/ocr/extract').send({ text });

      expect(res.status).toBe(200);
      expect(res.body.data.vehicleRegistrationNumber).toBe('MH40AK9988');
      expect(res.body.data.ewayBillNumber).toBe('991827364512');
      expect(res.body.data.biltyNumber).toBe('LR-2026-8812');
      expect(res.body.data.grossWeightKg).toBe(35000);
      expect(res.body.data.tareWeightKg).toBe(11000);
    });

    test('GET /api/v1/corridors/NAGPUR_PUNE returns operational metrics', async () => {
      const res = await request(app).get('/api/v1/corridors/NAGPUR_PUNE');

      expect(res.status).toBe(200);
      expect(res.body.data.oneWayDistanceKm).toBe(720);
      expect(res.body.data.dieselEstimate.estimatedDieselLitres).toBe(240); // 720 / 3.0 km/L
      expect(res.body.data.estimatedTollCost['12_WHEELER']).toBe(3950);
    });
  });
});
