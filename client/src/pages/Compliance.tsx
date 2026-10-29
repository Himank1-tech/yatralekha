import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Lock,
  Unlock,
  Key,
  Calendar,
  FileText,
  Plus,
  CheckCircle2,
  AlertOctagon
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatDate } from '../utils/formatters';
import { api } from '../api/client';
import { DocumentType } from '../types';

export const Compliance: React.FC = () => {
  const [pinModalDoc, setPinModalDoc] = useState<any | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [unlockedFilePath, setUnlockedFilePath] = useState<string | null>(null);

  const [documents, setDocuments] = useState([
    {
      id: 'doc-1',
      vehicleRegNo: 'MH 40 AK 9988',
      documentType: 'FITNESS' as DocumentType,
      documentNumber: 'MH40/FORM38/2026/0019',
      issueDate: '2025-01-01',
      expiryDate: '2027-01-01',
      daysRemaining: 62,
      alertTier: 'COMPLIANT',
      cycleRule: '2-Year Cycle (Vehicle < 8 yrs old)',
      isSecured: true
    },
    {
      id: 'doc-2',
      vehicleRegNo: 'MH 40 AK 9988',
      documentType: 'PERMIT' as DocumentType,
      documentNumber: 'AIP/MH/2022/8812',
      issueDate: '2022-04-10',
      expiryDate: '2027-04-10',
      daysRemaining: 163,
      alertTier: 'COMPLIANT',
      cycleRule: '5-Year All India Permit (AIP)',
      isSecured: true
    },
    {
      id: 'doc-3',
      vehicleRegNo: 'MH 31 AP 4411',
      documentType: 'PUC' as DocumentType,
      documentNumber: 'PUC-MH-2026-9921',
      issueDate: '2026-05-15',
      expiryDate: '2026-11-15',
      daysRemaining: 17,
      alertTier: '30_DAYS',
      cycleRule: '6-Month Cycle',
      isSecured: true
    },
    {
      id: 'doc-4',
      vehicleRegNo: 'MH 31 AP 4411',
      documentType: 'ROAD_TAX' as DocumentType,
      documentNumber: 'TAX/MAH/Q3/2026',
      issueDate: '2026-08-01',
      expiryDate: '2026-11-01',
      daysRemaining: 3,
      alertTier: '3_DAYS',
      cycleRule: 'Quarterly MV Tax',
      isSecured: true
    }
  ]);

  const handleVerifyPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);
    setUnlockedFilePath(null);

    // Call API PIN verification or test simulation
    if (pinInput === '8821' || pinInput === '1234') {
      setPinMessage('Access Authorized! Secure storage token verified.');
      setUnlockedFilePath(`/secure/rto_vault/MH40AK9988_${pinModalDoc.documentType}.pdf`);
    } else {
      setPinMessage('ACCESS DENIED: Invalid document authorization PIN');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Statutory Compliance & RTO Vault
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Automated MV Act expiry watchdogs (30d, 15d, 3d, Expired) and Mahavitran-style PIN/password protected storage.
        </p>
      </div>

      {/* Watchdog Tiers Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Compliant</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">2 Documents</div>
          <div className="text-[11px] text-slate-400 mt-0.5">&gt; 30 days remaining</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 uppercase">30-Day Tier</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-bold text-amber-900 mt-2">1 Document</div>
          <div className="text-[11px] text-amber-700 mt-0.5">PUC renewal initiated</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-rose-200 bg-rose-50/40">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700 uppercase">3-Day Urgent</span>
            <AlertOctagon className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-bold text-rose-900 mt-2">1 Document</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Road Tax expires in 3 days</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Expired / Grounded</span>
            <Lock className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 mt-2">0 Documents</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Zero groundings</div>
        </div>
      </div>

      {/* Documents List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Active Certificates & Passing Watchdogs
          </span>
          <Badge variant="indigo">PIN Vault Protected</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Document Type</th>
                <th className="py-3 px-4">Certificate #</th>
                <th className="py-3 px-4">Issue Date</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Cycle Rule</th>
                <th className="py-3 px-4">Watchdog Tier</th>
                <th className="py-3 px-4 text-right">Encrypted Vault</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {documents.map((d) => (
                <tr key={d.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                    {d.vehicleRegNo}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">{d.documentType}</td>
                  <td className="py-3.5 px-4 font-mono text-slate-600">{d.documentNumber}</td>
                  <td className="py-3.5 px-4 text-slate-500">{formatDate(d.issueDate)}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{formatDate(d.expiryDate)}</td>
                  <td className="py-3.5 px-4 text-slate-500">{d.cycleRule}</td>
                  <td className="py-3.5 px-4">
                    {d.alertTier === '3_DAYS' && (
                      <Badge variant="rose" size="sm">
                        3 Days Remaining!
                      </Badge>
                    )}
                    {d.alertTier === '30_DAYS' && (
                      <Badge variant="amber" size="sm">
                        Expires in {d.daysRemaining}d
                      </Badge>
                    )}
                    {d.alertTier === 'COMPLIANT' && (
                      <Badge variant="emerald" size="sm">
                        Compliant ({d.daysRemaining}d)
                      </Badge>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => {
                        setPinModalDoc(d);
                        setPinInput('');
                        setPinMessage(null);
                        setUnlockedFilePath(null);
                      }}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition"
                    >
                      <Lock className="w-3 h-3 text-amber-400" />
                      PIN Unlock
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PIN Unlock Modal */}
      {pinModalDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900">Mahavitran-Style PIN Vault</h3>
              </div>
              <button
                onClick={() => setPinModalDoc(null)}
                className="text-slate-400 hover:text-slate-600 font-bold text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Enter 4-digit security PIN to unlock certified{' '}
              <strong className="text-slate-900">{pinModalDoc.documentType}</strong> for{' '}
              <span className="font-mono">{pinModalDoc.vehicleRegNo}</span>.
            </p>

            <form onSubmit={handleVerifyPin} className="space-y-4">
              <div>
                <input
                  type="password"
                  maxLength={6}
                  placeholder="Enter PIN (e.g. 8821)"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  className="w-full text-center font-mono font-bold tracking-widest text-lg border border-slate-300 rounded-lg py-2.5 bg-slate-50 focus:bg-white"
                />
                <p className="text-[10px] text-slate-400 text-center mt-1">
                  Demo PIN: <strong className="text-slate-600">8821</strong>
                </p>
              </div>

              {pinMessage && (
                <div
                  className={`p-2.5 rounded text-xs text-center font-medium ${
                    unlockedFilePath
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {pinMessage}
                </div>
              )}

              {unlockedFilePath && (
                <div className="p-3 bg-slate-50 rounded border border-slate-200 text-xs font-mono break-all text-indigo-700">
                  📄 {unlockedFilePath}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
              >
                Verify Hash & Retrieve File
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
