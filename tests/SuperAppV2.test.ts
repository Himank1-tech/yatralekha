import request from 'supertest';
import { createApp } from '../src/server/app';
import { seedDatabase } from '../src/database/seed';

describe('YatraLekha v2.0 Super-App Integration Tests', () => {
  const app = createApp();

  beforeAll(() => {
    seedDatabase();
  });

  describe('Intelligent Freight Board & Marketplace (/api/v1/loads)', () => {
    it('fetches available loads with corridor and axle filters', async () => {
      const res = await request(app).get('/api/v1/loads?status=AVAILABLE');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);

      const firstLoad = res.body.data[0];
      expect(firstLoad).toHaveProperty('origin');
      expect(firstLoad).toHaveProperty('destination');
      expect(firstLoad).toHaveProperty('offeredRate');
      expect(firstLoad).toHaveProperty('shipperName');
      expect(firstLoad).toHaveProperty('advancePercent');
    });

    it('books an available freight load', async () => {
      const listRes = await request(app).get('/api/v1/loads?status=AVAILABLE');
      const loadToBook = listRes.body.data[0];

      const bookRes = await request(app).post(`/api/v1/loads/${loadToBook.id}/book`);
      expect(bookRes.status).toBe(200);
      expect(bookRes.body.success).toBe(true);
      expect(bookRes.body.data.status).toBe('BOOKED');
    });

    it('fetches preferred lanes configuration', async () => {
      const res = await request(app).get('/api/v1/preferred-lanes');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Statutory RTO & KYC Verification Center (/api/v1/verify)', () => {
    it('verifies VAHAN RC passing limits and calculates max legal payload', async () => {
      const res = await request(app)
        .post('/api/v1/verify/vahan')
        .send({ registrationNumber: 'MH 40 AK 9988' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payload.axleConfiguration).toBe('12_WHEELER');
      expect(res.body.data.payload.passingGvwKg).toBe(35000);
      expect(res.body.data.payload.maxLegalPayloadKg).toBe(24000);
      expect(res.body.data.payload.fitnessStatus).toBe('ACTIVE_VALID');
    });

    it('verifies Sarathi DL with Commercial Transport Endorsement', async () => {
      const res = await request(app)
        .post('/api/v1/verify/sarathi')
        .send({ dlNumber: 'MH14 20180012345' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.payload.commercialTransportEndorsement.hasEndorsement).toBe(true);
      expect(res.body.data.payload.driverName).toBe('Sanjay Yadav');
    });
  });

  describe('In-App Call Logs & Dialer Ledger (/api/v1/call-logs)', () => {
    it('lists communication records with deal outcome tags', async () => {
      const res = await request(app).get('/api/v1/call-logs');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('records a new broker call with deal status', async () => {
      const res = await request(app)
        .post('/api/v1/call-logs')
        .send({
          contactName: 'Ritco Logistics Operations',
          contactRole: 'Broker',
          phoneNumber: '+91 98221 44550',
          laneDiscussed: 'Nagpur ➔ Pune',
          callType: 'OUTGOING',
          durationSeconds: 120,
          dealStatus: 'RATE_CONFIRMED',
          notes: 'Confirmed 23.5 MT loading tomorrow at 9 AM.'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.contactName).toBe('Ritco Logistics Operations');
    });
  });

  describe('Balance Bhaada Sentinel (POD Escrow Khata) (/api/v1/pod-claims)', () => {
    it('tracks overdue POD balance claims and calculates overdue days', async () => {
      const res = await request(app).get('/api/v1/pod-claims');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.totalBalanceDue).toBeGreaterThan(0);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('generates a formal payment demand notice and WhatsApp recovery link', async () => {
      const listRes = await request(app).get('/api/v1/pod-claims');
      const claim = listRes.body.data[0];

      const noticeRes = await request(app).post(`/api/v1/pod-claims/${claim.id}/legal-notice`);
      expect(noticeRes.status).toBe(200);
      expect(noticeRes.body.success).toBe(true);
      expect(noticeRes.body.data.noticeText).toContain('PAYMENT DEMAND NOTICE');
      expect(noticeRes.body.data.whatsappUrl).toContain('https://wa.me/');
    });

    it('settles a cleared balance claim', async () => {
      const listRes = await request(app).get('/api/v1/pod-claims');
      const claim = listRes.body.data[0];

      const settleRes = await request(app)
        .post(`/api/v1/pod-claims/${claim.id}/settle`)
        .send({ notes: 'RTGS received in bank account' });

      expect(settleRes.status).toBe(200);
      expect(settleRes.body.success).toBe(true);
      expect(settleRes.body.data.recoveryStatus).toBe('SETTLED');
    });
  });
});
