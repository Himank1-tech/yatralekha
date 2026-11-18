import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Plus,
  Truck,
  PhoneCall,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  MapPin,
  TrendingUp,
  ShieldCheck,
  Building,
  ArrowRight,
  Clock,
  Sparkles,
  Sliders,
  DollarSign
} from 'lucide-react';
import { api } from '../api/client';
import { FreightLoad, PreferredLane, AxleConfiguration, BodyType } from '../types';

export const FreightBoard: React.FC = () => {
  const [loads, setLoads] = useState<FreightLoad[]>([]);
  const [preferredLanes, setPreferredLanes] = useState<PreferredLane[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOrigin, setSearchOrigin] = useState('');
  const [searchDestination, setSearchDestination] = useState('');
  const [selectedAxle, setSelectedAxle] = useState<string>('ALL');
  const [selectedBody, setSelectedBody] = useState<string>('ALL');
  const [bookingSuccessId, setBookingSuccessId] = useState<string | null>(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isLanesModalOpen, setIsLanesModalOpen] = useState(false);

  // New Load form state
  const [newOrigin, setNewOrigin] = useState('');
  const [newDestination, setNewDestination] = useState('');
  const [newMaterial, setNewMaterial] = useState('');
  const [newWeight, setNewWeight] = useState('22.0');
  const [newAxle, setNewAxle] = useState<AxleConfiguration | 'TRAILER'>('12_WHEELER');
  const [newBody, setNewBody] = useState<BodyType>('DALA');
  const [newRate, setNewRate] = useState('1150');
  const [newShipper, setNewShipper] = useState('');
  const [newPhone, setNewPhone] = useState('');

  const fetchLoads = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await api.get<{ success: boolean; data: FreightLoad[] }>('/loads');
      if (res.data) {
        setLoads(res.data);
      }
      const lanesRes = await api.get<{ success: boolean; data: PreferredLane[] }>('/preferred-lanes');
      if (lanesRes.data) {
        setPreferredLanes(lanesRes.data);
      }
    } catch (err) {
      if (!silent) console.error('Failed to load freight board:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoads(false);

    // 1. Server-Sent Events (SSE) Real-Time Live Load Board
    let eventSource: EventSource | null = null;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'https://yatralekha-api.onrender.com';
      const streamUrl = `${API_URL}/api/v1/loads/stream`;
      eventSource = new EventSource(streamUrl);

      eventSource.addEventListener('snapshot', (e: MessageEvent) => {
        try {
          const snapshotLoads = JSON.parse(e.data);
          if (Array.isArray(snapshotLoads)) {
            setLoads(snapshotLoads);
          }
        } catch (err) {
          console.warn('SSE snapshot parse notice:', err);
        }
      });

      eventSource.addEventListener('load_created', (e: MessageEvent) => {
        try {
          const newLoad: FreightLoad = JSON.parse(e.data);
          setLoads((prev) => {
            if (prev.some((l) => l.id === newLoad.id)) return prev;
            return [newLoad, ...prev];
          });
        } catch (err) {
          console.warn('SSE load_created parse notice:', err);
        }
      });

      eventSource.addEventListener('load_booked', (e: MessageEvent) => {
        try {
          const bookedLoad: FreightLoad = JSON.parse(e.data);
          setLoads((prev) =>
            prev.map((l) => (l.id === bookedLoad.id ? { ...l, status: bookedLoad.status || 'BOOKED' } : l))
          );
        } catch (err) {
          console.warn('SSE load_booked parse notice:', err);
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
      };
    } catch (err) {
      console.warn('EventSource connection notice:', err);
    }

    // 2. 10s Fallback Polling
    const pollInterval = setInterval(() => {
      fetchLoads(true);
    }, 10000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(pollInterval);
    };
  }, []);

  const handleBook = async (loadId: string) => {
    try {
      await api.post(`/loads/${loadId}/book`);
      setLoads((prev) =>
        prev.map((l) => (l.id === loadId ? { ...l, status: 'BOOKED' } : l))
      );
      setBookingSuccessId(loadId);
      setTimeout(() => setBookingSuccessId(null), 4000);
    } catch (err) {
      alert('Could not book load: ' + err);
    }
  };

  const handleCall = async (load: FreightLoad) => {
    // Log to call records
    try {
      await api.post('/call-logs', {
        contactName: load.shipperName,
        contactRole: 'Broker',
        phoneNumber: load.shipperPhone,
        laneDiscussed: `${load.origin} ➔ ${load.destination} (${load.weightTonnes} MT)`,
        callType: 'OUTGOING',
        durationSeconds: 45,
        dealStatus: 'NEGOTIATING',
        notes: `Inquired on ${load.materialType} at offered rate ₹${load.offeredRate}/MT.`
      });
    } catch (e) {
      console.warn('Call log failed:', e);
    }
    window.open(`tel:${load.shipperPhone.replace(/\s+/g, '')}`);
  };

  const handleWhatsApp = (load: FreightLoad) => {
    const totalFreight = Math.round(load.weightTonnes * load.offeredRate);
    const advanceVal = Math.round(totalFreight * (load.advancePercent / 100));
    const balanceVal = totalFreight - advanceVal;

    const message = `*INQUIRY FROM PATIL TRANSPORT / VIDARBHA HEAVY HAULERS*\n\n` +
      `Namaste *${load.shipperName}*,\n` +
      `We have vehicles ready for your load:\n` +
      `• *Route:* ${load.origin} ➔ ${load.destination}\n` +
      `• *Corridor:* ${load.corridorName}\n` +
      `• *Material:* ${load.materialType} (${load.weightTonnes} MT)\n` +
      `• *Offered Rate:* ₹${load.offeredRate}/MT (Total: ₹${totalFreight.toLocaleString('en-IN')})\n` +
      `• *Advance Required:* ${load.advancePercent}% (₹${advanceVal.toLocaleString('en-IN')}) via Diesel Slip / Bank IMPS\n` +
      `• *Balance POD:* ₹${balanceVal.toLocaleString('en-IN')} (${load.balancePaymentTerms})\n\n` +
      `Our 10/12/16-Wheeler fleet has valid All-India Permits & AIS-140 GPS. Please confirm bilty dispatch details!`;

    const cleanPhone = load.shipperPhone.replace(/[^0-9]/g, '');
    const phoneWithCountry = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleCreateLoad = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: FreightLoad }>('/loads', {
        origin: newOrigin,
        destination: newDestination,
        corridorName: `${newOrigin} ➔ ${newDestination}`,
        materialType: newMaterial,
        weightTonnes: Number(newWeight),
        requiredAxleType: newAxle,
        bodyType: newBody,
        offeredRate: Number(newRate),
        rateType: 'PER_TONNE',
        advancePercent: 75.0,
        balancePaymentTerms: 'Balance on POD in 3 days',
        shipperName: newShipper || 'Vidarbha Transporter Network',
        shipperPhone: newPhone || '+91 98220 11223',
        isVerifiedShipper: true
      });
      if (res.data) {
        setLoads((prev) => [res.data, ...prev]);
        setIsPostModalOpen(false);
        setNewOrigin('');
        setNewDestination('');
        setNewMaterial('');
      }
    } catch (err) {
      alert('Error creating load: ' + err);
    }
  };

  // Filter loads
  const filteredLoads = loads.filter((l) => {
    if (searchOrigin && !l.origin.toLowerCase().includes(searchOrigin.toLowerCase())) return false;
    if (searchDestination && !l.destination.toLowerCase().includes(searchDestination.toLowerCase())) return false;
    if (selectedAxle !== 'ALL' && l.requiredAxleType !== selectedAxle) return false;
    if (selectedBody !== 'ALL' && l.bodyType !== selectedBody) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner / Heading */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-indigo-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                TrucksUp & BlackBuck Super-Exchange Mode
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                Live 🟢
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Freight Load Board & Backhaul Radar
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Zero-deadhead return loads across Samruddhi Mahamarg, NH 53, and Chakan-Bhiwandi industrial freight lanes. Guaranteed 75% loading advance terms.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsLanesModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700 hover:border-indigo-500/50 text-slate-200 text-xs font-bold flex items-center gap-2 transition-colors"
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Preferred Lanes ({preferredLanes.length})</span>
            </button>
            <button
              onClick={() => setIsPostModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Post New Load</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preferred Corridors Quick Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>High-Demand Corridor Benchmarks</span>
          </span>
          <span className="text-xs text-slate-500">Auto-matching backhaul alerts</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {preferredLanes.map((lane) => (
            <div
              key={lane.id}
              className="p-3 rounded-lg bg-slate-50 border border-slate-200 hover:border-indigo-300 transition-colors flex items-center justify-between"
            >
              <div>
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  <span>{lane.origin}</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{lane.destination}</span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{lane.corridor}</div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold text-indigo-600">₹{lane.recommendedRatePerTon}/MT</div>
                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Loads Ready
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Origin City (e.g. Nagpur, Bhandara)..."
              value={searchOrigin}
              onChange={(e) => setSearchOrigin(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="relative">
            <MapPin className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Destination (e.g. Pune, Bhiwandi)..."
              value={searchDestination}
              onChange={(e) => setSearchDestination(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <select
              value={selectedAxle}
              onChange={(e) => setSelectedAxle(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Axles (10W, 12W, 16W, Trailer)</option>
              <option value="10_WHEELER">10-Wheeler (19T Payload)</option>
              <option value="12_WHEELER">12-Wheeler (24T Payload)</option>
              <option value="16_WHEELER">16-Wheeler (30T Payload)</option>
              <option value="TRAILER">Multi-Axle Trailer</option>
            </select>
          </div>
          <div>
            <select
              value={selectedBody}
              onChange={(e) => setSelectedBody(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500 bg-white"
            >
              <option value="ALL">All Body Types</option>
              <option value="DALA">Open Dala (Standard)</option>
              <option value="CONTAINER">Container (Dry Box)</option>
              <option value="FLATBED">Flatbed (Coils & Machinery)</option>
              <option value="TANKER">Liquid Tanker</option>
            </select>
          </div>
        </div>
      </div>

      {/* Booking confirmation alert */}
      {bookingSuccessId && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Load booked successfully! Loading slip and bilty agreement reserved.</span>
          </div>
        </div>
      )}

      {/* Load Cards Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          Loading available highway loads...
        </div>
      ) : filteredLoads.length === 0 ? (
        <div className="py-12 text-center bg-white rounded-xl border border-slate-200 p-8">
          <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching freight loads found</h3>
          <p className="text-xs text-slate-500 mt-1">Try resetting your origin, destination or axle filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoads.map((load) => {
            const isBooked = load.status === 'BOOKED';
            const totalFreightVal = Math.round(load.weightTonnes * load.offeredRate);
            const advanceVal = Math.round(totalFreightVal * (load.advancePercent / 100));
            const balanceVal = totalFreightVal - advanceVal;

            return (
              <div
                key={load.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs transition-all relative overflow-hidden flex flex-col justify-between ${
                  isBooked ? 'border-slate-300 opacity-75' : 'border-slate-200 hover:border-indigo-300 hover:shadow-md'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      <span>{load.requiredAxleType.replace('_', ' ')} · {load.bodyType}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {load.isVerifiedShipper && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                          <span>Verified Shipper</span>
                        </span>
                      )}
                      {isBooked ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                          BOOKED
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          AVAILABLE
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Route */}
                  <div className="mb-3">
                    <div className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                      <span>{load.origin}</span>
                      <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                      <span>{load.destination}</span>
                    </div>
                    <div className="text-xs text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                      <span>🛣️ {load.corridorName}</span>
                    </div>
                  </div>

                  {/* Weight & Material Match */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 mb-3 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Consignment:</span>
                      <span className="font-bold text-slate-800">{load.materialType}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Weight & Passing:</span>
                      <span className="font-bold text-emerald-700">
                        {load.weightTonnes} Tonnes (Legal for {load.requiredAxleType.replace('_', ' ')})
                      </span>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200/60 pt-1.5">
                      <span className="text-slate-500">Shipper / Agency:</span>
                      <span className="font-semibold text-slate-700">{load.shipperName}</span>
                    </div>
                  </div>

                  {/* Financial Terms */}
                  <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-3 mb-4 space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">Freight Rate:</span>
                      <span className="text-base font-extrabold text-indigo-900">
                        ₹{load.offeredRate.toLocaleString('en-IN')}/MT
                        <span className="text-xs text-slate-500 font-normal ml-1">
                          (₹{totalFreightVal.toLocaleString('en-IN')})
                        </span>
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 flex items-center justify-between pt-1 border-t border-indigo-100">
                      <span>Advance: <strong className="text-slate-800">{load.advancePercent}% (₹{advanceVal.toLocaleString('en-IN')})</strong></span>
                      <span>Balance: <strong className="text-amber-800">₹{balanceVal.toLocaleString('en-IN')}</strong></span>
                    </div>
                    <div className="text-[10px] text-indigo-700 font-medium">
                      Terms: {load.balancePaymentTerms}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => handleCall(load)}
                    className="py-2 px-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <PhoneCall className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Call</span>
                  </button>

                  <button
                    onClick={() => handleWhatsApp(load)}
                    className="py-2 px-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                    <span>WhatsApp</span>
                  </button>

                  <button
                    onClick={() => handleBook(load.id)}
                    disabled={isBooked}
                    className={`py-2 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
                      isBooked
                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isBooked ? 'Locked' : 'Book Load'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Post Load Modal */}
      {isPostModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Post a Freight Load</h3>
            <p className="text-xs text-slate-500 mb-4">
              Add freight requirements to match returning empty haulers across Maharashtra corridors.
            </p>

            <form onSubmit={handleCreateLoad} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Origin City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nagpur (MIHAN)"
                    value={newOrigin}
                    onChange={(e) => setNewOrigin(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Destination City</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Pune (Chakan)"
                    value={newDestination}
                    onChange={(e) => setNewDestination(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Material / Cargo Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Steel Rebars / Auto Stampings / Cotton Bales"
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Weight (Tonnes)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newWeight}
                    onChange={(e) => setNewWeight(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Offered Rate (₹ / MT)</label>
                  <input
                    type="number"
                    required
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Required Axle Type</label>
                  <select
                    value={newAxle}
                    onChange={(e) => setNewAxle(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="10_WHEELER">10-Wheeler (19T Payload)</option>
                    <option value="12_WHEELER">12-Wheeler (24T Payload)</option>
                    <option value="16_WHEELER">16-Wheeler (30T Payload)</option>
                    <option value="TRAILER">Trailer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Body Type</label>
                  <select
                    value={newBody}
                    onChange={(e) => setNewBody(e.target.value as any)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg bg-white"
                  >
                    <option value="DALA">Open Dala</option>
                    <option value="CONTAINER">Container Box</option>
                    <option value="FLATBED">Flatbed</option>
                    <option value="TANKER">Tanker</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shipper / Broker Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ritco Logistics"
                    value={newShipper}
                    onChange={(e) => setNewShipper(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 98221 44550"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPostModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
                >
                  Publish Load
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preferred Lanes Configurator Modal */}
      {isLanesModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-slate-900 mb-1">Configure Preferred Lanes</h3>
            <p className="text-xs text-slate-500 mb-4">
              Transporters designate their regular corridors to receive instant push alerts when matching backhauls drop.
            </p>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {preferredLanes.map((lane, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-800">{lane.origin} ➔ {lane.destination}</div>
                    <div className="text-[11px] text-slate-500">{lane.corridor}</div>
                  </div>
                  <span className="font-bold text-indigo-600">₹{lane.recommendedRatePerTon}/MT</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsLanesModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
