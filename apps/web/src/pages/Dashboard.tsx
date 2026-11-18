import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  IndianRupee,
  Fuel,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileCheck2,
  Search,
  Scale,
  DollarSign,
  PhoneCall,
  CreditCard,
  Sparkles,
  Zap,
  Plus
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { OnboardingCard } from '../components/OnboardingCard';
import { formatINR, formatTonnes, formatDate } from '../utils/formatters';
import { api } from '../api/client';
import { useLanguage } from '../context/LanguageContext';
import { Trip, CorridorDetails, AxleConfiguration } from '../types';

export const Dashboard: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [corridors, setCorridors] = useState<CorridorDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [telematicsLog, setTelematicsLog] = useState<string | null>(null);

  // Weight-Bridge Anti-Overload Fine Shield state
  const [shieldAxle, setShieldAxle] = useState<AxleConfiguration>('12_WHEELER');
  const [shieldTareKg, setShieldTareKg] = useState<number>(11000);
  const [shieldLoadedPayloadKg, setShieldLoadedPayloadKg] = useState<number>(24000); // 24 MT payload

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // Load corridors
        const corRes = await api.get<{ success: boolean; data: CorridorDetails[] }>('/corridors');
        if (corRes.data) setCorridors(corRes.data);

        // Fetch vehicles
        const vehRes = await api.get<{ success: boolean; data: any[] }>('/vehicles').catch(() => null);
        if (vehRes?.data) setVehicles(vehRes.data);

        // Fetch live trips from backend (clean empty array if no trips)
        const tripsRes = await api.get<{ success: boolean; data: Trip[] }>('/trips').catch(() => null);
        if (tripsRes?.data) {
          setTrips(tripsRes.data);
        } else {
          setTrips([]);
        }
      } catch (err) {
        console.warn('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalGrossFreight = trips.reduce((sum, t) => sum + (t.grossFreightAmount || 0), 0);
  const totalAdvance = trips.reduce((sum, t) => sum + (t.advanceAmount || 0), 0);
  const totalPodBalance = trips.reduce((sum, t) => sum + (t.balancePodDue || 0), 0);

  const simulatePing = async () => {
    try {
      const samplePing = `$PKT,MIND,v2.1,NR,1,A,867530901234567,MH40AK1234,310.5,95.0,14,291026,143000,21.145800,N,79.088200,E,58.4,14250.8,0001,0000,165.4,0.0,Airtel`;
      const res = await api.post<{ success: boolean; data: any }>('/telematics/ping', {
        rawPacket: samplePing
      });
      if (res.success) {
        setTelematicsLog(
          `✓ Ping Ingested: IMEI 867530901234567 | Speed: 58.4 km/h | Fuel: 165.4L | Ignition: ON | GPS: Valid`
        );
      }
    } catch (e: any) {
      setTelematicsLog(`Ping error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* 3-Step Guided Onboarding Card for New Transporters */}
      <OnboardingCard
        vehicleCount={vehicles.length}
        tripCount={trips.length}
        onVehicleAdded={(newV) => setVehicles((prev) => [...prev, newV])}
      />

      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('cockpit')}
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time multi-axle freight economics, weighbridge overload guard, and RTO watchdogs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={simulatePing}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition cursor-pointer"
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            Simulate AIS-140 Ping
          </button>
        </div>
      </div>

      {telematicsLog && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-mono flex items-center justify-between">
          <span>{telematicsLog}</span>
          <button
            onClick={() => setTelematicsLog(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title={t('grossFreight')}
          value={formatINR(totalGrossFreight)}
          subtitle="Across active & cleared trips"
          icon={IndianRupee}
          variant="indigo"
          trend={totalGrossFreight > 0 ? { value: '+12.4% vs last week', isPositive: true } : undefined}
        />
        <StatCard
          title={t('advanceCollected')}
          value={formatINR(totalAdvance)}
          subtitle="Cash + Fuel Parchi slips at loading"
          icon={TrendingUp}
          variant="default"
        />
        <StatCard
          title={t('podBalanceDue')}
          value={formatINR(totalPodBalance)}
          subtitle="Pending delivery receipt clearance"
          icon={FileCheck2}
          variant="amber"
        />
        <StatCard
          title={t('liveFleet')}
          value={`${vehicles.length} Trucks`}
          subtitle="Benchmark: 3.0 km/L threshold"
          icon={Fuel}
          variant="emerald"
        />
      </div>

      {/* Super-App Transport Hub Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-5 text-white shadow-lg">
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              YatraLekha Super-App Hub · Quick Actions
            </span>
          </div>
          <span className="text-[11px] text-indigo-300">Fleet Operations Mode</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <button
            onClick={() => navigate('/loads')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-indigo-600 border border-slate-700/80 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 group-hover:text-white flex items-center justify-center mb-2">
              <Search className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Find Loads</div>
            <div className="text-[10px] text-slate-400 group-hover:text-indigo-200">Return backhauls</div>
          </button>

          <button
            onClick={() => navigate('/balance-sentinel')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-rose-600 border border-slate-700/80 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 group-hover:text-white flex items-center justify-center mb-2">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Balance Sentinel</div>
            <div className="text-[10px] text-slate-400 group-hover:text-rose-200">POD recovery notice</div>
          </button>

          <button
            onClick={() => navigate('/compliance')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-600 border border-slate-700/80 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 group-hover:text-white flex items-center justify-center mb-2">
              <FileCheck2 className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">VAHAN & DL Check</div>
            <div className="text-[10px] text-slate-400 group-hover:text-emerald-200">MoRTH registry</div>
          </button>

          <button
            onClick={() => navigate('/call-logs')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-purple-600 border border-slate-700/80 text-left transition-all group"
          >
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 group-hover:text-white flex items-center justify-center mb-2">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">In-App Call Logs</div>
            <div className="text-[10px] text-slate-400 group-hover:text-purple-200">Broker deal memory</div>
          </button>

          <button
            onClick={() => navigate('/visiting-card')}
            className="p-3 rounded-xl bg-slate-800/80 hover:bg-amber-600 border border-slate-700/80 text-left transition-all group col-span-2 sm:col-span-1"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 group-hover:text-white flex items-center justify-center mb-2">
              <CreditCard className="w-4 h-4" />
            </div>
            <div className="text-xs font-bold text-white">Visiting Card</div>
            <div className="text-[10px] text-slate-400 group-hover:text-amber-200">WhatsApp branded card</div>
          </button>
        </div>
      </div>

      {/* Weight-Bridge Anti-Overload Fine Shield (Section 194 MV Act) */}
      {(() => {
        const passingGvwKg = shieldAxle === '10_WHEELER' ? 28000 : shieldAxle === '12_WHEELER' ? 35000 : 47500;
        const legalMaxPayloadKg = passingGvwKg - shieldTareKg;
        const currentGrossKg = shieldTareKg + shieldLoadedPayloadKg;
        const excessKg = Math.max(0, currentGrossKg - passingGvwKg);
        const excessTonnes = Math.ceil(excessKg / 1000);
        const section194Fine = excessKg > 0 ? 20000 + excessTonnes * 2000 : 0;

        return (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-900">
                    Dharam Kanta Weighbridge & Section 194 MV Act Fine Shield
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Verify tare + loaded gross weight against statutory passing limits to prevent ₹20,000+ RTO weighbridge challans.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                excessKg > 0
                  ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-300'
              }`}>
                {excessKg > 0 ? `CRITICAL OVERLOAD: +${(excessKg / 1000).toFixed(1)} MT` : 'LEGAL & COMPLIANT'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Axle Class</label>
                <select
                  value={shieldAxle}
                  onChange={(e) => {
                    const ax = e.target.value as AxleConfiguration;
                    setShieldAxle(ax);
                    setShieldTareKg(ax === '10_WHEELER' ? 9000 : ax === '12_WHEELER' ? 11000 : 17500);
                    setShieldLoadedPayloadKg(ax === '10_WHEELER' ? 19000 : ax === '12_WHEELER' ? 24000 : 30000);
                  }}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl bg-white font-medium focus:outline-none focus:border-indigo-500"
                >
                  <option value="10_WHEELER">10-Wheeler (28,000 kg GVW)</option>
                  <option value="12_WHEELER">12-Wheeler (35,000 kg GVW)</option>
                  <option value="16_WHEELER">16-Wheeler (47,500 kg GVW)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dharam Kanta Unladen Tare (kg)
                </label>
                <input
                  type="number"
                  step="100"
                  value={shieldTareKg}
                  onChange={(e) => setShieldTareKg(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Loaded Cargo Weight (kg)
                </label>
                <input
                  type="number"
                  step="100"
                  value={shieldLoadedPayloadKg}
                  onChange={(e) => setShieldLoadedPayloadKg(Number(e.target.value))}
                  className="w-full text-xs p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            {/* Live Calculation Output Bar */}
            <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs ${
              excessKg > 0
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <div>
                <div className="font-bold text-sm">
                  Total Gross Weight: {currentGrossKg.toLocaleString('en-IN')} kg{' '}
                  <span className="font-normal text-xs">
                    (Legal Limit: {passingGvwKg.toLocaleString('en-IN')} kg)
                  </span>
                </div>
                <div className="text-[11px] mt-0.5">
                  Legal Payload Capacity: <strong>{(legalMaxPayloadKg / 1000).toFixed(1)} MT</strong> | Loaded:{' '}
                  <strong>{(shieldLoadedPayloadKg / 1000).toFixed(1)} MT</strong>
                </div>
              </div>

              <div className="text-right">
                {excessKg > 0 ? (
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 block">
                      Mandatory Section 194 MV Act Fine:
                    </span>
                    <span className="text-lg font-black text-rose-700">
                      ₹{section194Fine.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-rose-600 block">
                      (₹20,000 base + ₹2,000 x {excessTonnes} MT excess)
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Zero RTO Overload Risk (Safe Dispatch)</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Corridor Intelligence & Economics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {corridors.map((c, idx) => (
          <div
            key={c.corridorKey || `corridor-${idx}`}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:border-indigo-300 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  {c.corridorKey === 'NAGPUR_PUNE' ? 'Heavy-Haul Express Corridor' : 'Industrial Short Haul'}
                </span>
                <Badge variant={c.hasExpresswaySection ? 'emerald' : 'slate'} size="sm">
                  {c.hasExpresswaySection ? 'Samruddhi Mahamarg' : 'NH 53'}
                </Badge>
              </div>

              <h2 className="text-lg font-bold text-slate-900 mt-2">{c.name}</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  {c.origin} <span className="font-bold text-slate-700">↔</span> {c.destination}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mt-5 pt-4 border-t border-slate-100 text-center">
                <div>
                  <div className="text-xs text-slate-500">Distance</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{c.oneWayDistanceKm || 720} km</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Avg Transit</div>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">{c.estimatedTransitHours || 12} hrs</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Standard Rate</div>
                  <div className="text-sm font-bold text-indigo-700 mt-0.5">
                    ₹{c.recommendedRateRangePerMT?.min ?? 1000}–{c.recommendedRateRangePerMT?.max ?? 1200}/MT
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
              <span>
                Baseline Diesel @ 3.0 km/L:{' '}
                <strong className="text-slate-900">{Math.round((c.oneWayDistanceKm || 720) / 3)} L</strong>
              </span>
              <span>
                FASTag (12-W):{' '}
                <strong className="text-slate-900">₹{c.estimatedTollCost?.['12_WHEELER'] ?? 1850}</strong>
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Active Trips & Khata Clearance */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Active Corridor Trips & Khata Split</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Strict 70-80% loading advance vs 20-30% Proof-of-Delivery balance realization.
            </p>
          </div>
          <Badge variant="indigo">{trips.length} Trips Registered</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Trip Serial</th>
                <th className="py-3 px-4">Route & Corridor</th>
                <th className="py-3 px-4">Billed Weight</th>
                <th className="py-3 px-4">Gross Freight</th>
                <th className="py-3 px-4">Advance (75%)</th>
                <th className="py-3 px-4">POD Balance (25%)</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {trips.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <Truck className="w-8 h-8 mx-auto mb-2 text-slate-300 opacity-60" />
                    <p className="text-xs font-bold text-slate-700">Zero Active Trips in Workspace</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Ready to start? Use the quick fleet setup guide above or click Log Trip to record your first freight assignment.
                    </p>
                    <button
                      onClick={() => navigate('/trips')}
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Log First Trip
                    </button>
                  </td>
                </tr>
              ) : (
                trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {t.tripSerialNumber || (t as any).lrNumber || 'TRIP-2026-001'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{t.origin}</div>
                      <div className="text-[11px] text-slate-400">→ {t.destination}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatTonnes(t.billedWeightTonnes)}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {formatINR(t.grossFreightAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-700">
                      {formatINR(t.advanceAmount)}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-amber-700">
                      {formatINR(t.balancePodDue)}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.podClearanceStatus === 'VERIFIED' ? (
                        <Badge variant="emerald" size="sm">
                          POD Verified
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm">
                          POD Pending (Khata)
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
