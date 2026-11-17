import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Clock,
  IndianRupee,
  MessageSquare,
  FileText,
  CheckCircle2,
  PhoneCall,
  UserX,
  ExternalLink,
  Send,
  Plus,
  X,
  Filter
} from 'lucide-react';
import { api } from '../api/client';
import { PodBalanceClaim } from '../types';

export const BalanceSentinel: React.FC = () => {
  const [claims, setClaims] = useState<PodBalanceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaimForNotice, setSelectedClaimForNotice] = useState<PodBalanceClaim | null>(null);
  const [noticeText, setNoticeText] = useState('');
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false);
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);

  // Form state
  const [brokerName, setBrokerName] = useState('');
  const [brokerPhone, setBrokerPhone] = useState('');
  const [biltyNumber, setBiltyNumber] = useState('');
  const [origin, setOrigin] = useState('Nagpur');
  const [destination, setDestination] = useState('Pune');
  const [vehicleNumber, setVehicleNumber] = useState('MH 40 AK 9988');
  const [totalFreight, setTotalFreight] = useState('28000');
  const [advancePaid, setAdvancePaid] = useState('21000');
  const [balanceDue, setBalanceDue] = useState('7000');
  const [unloadingDate, setUnloadingDate] = useState('2026-10-25');
  const [dueDate, setDueDate] = useState('2026-10-28');

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await api.get<{
        success: boolean;
        totalBalanceDue: number;
        totalOverdueCount: number;
        data: PodBalanceClaim[];
      }>('/pod-claims');
      if (res.data) {
        setClaims(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch POD claims:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleGenerateNotice = async (claim: PodBalanceClaim) => {
    try {
      const res = await api.post<{
        success: boolean;
        data: { noticeText: string; whatsappUrl: string };
      }>(`/pod-claims/${claim.id}/legal-notice`);

      if (res.data) {
        setSelectedClaimForNotice(claim);
        setNoticeText(res.data.noticeText);
        setWhatsappUrl(res.data.whatsappUrl);
        setIsNoticeModalOpen(true);
        // refresh list
        fetchClaims();
      }
    } catch (err) {
      alert('Failed to generate notice: ' + err);
    }
  };

  const handleSettle = async (claimId: string) => {
    if (!window.confirm('Mark this balance payment as fully settled and credited to ledger?')) return;
    try {
      await api.post(`/pod-claims/${claimId}/settle`, { notes: 'Cleared via IMPS' });
      fetchClaims();
    } catch (err) {
      alert('Settle failed: ' + err);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/pod-claims', {
        brokerName,
        brokerPhone,
        biltyNumber,
        origin,
        destination,
        vehicleNumber,
        totalFreight: Number(totalFreight),
        advancePaid: Number(advancePaid),
        balanceDue: Number(balanceDue),
        unloadingDate,
        dueDate
      });
      setIsNewClaimModalOpen(false);
      fetchClaims();
    } catch (err) {
      alert('Failed to add POD claim: ' + err);
    }
  };

  const totalOutstanding = claims
    .filter((c) => c.recoveryStatus !== 'SETTLED')
    .reduce((sum, c) => sum + Number(c.balanceDue), 0);

  const totalOverdue = claims
    .filter((c) => c.isOverdue && c.recoveryStatus !== 'SETTLED')
    .reduce((sum, c) => sum + Number(c.balanceDue), 0);

  const habitualDefaulters = claims.filter(
    (c) => c.brokerRiskTier === 'HIGH_RISK_DEF_DEFAULTER' && c.recoveryStatus !== 'SETTLED'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border border-rose-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                <span>Anti-Default Sentinel · POD Escrow Khata</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                20-30% Broker Balance Recovery
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Balance Bhaada Recovery Sentinel
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Stop letting mandi brokers hold your 20–30% delivery balance hostage for 30 to 45 days. Automated overdue tracking, statutory legal notices, and platform-wide blacklisting.
            </p>
          </div>

          <button
            onClick={() => setIsNewClaimModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-rose-600/30 flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Track New POD Balance</span>
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold">Total Escrow Receivables</span>
            <IndianRupee className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">
            ₹{totalOutstanding.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-slate-500 mt-1">Pending 20–30% balance payments</p>
        </div>

        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-xs bg-rose-50/20">
          <div className="flex items-center justify-between text-rose-600 mb-2">
            <span className="text-xs font-semibold">Overdue Balance Hostage</span>
            <Clock className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-700">
            ₹{totalOverdue.toLocaleString('en-IN')}
          </div>
          <p className="text-xs text-rose-600/80 mt-1">Delayed past agreed 3–7 day grace period</p>
        </div>

        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-xs bg-amber-50/20">
          <div className="flex items-center justify-between text-amber-700 mb-2">
            <span className="text-xs font-semibold">Defaulting Brokers Flagged</span>
            <UserX className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-800">
            {habitualDefaulters.length}
          </div>
          <p className="text-xs text-amber-700/80 mt-1">Overdue &gt; 15 days on YatraLekha radar</p>
        </div>
      </div>

      {/* Habitual Defaulters Warning Banner */}
      {habitualDefaulters.length > 0 && (
        <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/40 text-rose-900 flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider">
              Warning: High-Risk Defaulting Broker Detected
            </h4>
            <p className="text-xs text-rose-800 mt-0.5">
              {habitualDefaulters.map((d) => `${d.brokerName} (${d.daysOverdue} days overdue, ₹${d.balanceDue.toLocaleString('en-IN')})`).join('; ')}.
              Do not dispatch future fleet loads until current outstanding balances are settled!
            </p>
          </div>
        </div>
      )}

      {/* Claims List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Broker-wise POD Escrow Khata</h3>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading escrow claims...</div>
        ) : claims.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No active balance claims recorded.</div>
        ) : (
          <div className="space-y-3">
            {claims.map((claim) => {
              const isSettled = claim.recoveryStatus === 'SETTLED';
              const isNoticeSent = claim.recoveryStatus === 'LEGAL_NOTICE_SENT';
              const isHighRisk = claim.brokerRiskTier === 'HIGH_RISK_DEF_DEFAULTER';

              return (
                <div
                  key={claim.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                    isSettled
                      ? 'bg-slate-50 border-slate-200 opacity-60'
                      : isHighRisk
                      ? 'bg-rose-50/40 border-rose-300'
                      : claim.isOverdue
                      ? 'bg-amber-50/30 border-amber-200'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900">{claim.brokerName}</span>
                      <span className="text-xs text-slate-500 font-mono">({claim.brokerPhone})</span>

                      {isSettled ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          SETTLED
                        </span>
                      ) : isNoticeSent ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                          LEGAL NOTICE SENT
                        </span>
                      ) : isHighRisk ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300 animate-pulse">
                          HIGH-RISK DEFAULTER ({claim.daysOverdue}D OVERDUE)
                        </span>
                      ) : claim.isOverdue ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {claim.daysOverdue} DAYS OVERDUE
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          WITHIN GRACE PERIOD
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span>Bilty: <strong className="font-mono text-slate-800">#{claim.biltyNumber}</strong></span>
                      <span>Route: <strong className="text-slate-800">{claim.origin} ➔ {claim.destination}</strong></span>
                      <span>Vehicle: <strong className="font-mono text-indigo-700">{claim.vehicleNumber}</strong></span>
                      <span>Delivered: <strong className="text-slate-800">{new Date(claim.unloadingDate).toLocaleDateString('en-IN')}</strong></span>
                    </div>

                    {claim.disputeNotes && (
                      <p className="text-[11px] text-slate-500 italic mt-1">Note: {claim.disputeNotes}</p>
                    )}
                  </div>

                  <div className="flex flex-col md:items-end gap-2">
                    <div className="text-right">
                      <span className="text-xs text-slate-500 block">Outstanding Balance:</span>
                      <span className="text-lg font-black text-rose-700">
                        ₹{claim.balanceDue.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        (Advance Paid: ₹{claim.advancePaid.toLocaleString('en-IN')} / Total ₹{claim.totalFreight.toLocaleString('en-IN')})
                      </span>
                    </div>

                    {!isSettled && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleGenerateNotice(claim)}
                          className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Send WhatsApp Notice</span>
                        </button>

                        <button
                          onClick={() => handleSettle(claim.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Settled</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Notice Modal */}
      {isNoticeModalOpen && selectedClaimForNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-rose-600" />
                <span>Formal Payment Demand Notice</span>
              </h3>
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono whitespace-pre-wrap max-h-60 overflow-y-auto text-slate-800 leading-relaxed">
                {noticeText}
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsNoticeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Close
              </button>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Launch WhatsApp & Dispatch Notice</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Add New Claim Modal */}
      {isNewClaimModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Track New POD Balance Claim</h3>
            <p className="text-xs text-slate-500 mb-4">
              Record 20–30% delivery balance payment held by broker for automated debt tracking.
            </p>

            <form onSubmit={handleCreateClaim} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Broker Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ritco / Sharma Freight"
                    value={brokerName}
                    onChange={(e) => setBrokerName(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Broker Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98221 44550"
                    value={brokerPhone}
                    onChange={(e) => setBrokerPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bilty Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. BLT-981200"
                    value={biltyNumber}
                    onChange={(e) => setBiltyNumber(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vehicle Reg No</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MH 40 AK 9988"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Total Freight (₹)</label>
                  <input
                    type="number"
                    required
                    value={totalFreight}
                    onChange={(e) => {
                      setTotalFreight(e.target.value);
                      const adv = Math.round(Number(e.target.value) * 0.75);
                      setAdvancePaid(adv.toString());
                      setBalanceDue((Number(e.target.value) - adv).toString());
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Advance Paid (₹)</label>
                  <input
                    type="number"
                    required
                    value={advancePaid}
                    onChange={(e) => {
                      setAdvancePaid(e.target.value);
                      setBalanceDue((Number(totalFreight) - Number(e.target.value)).toString());
                    }}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Balance Due (₹)</label>
                  <input
                    type="number"
                    required
                    value={balanceDue}
                    onChange={(e) => setBalanceDue(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 font-bold text-rose-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unloading Date</label>
                  <input
                    type="date"
                    required
                    value={unloadingDate}
                    onChange={(e) => setUnloadingDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-xs"
                >
                  Save to Escrow Khata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
