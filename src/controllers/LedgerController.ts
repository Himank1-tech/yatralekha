import { Request, Response } from 'express';
import { LedgerRepository } from '../repositories';
import { LedgerEngine } from '../services/LedgerEngine';

export class LedgerController {
  public static listAll(req: Request, res: Response): void {
    const journals = LedgerRepository.listAll();
    res.json({ success: true, count: journals.length, data: journals });
  }

  public static getTripJournals(req: Request, res: Response): void {
    const tripId = req.params.tripId as string;
    const journals = LedgerRepository.getTripJournals(tripId);
    res.json({ success: true, count: journals.length, data: journals });
  }

  public static getTrialBalance(req: Request, res: Response): void {
    const journals = LedgerRepository.listAll();
    let totalDebitPaise = 0n;
    let totalCreditPaise = 0n;

    const accountBalances = new Map<string, { accountName: string; debitPaise: bigint; creditPaise: bigint }>();

    for (const j of journals) {
      for (const line of j.lines) {
        totalDebitPaise += line.debitPaise;
        totalCreditPaise += line.creditPaise;

        const current = accountBalances.get(line.accountCode) ?? {
          accountName: line.accountName,
          debitPaise: 0n,
          creditPaise: 0n
        };
        current.debitPaise += line.debitPaise;
        current.creditPaise += line.creditPaise;
        accountBalances.set(line.accountCode, current);
      }
    }

    const accounts = Array.from(accountBalances.entries()).map(([code, val]) => ({
      accountCode: code,
      accountName: val.accountName,
      debitRupees: LedgerEngine.paiseToRupees(val.debitPaise),
      creditRupees: LedgerEngine.paiseToRupees(val.creditPaise)
    }));

    res.json({
      success: true,
      trialBalance: {
        isBalanced: totalDebitPaise === totalCreditPaise,
        totalDebitRupees: LedgerEngine.paiseToRupees(totalDebitPaise),
        totalCreditRupees: LedgerEngine.paiseToRupees(totalCreditPaise),
        totalDebitPaise: totalDebitPaise.toString(),
        totalCreditPaise: totalCreditPaise.toString()
      },
      accounts
    });
  }
}
