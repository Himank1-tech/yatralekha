import { LedgerEngine } from '../src/services/LedgerEngine';
import { TripFinanceEngine } from '../src/services/TripFinanceEngine';

describe('LedgerEngine (Double-Entry Freight Khata)', () => {
  describe('Integer Arithmetic & Unit Conversions', () => {
    test('converts fractional rupees to exact integer paise without floating point error', () => {
      // 28,175.75 rupees = 2,817,575 paise
      expect(LedgerEngine.rupeesToPaise(28175.75)).toBe(2817575n);
      expect(LedgerEngine.rupeesToPaise(0.01)).toBe(1n);
      expect(LedgerEngine.rupeesToPaise(100.5)).toBe(10050n);

      expect(LedgerEngine.paiseToRupees(2817575n)).toBe(28175.75);
    });
  });

  describe('Double-Entry Balance Enforcement', () => {
    test('successfully generates balanced journal entry', () => {
      const entry = LedgerEngine.createJournalEntry('JE-TEST-001', 'Test Entry', [
        {
          accountCode: '1010-CASH',
          accountName: 'Cash',
          debitPaise: 50000n, // ₹500
          creditPaise: 0n
        },
        {
          accountCode: '4000-REVENUE',
          accountName: 'Revenue',
          debitPaise: 0n,
          creditPaise: 50000n // ₹500
        }
      ]);

      expect(entry.isBalanced).toBe(true);
      expect(entry.totalDebitPaise).toBe(50000n);
      expect(entry.totalCreditPaise).toBe(50000n);
    });

    test('strictly rejects unbalanced journal entry', () => {
      expect(() => {
        LedgerEngine.createJournalEntry('JE-TEST-UNBALANCED', 'Unbalanced', [
          {
            accountCode: '1010-CASH',
            accountName: 'Cash',
            debitPaise: 50000n,
            creditPaise: 0n
          },
          {
            accountCode: '4000-REVENUE',
            accountName: 'Revenue',
            debitPaise: 0n,
            creditPaise: 49900n // 100 paise discrepancy
          }
        ]);
      }).toThrow('UNBALANCED JOURNAL ENTRY');
    });
  });

  describe('Full Trip Khata Lifecycle (Invoice -> Advance -> POD Settlement)', () => {
    test('reconciles entire khata split without currency rounding leakage', () => {
      // Trip: Nagpur ↔ Pune, 24.5 MT @ ₹1,150/MT -> Gross: ₹28,175.00
      // 75% Advance: ₹21,131.25 (Disbursed as ₹6,131.25 Cash + ₹15,000 Diesel Parchi)
      // 25% Balance POD: ₹7,043.75 (Settled via Bank NEFT upon signed bilty verification)
      const billing = TripFinanceEngine.calculateTripBilling({
        billedWeightTonnes: 24.5,
        rateType: 'PER_TONNE',
        freightRate: 1150,
        advancePercentage: 0.75
      });

      const tripId = 'NGP-PUN-2026-001';

      // 1. Initial Invoice Generation
      const invJournal = LedgerEngine.generateFreightInvoiceJournal(tripId, billing, 'Agarwal Logistics');
      expect(invJournal.isBalanced).toBe(true);
      expect(invJournal.totalDebitPaise).toBe(2817500n); // ₹28,175.00 in paise

      // 2. Advance Disbursement (Cash ₹6,131.25 + Fuel Parchi ₹15,000.00 = ₹21,131.25)
      const advJournal = LedgerEngine.generateAdvanceDisbursementJournal(
        tripId,
        billing,
        6131.25,
        15000.0
      );
      expect(advJournal.isBalanced).toBe(true);
      expect(advJournal.totalDebitPaise).toBe(2113125n); // ₹21,131.25 in paise

      // 3. POD Settlement (Balance ₹7,043.75)
      const podJournal = LedgerEngine.generatePodSettlementJournal(tripId, billing);
      expect(podJournal.isBalanced).toBe(true);
      expect(podJournal.totalDebitPaise).toBe(704375n); // ₹7,043.75 in paise

      // Mathematical Verification of Khata Balance:
      // AR debited initially by 2,817,500 paise
      // AR credited by advance (2,113,125) + POD (704,375) = 2,817,500 paise
      const totalArCredits = advJournal.lines[2].creditPaise + podJournal.lines[1].creditPaise;
      expect(totalArCredits).toBe(invJournal.lines[0].debitPaise);
    });
  });
});
