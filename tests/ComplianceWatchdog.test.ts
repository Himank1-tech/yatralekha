import { ComplianceWatchdog } from '../src/services/ComplianceWatchdog';
import { DocumentSecurityService } from '../src/services/DocumentSecurityService';

describe('ComplianceWatchdog & DocumentSecurityService', () => {
  const baseRegDate = new Date('2022-01-01T00:00:00Z'); // Vehicle registered in 2022 (approx 4yo in 2026)

  describe('Statutory Expiry Watchdogs', () => {
    test('flags certificate expiring in 25 days with 30_DAYS tier', () => {
      const currentDate = new Date('2026-10-01T00:00:00Z');
      const expiryDate = new Date('2026-10-26T00:00:00Z'); // 25 days remaining
      const issueDate = new Date('2025-10-26T00:00:00Z');

      const evaluation = ComplianceWatchdog.evaluateDocument({
        documentType: 'INSURANCE',
        vehicleRegistrationDate: baseRegDate,
        issueDate,
        expiryDate,
        currentDate
      });

      expect(evaluation.alertTier).toBe('30_DAYS');
      expect(evaluation.isExpiringSoon).toBe(true);
      expect(evaluation.daysRemaining).toBe(25);
    });

    test('flags certificate expiring in 12 days with 15_DAYS tier', () => {
      const currentDate = new Date('2026-10-01T00:00:00Z');
      const expiryDate = new Date('2026-10-13T00:00:00Z'); // 12 days remaining
      const issueDate = new Date('2026-04-13T00:00:00Z');

      const evaluation = ComplianceWatchdog.evaluateDocument({
        documentType: 'PUC',
        vehicleRegistrationDate: baseRegDate,
        issueDate,
        expiryDate,
        currentDate
      });

      expect(evaluation.alertTier).toBe('15_DAYS');
      expect(evaluation.isExpiringSoon).toBe(true);
      expect(evaluation.daysRemaining).toBe(12);
    });

    test('flags certificate expiring in 2 days with urgent 3_DAYS tier', () => {
      const currentDate = new Date('2026-10-01T00:00:00Z');
      const expiryDate = new Date('2026-10-03T00:00:00Z'); // 2 days remaining
      const issueDate = new Date('2025-10-03T00:00:00Z');

      const evaluation = ComplianceWatchdog.evaluateDocument({
        documentType: 'ROAD_TAX',
        vehicleRegistrationDate: baseRegDate,
        issueDate,
        expiryDate,
        currentDate
      });

      expect(evaluation.alertTier).toBe('3_DAYS');
      expect(evaluation.isExpiringSoon).toBe(true);
      expect(evaluation.daysRemaining).toBe(2);
    });

    test('flags lapsed certificate with EXPIRED tier and grounding message', () => {
      const currentDate = new Date('2026-10-10T00:00:00Z');
      const expiryDate = new Date('2026-10-05T00:00:00Z'); // Expired 5 days ago
      const issueDate = new Date('2024-10-05T00:00:00Z');

      const evaluation = ComplianceWatchdog.evaluateDocument({
        documentType: 'FITNESS',
        vehicleRegistrationDate: baseRegDate,
        issueDate,
        expiryDate,
        currentDate
      });

      expect(evaluation.alertTier).toBe('EXPIRED');
      expect(evaluation.daysRemaining).toBeLessThanOrEqual(0);
      expect(evaluation.message).toContain('CRITICAL COMPLIANCE FAILURE');
      expect(evaluation.message).toContain('grounded immediately');
    });
  });

  describe('Statutory Validity Rules (MV Act)', () => {
    test('Fitness Certificate: expects 2-year cycle for young vehicles (< 8 years old)', () => {
      const issueDate = new Date('2024-01-01T00:00:00Z');
      const expiryDate = new Date('2026-01-01T00:00:00Z'); // Exactly 2 years (731 days)

      const cycle = ComplianceWatchdog.checkStatutoryCycle('FITNESS', 4.5, issueDate, expiryDate);
      expect(cycle.isValidityCycleValid).toBe(true);
      expect(cycle.expectedCycleDescription).toContain('2 Years');
    });

    test('Fitness Certificate: expects 1-year cycle for older vehicles (>= 8 years old)', () => {
      const issueDate = new Date('2024-01-01T00:00:00Z');
      const expiryDate = new Date('2025-01-01T00:00:00Z'); // Exactly 1 year (366 days)

      const cycle = ComplianceWatchdog.checkStatutoryCycle('FITNESS', 9.2, issueDate, expiryDate);
      expect(cycle.isValidityCycleValid).toBe(true);
      expect(cycle.expectedCycleDescription).toContain('1 Year');
    });

    test('All India Permit (AIP): verifies 5-year cycle', () => {
      const issueDate = new Date('2020-01-01T00:00:00Z');
      const expiryDate = new Date('2025-01-01T00:00:00Z'); // 5 years (1827 days)

      const cycle = ComplianceWatchdog.checkStatutoryCycle('PERMIT', 3.0, issueDate, expiryDate);
      expect(cycle.isValidityCycleValid).toBe(true);
      expect(cycle.expectedCycleDescription).toContain('5 Years');
    });
  });

  describe('DocumentSecurityService (Mahavitran-style PIN Hash)', () => {
    test('hashes document PIN with secure salt and verifies valid pin', () => {
      const pin = '4829';
      const creds = DocumentSecurityService.hashDocumentPin(pin);

      expect(creds.pinHash).toBeDefined();
      expect(creds.salt).toHaveLength(32); // 16 bytes hex

      const isValid = DocumentSecurityService.verifyDocumentPin(pin, creds.pinHash, creds.salt);
      expect(isValid).toBe(true);
    });

    test('rejects incorrect document PIN', () => {
      const pin = '4829';
      const wrongPin = '1234';
      const creds = DocumentSecurityService.hashDocumentPin(pin);

      const isValid = DocumentSecurityService.verifyDocumentPin(wrongPin, creds.pinHash, creds.salt);
      expect(isValid).toBe(false);
    });

    test('computes deterministic SHA-256 hash for document receipt tamper-proofing', () => {
      const content = 'BILTY-RECEIPT-NAGPUR-PUNE-2026-PAYLOAD-24.5MT';
      const hash1 = DocumentSecurityService.computeReceiptHash(content);
      const hash2 = DocumentSecurityService.computeReceiptHash(content);

      expect(hash1).toBe(hash2);
      expect(hash1).toHaveLength(64); // SHA-256 hex string
    });
  });
});
