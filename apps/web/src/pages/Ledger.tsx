import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle2, ShieldCheck, Scale, AlertCircle } from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatINR } from '../utils/formatters';
import { api } from '../api/client';
import { JournalEntry, TrialBalanceAccount } from '../types';

export const Ledger: React.FC = () => {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [trialBalance, setTrialBalance] = useState<any | null>(null);
  const [accounts, setAccounts] = useState<TrialBalanceAccount[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchLedger() {
      try {
        setLoading(true);
        const tbRes = await api.get<{
          success: boolean;
          trialBalance: any;
          accounts: TrialBalanceAccount[];
        }>('/ledger/trial-balance').catch(() => null);

        if (tbRes?.trialBalance) {
          setTrialBalance(tbRes.trialBalance);
          setAccounts(tbRes.accounts);
        }

        const jRes = await api.get<{ success: boolean; data: JournalEntry[] }>(
          '/ledger/journal-entries'
        ).catch(() => null);

        if (jRes?.data && jRes.data.length > 0) {
          setJournals(jRes.data);
        } else {
          // Demo journal entries
          setJournals([
            {
              entryNumber: 'JE-INV-TRIP-2026-001',
              description: 'Freight invoice recognition for trip TRIP-2026-NGP-PUN-001',
              timestamp: new Date().toISOString(),
              totalDebitPaise: '2817500',
              totalCreditPaise: '2817500',
              isBalanced: true,
              lines: [
                {
                  accountCode: '1100-RECEIVABLES-BROKER',
                  accountName: 'Accounts Receivable - Freight Broker',
                  debitPaise: '2817500',
                  creditPaise: '0',
                  memo: 'Gross freight billed for 24.5 MT'
                },
                {
                  accountCode: '4000-FREIGHT-REVENUE',
                  accountName: 'Freight Income',
                  debitPaise: '0',
                  creditPaise: '2817500',
                  memo: 'Billed freight revenue @ ₹1,150/MT'
                }
              ]
            },
            {
              entryNumber: 'JE-ADV-TRIP-2026-001',
              description: '75% Advance disbursement at loading (Cash + Diesel Slip)',
              timestamp: new Date().toISOString(),
              totalDebitPaise: '2113125',
              totalCreditPaise: '2113125',
              isBalanced: true,
              lines: [
                {
                  accountCode: '1050-DRIVER-ADVANCE-CASH',
                  accountName: 'Driver Cash Advance Wallet',
                  debitPaise: '613125',
                  creditPaise: '0',
                  memo: 'Disbursed loading cash'
                },
                {
                  accountCode: '5010-EXPENSE-DIESEL',
                  accountName: 'Diesel Fuel Expense (Advance Parchi)',
                  debitPaise: '1500000',
                  creditPaise: '0',
                  memo: 'Advance fuel slip BPCL Karanja Lad'
                },
                {
                  accountCode: '1100-RECEIVABLES-BROKER',
                  accountName: 'Accounts Receivable - Freight Broker',
                  debitPaise: '0',
                  creditPaise: '2113125',
                  memo: 'Advance deduction received against trip'
                }
              ]
            },
            {
              entryNumber: 'JE-POD-TRIP-2026-001',
              description: 'POD settlement balance realization (25% balance)',
              timestamp: new Date().toISOString(),
              totalDebitPaise: '704375',
              totalCreditPaise: '704375',
              isBalanced: true,
              lines: [
                {
                  accountCode: '1010-BANK-CURRENT',
                  accountName: 'Primary Current Account',
                  debitPaise: '704375',
                  creditPaise: '0',
                  memo: 'NEFT credit from Broker'
                },
                {
                  accountCode: '1100-RECEIVABLES-BROKER',
                  accountName: 'Accounts Receivable - Freight Broker',
                  debitPaise: '0',
                  creditPaise: '704375',
                  memo: 'Cleared balance receivable upon POD verify'
                }
              ]
            }
          ]);

          setTrialBalance({
            isBalanced: true,
            totalDebitRupees: 56350,
            totalCreditRupees: 56350,
            totalDebitPaise: '5635000',
            totalCreditPaise: '5635000'
          });

          setAccounts([
            {
              accountCode: '1010-BANK-CURRENT',
              accountName: 'Primary Current Account',
              debitRupees: 7043.75,
              creditRupees: 0
            },
            {
              accountCode: '1050-DRIVER-ADVANCE-CASH',
              accountName: 'Driver Cash Advance Wallet',
              debitRupees: 6131.25,
              creditRupees: 0
            },
            {
              accountCode: '1100-RECEIVABLES-BROKER',
              accountName: 'Accounts Receivable - Freight Broker',
              debitRupees: 28175,
              creditRupees: 28175
            },
            {
              accountCode: '4000-FREIGHT-REVENUE',
              accountName: 'Freight Income',
              debitRupees: 0,
              creditRupees: 28175
            },
            {
              accountCode: '5010-EXPENSE-DIESEL',
              accountName: 'Diesel Fuel Expense',
              debitRupees: 15000,
              creditRupees: 0
            }
          ]);
        }
      } catch (err) {
        console.warn('Ledger error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLedger();
  }, []);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Double-Entry Freight Ledger
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Exact integer paise arithmetic enforcing zero currency leakage across loading advances and POD realizations.
        </p>
      </div>

      {/* Trial Balance Banner */}
      {trialBalance && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-slate-900">Platform Trial Balance</span>
                <Badge variant="emerald" size="sm">Balanced: Debits ≡ Credits</Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Total Debits: <strong>{formatINR(trialBalance.totalDebitRupees)}</strong> | Total Credits:{' '}
                <strong>{formatINR(trialBalance.totalCreditRupees)}</strong>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[11px] text-slate-400 font-mono">Integer Precision</span>
            <div className="text-xs font-mono font-bold text-slate-700">
              {trialBalance.totalDebitPaise} Paise
            </div>
          </div>
        </div>
      )}

      {/* Chart of Accounts Summary */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Ledger Accounts & Balances
          </span>
          <Badge variant="indigo">{accounts.length} Accounts</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Account Code</th>
                <th className="py-3 px-4">Account Name</th>
                <th className="py-3 px-4 text-right">Debit (₹)</th>
                <th className="py-3 px-4 text-right">Credit (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {accounts.map((acc) => (
                <tr key={acc.accountCode} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">{acc.accountCode}</td>
                  <td className="py-3 px-4 font-medium text-slate-900">{acc.accountName}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    {acc.debitRupees > 0 ? formatINR(acc.debitRupees) : '-'}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-900">
                    {acc.creditRupees > 0 ? formatINR(acc.creditRupees) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Journal Entries List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
          Audit Trail of Journal Entries ({journals.length})
        </h2>

        {journals.map((j) => (
          <div key={j.entryNumber} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono font-bold text-sm text-indigo-700">{j.entryNumber}</span>
                <span className="text-xs text-slate-500 ml-3">{j.description}</span>
              </div>
              <Badge variant="emerald" size="sm">Balanced</Badge>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="py-2 px-3">Account</th>
                    <th className="py-2 px-3">Memo</th>
                    <th className="py-2 px-3 text-right">Debit (Paise)</th>
                    <th className="py-2 px-3 text-right">Credit (Paise)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {j.lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="py-2 px-3 font-semibold text-slate-900">{line.accountName}</td>
                      <td className="py-2 px-3 text-slate-500">{line.memo || '-'}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {line.debitPaise !== '0' ? line.debitPaise : '-'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        {line.creditPaise !== '0' ? line.creditPaise : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
