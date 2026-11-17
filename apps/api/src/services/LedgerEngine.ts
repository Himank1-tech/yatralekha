import Decimal from 'decimal.js';
import { TripBillingResult, ExpenseBreakdown } from '../types/domain';

export interface JournalLine {
  accountCode: string;
  accountName: string;
  debitPaise: bigint;
  creditPaise: bigint;
  memo?: string;
}

export interface JournalEntry {
  entryNumber: string;
  description: string;
  timestamp: Date;
  lines: JournalLine[];
  totalDebitPaise: bigint;
  totalCreditPaise: bigint;
  isBalanced: boolean;
}

export class LedgerEngine {
  /**
   * Converts Rupee amounts with decimals into exact integer paise (1 INR = 100 paise).
   */
  public static rupeesToPaise(rupees: number | Decimal): bigint {
    const dec = new Decimal(rupees);
    const paise = dec.times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);
    return BigInt(paise.toString());
  }

  /**
   * Converts integer paise back into standard Rupee number.
   */
  public static paiseToRupees(paise: bigint): number {
    return new Decimal(paise.toString()).dividedBy(100).toNumber();
  }

  /**
   * Creates and verifies a balanced double-entry journal entry.
   * Throws an error if Debits != Credits.
   */
  public static createJournalEntry(
    entryNumber: string,
    description: string,
    lines: JournalLine[],
    timestamp: Date = new Date()
  ): JournalEntry {
    let totalDebitPaise = 0n;
    let totalCreditPaise = 0n;

    for (const line of lines) {
      if (line.debitPaise < 0n || line.creditPaise < 0n) {
        throw new Error(`Ledger line amounts cannot be negative for account ${line.accountCode}`);
      }
      if (line.debitPaise > 0n && line.creditPaise > 0n) {
        throw new Error(`Ledger line must be exclusively debit OR credit for account ${line.accountCode}`);
      }
      if (line.debitPaise === 0n && line.creditPaise === 0n) {
        throw new Error(`Ledger line must have non-zero movement for account ${line.accountCode}`);
      }

      totalDebitPaise += line.debitPaise;
      totalCreditPaise += line.creditPaise;
    }

    const isBalanced = totalDebitPaise === totalCreditPaise;
    if (!isBalanced) {
      const diff = totalDebitPaise > totalCreditPaise
        ? totalDebitPaise - totalCreditPaise
        : totalCreditPaise - totalDebitPaise;
      throw new Error(
        `UNBALANCED JOURNAL ENTRY (${entryNumber}): Total Debits (${totalDebitPaise} paise) does not equal Total Credits (${totalCreditPaise} paise). Discrepancy: ${diff} paise.`
      );
    }

    return {
      entryNumber,
      description,
      timestamp,
      lines,
      totalDebitPaise,
      totalCreditPaise,
      isBalanced
    };
  }

  /**
   * Generates initial freight invoice journal entry:
   * Debit: Assets:Receivables:FreightBroker (Gross Freight)
   * Credit: Revenues:FreightIncome (Gross Freight)
   */
  public static generateFreightInvoiceJournal(
    tripSerialNumber: string,
    billing: TripBillingResult,
    brokerName: string = 'Freight Broker'
  ): JournalEntry {
    const grossPaise = this.rupeesToPaise(billing.grossFreight);

    const lines: JournalLine[] = [
      {
        accountCode: '1100-RECEIVABLES-BROKER',
        accountName: `Accounts Receivable - ${brokerName}`,
        debitPaise: grossPaise,
        creditPaise: 0n,
        memo: `Gross freight billed for trip ${tripSerialNumber}`
      },
      {
        accountCode: '4000-FREIGHT-REVENUE',
        accountName: 'Freight Income',
        debitPaise: 0n,
        creditPaise: grossPaise,
        memo: `Billed freight revenue for trip ${tripSerialNumber}`
      }
    ];

    return this.createJournalEntry(
      `JE-INV-${tripSerialNumber}`,
      `Freight invoice recognition for trip ${tripSerialNumber}`,
      lines
    );
  }

  /**
   * Generates loading advance disbursement journal entry (70% - 80% split):
   * Debit: Assets:Cash:DriverAdvance / Liabilities:FuelPump
   * Credit: Assets:Receivables:FreightBroker
   */
  public static generateAdvanceDisbursementJournal(
    tripSerialNumber: string,
    billing: TripBillingResult,
    cashPortionRupees: number,
    dieselParchiPortionRupees: number
  ): JournalEntry {
    const advancePaise = this.rupeesToPaise(billing.advanceAmount);
    const cashPaise = this.rupeesToPaise(cashPortionRupees);
    const dieselPaise = this.rupeesToPaise(dieselParchiPortionRupees);

    if (cashPaise + dieselPaise !== advancePaise) {
      throw new Error(
        `Advance breakdown mismatch: Cash (${cashPortionRupees}) + Fuel Slip (${dieselParchiPortionRupees}) must equal Advance Amount (${billing.advanceAmount})`
      );
    }

    const lines: JournalLine[] = [];

    if (cashPaise > 0n) {
      lines.push({
        accountCode: '1050-DRIVER-ADVANCE-CASH',
        accountName: 'Driver Cash Advance Wallet',
        debitPaise: cashPaise,
        creditPaise: 0n,
        memo: `Disbursed advance cash at loading for trip ${tripSerialNumber}`
      });
    }

    if (dieselPaise > 0n) {
      lines.push({
        accountCode: '5010-EXPENSE-DIESEL',
        accountName: 'Diesel Fuel Expense (Advance Parchi)',
        debitPaise: dieselPaise,
        creditPaise: 0n,
        memo: `Advance fuel credit slip at loading for trip ${tripSerialNumber}`
      });
    }

    lines.push({
      accountCode: '1100-RECEIVABLES-BROKER',
      accountName: 'Accounts Receivable - Freight Broker',
      debitPaise: 0n,
      creditPaise: advancePaise,
      memo: `Advance deduction received against trip ${tripSerialNumber}`
    });

    return this.createJournalEntry(
      `JE-ADV-${tripSerialNumber}`,
      `Advance disbursement at loading for trip ${tripSerialNumber}`,
      lines
    );
  }

  /**
   * Generates Proof of Delivery (POD) clearance journal entry (20% - 30% balance realization):
   * Debit: Assets:Bank:CurrentAccount
   * Credit: Assets:Receivables:FreightBroker
   */
  public static generatePodSettlementJournal(
    tripSerialNumber: string,
    billing: TripBillingResult
  ): JournalEntry {
    const podBalancePaise = this.rupeesToPaise(billing.balancePodDue);

    const lines: JournalLine[] = [
      {
        accountCode: '1010-BANK-CURRENT',
        accountName: 'Primary Current Account',
        debitPaise: podBalancePaise,
        creditPaise: 0n,
        memo: `POD settlement balance realization for trip ${tripSerialNumber}`
      },
      {
        accountCode: '1100-RECEIVABLES-BROKER',
        accountName: 'Accounts Receivable - Freight Broker',
        debitPaise: 0n,
        creditPaise: podBalancePaise,
        memo: `Cleared POD balance receivable for trip ${tripSerialNumber}`
      }
    ];

    return this.createJournalEntry(
      `JE-POD-${tripSerialNumber}`,
      `POD balance settlement realization for trip ${tripSerialNumber}`,
      lines
    );
  }
}
