import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  Search,
  Plus,
  Clock,
  MapPin,
  Tag,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Trash2,
  Sliders,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { CallLog, DealStatus, CallType, ContactRole } from '../types';

export const CallLogs: React.FC = () => {
  const [logs, setLogs] = useState<CallLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isNewCallModalOpen, setIsNewCallModalOpen] = useState(false);

  // New Call Form State
  const [contactName, setContactName] = useState('');
  const [contactRole, setContactRole] = useState<ContactRole>('Broker');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [laneDiscussed, setLaneDiscussed] = useState('Nagpur ➔ Pune');
  const [callType, setCallType] = useState<CallType>('OUTGOING');
  const [durationSeconds, setDurationSeconds] = useState('120');
  const [dealStatus, setDealStatus] = useState<DealStatus>('RATE_CONFIRMED');
  const [notes, setNotes] = useState('');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.get<{ success: boolean; data: CallLog[] }>('/call-logs');
      if (res.data) {
        setLogs(res.data);
      }
    } catch (err) {
      console.error('Failed to load call logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleCreateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: CallLog }>('/call-logs', {
        contactName,
        contactRole,
        phoneNumber,
        laneDiscussed,
        callType,
        durationSeconds: Number(durationSeconds),
        dealStatus,
        notes
      });
      if (res.data) {
        setLogs((prev) => [res.data, ...prev]);
        setIsNewCallModalOpen(false);
        setContactName('');
        setPhoneNumber('');
        setNotes('');
      }
    } catch (err) {
      alert('Failed to log call: ' + err);
    }
  };

  const handleDeleteCall = async (id: string) => {
    try {
      await api.delete(`/call-logs/${id}`);
      setLogs((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err);
    }
  };

  const getStatusBadge = (status: DealStatus) => {
    switch (status) {
      case 'RATE_CONFIRMED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Agreed Rate Confirmed</span>
          </span>
        );
      case 'RATE_TOO_LOW':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
            <XCircle className="w-3 h-3 text-rose-600" />
            <span>Rate Too Low (Rejected)</span>
          </span>
        );
      case 'POD_FOLLOWUP':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-purple-600" />
            <span>Follow-up for POD Balance</span>
          </span>
        );
      case 'EN_ROUTE':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-600" />
            <span>Vehicle En-Route</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
            <HelpCircle className="w-3 h-3 text-amber-600" />
            <span>Negotiating</span>
          </span>
        );
    }
  };

  const filtered = logs.filter((c) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = c.contactName.toLowerCase().includes(q);
      const matchPhone = c.phoneNumber.includes(q);
      const matchLane = c.laneDiscussed.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchLane) return false;
    }
    if (selectedRole !== 'ALL' && c.contactRole !== selectedRole) return false;
    if (selectedStatus !== 'ALL' && c.dealStatus !== selectedStatus) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Integrated Commercial Telephony
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                TrucksUp Memory Match
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              In-App Call Logs & Deal Ledger
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Track real-time freight negotiations with mandi brokers, drivers en-route, and transport agents. Never forget an agreed freight rate or follow-up balance promise.
            </p>
          </div>

          <button
            onClick={() => setIsNewCallModalOpen(true)}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Log Call Interaction</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search contact, phone or corridor discussed..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Roles (Brokers, Drivers, Shippers)</option>
              <option value="Broker">Brokers / Agents</option>
              <option value="Driver">Drivers</option>
              <option value="Shipper">Shippers / Factories</option>
              <option value="Mandi Agent">Mandi Agents</option>
              <option value="Pump Agent">Pump Fuel Agents</option>
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Deal Outcomes</option>
              <option value="RATE_CONFIRMED">Agreed Rate Confirmed</option>
              <option value="RATE_TOO_LOW">Rate Too Low (Rejected)</option>
              <option value="POD_FOLLOWUP">Follow-up for POD Balance</option>
              <option value="EN_ROUTE">Vehicle En-Route</option>
              <option value="NEGOTIATING">Negotiating</option>
            </select>
          </div>
        </div>
      </div>

      {/* Call Logs List */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-900">Communication Timeline ({filtered.length})</h3>
          <span className="text-xs text-slate-400">Sorted by most recent call</span>
        </div>

        {loading ? (
          <div className="py-8 text-center text-slate-400 text-xs">Loading call history...</div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">No matching call records found.</div>
        ) : (
          <div className="space-y-3">
            {filtered.map((call) => {
              const isIncoming = call.callType === 'INCOMING';
              const isMissed = call.callType === 'MISSED';

              return (
                <div
                  key={call.id}
                  className="p-4 rounded-xl border border-slate-200 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      {isMissed ? (
                        <PhoneMissed className="w-4 h-4 text-rose-500 shrink-0" />
                      ) : isIncoming ? (
                        <PhoneIncoming className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <PhoneOutgoing className="w-4 h-4 text-indigo-500 shrink-0" />
                      )}

                      <span className="text-sm font-bold text-slate-900">{call.contactName}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                        {call.contactRole}
                      </span>
                      {getStatusBadge(call.dealStatus)}
                    </div>

                    <div className="text-xs text-slate-600 flex flex-wrap items-center gap-3">
                      <span>Phone: <strong className="font-mono text-slate-800">{call.phoneNumber}</strong></span>
                      <span>Lane Discussed: <strong className="text-indigo-700">{call.laneDiscussed}</strong></span>
                      <span>Duration: <strong className="text-slate-800">{Math.floor(call.durationSeconds / 60)}m {call.durationSeconds % 60}s</strong></span>
                      <span>Time: <strong className="text-slate-500">{new Date(call.createdAt).toLocaleString('en-IN')}</strong></span>
                    </div>

                    {call.notes && (
                      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-100 rounded-lg p-2 mt-1">
                        💬 {call.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <a
                      href={`tel:${call.phoneNumber.replace(/\s+/g, '')}`}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>Call Back</span>
                    </a>

                    <button
                      onClick={() => handleDeleteCall(call.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* New Call Modal */}
      {isNewCallModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Log Call Interaction</h3>
            <p className="text-xs text-slate-500 mb-4">
              Record details from phone conversation with broker, driver, or shipper.
            </p>

            <form onSubmit={handleCreateCall} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Name & Business</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rameshwar Patil / Apex Roadways"
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={contactRole}
                    onChange={(e) => setContactRole(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="Broker">Broker</option>
                    <option value="Driver">Driver</option>
                    <option value="Shipper">Shipper</option>
                    <option value="Mandi Agent">Mandi Agent</option>
                    <option value="Pump Agent">Pump Agent</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98220 11223"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Lane / Topic Discussed</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nagpur ➔ Pune (23.5 MT Steel)"
                  value={laneDiscussed}
                  onChange={(e) => setLaneDiscussed(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Call Type</label>
                  <select
                    value={callType}
                    onChange={(e) => setCallType(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="OUTGOING">Outgoing</option>
                    <option value="INCOMING">Incoming</option>
                    <option value="MISSED">Missed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Deal Outcome</label>
                  <select
                    value={dealStatus}
                    onChange={(e) => setDealStatus(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white font-semibold"
                  >
                    <option value="RATE_CONFIRMED">Rate Confirmed</option>
                    <option value="RATE_TOO_LOW">Rate Too Low</option>
                    <option value="POD_FOLLOWUP">POD Follow-up</option>
                    <option value="EN_ROUTE">Vehicle En-Route</option>
                    <option value="NEGOTIATING">Negotiating</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call Notes & Terms Agreed</label>
                <textarea
                  rows={2}
                  placeholder="Agreed rate, loading time, pump advance details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewCallModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                >
                  Save Call Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
