import React, { useState } from 'react';
import {
  Fuel,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Gauge,
  Plus,
  Trash2,
  ShieldAlert,
  Flame
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { Badge } from '../components/Badge';
import { formatINR } from '../utils/formatters';
import { api } from '../api/client';

export const FuelAudit: React.FC = () => {
  // Tab state: 'AUDIT' | 'MULTI_PUMP' | 'SIPHON_CHECK'
  const [activeTab, setActiveTab] = useState<'AUDIT' | 'MULTI_PUMP' | 'SIPHON_CHECK'>('AUDIT');

  // Single Trip Audit State
  const [distanceKm, setDistanceKm] = useState(720);
  const [purchasedLitres, setPurchasedLitres] = useState(250);
  const [initialTank, setInitialTank] = useState(80);
  const [finalTank, setFinalTank] = useState(60);
  const [idleDrop, setIdleDrop] = useState(0);
  const [auditResult, setAuditResult] = useState<any | null>(null);

  // Multi-Pump Parchi State
  const [multiDistanceKm, setMultiDistanceKm] = useState(720);
  const [telematicsReported, setTelematicsReported] = useState(240);
  const [parchiSlips, setParchiSlips] = useState([
    {
      category: 'DIESEL',
      paymentSource: 'PUMP_CREDIT_PARCHI',
      amount: 11520,
      fuelLitres: 120,
      fuelRatePerLitre: 96,
      pumpStationName: 'BPCL Highway Oasis - Karanja Lad',
      pumpSlipNumber: 'PARCHI-10492'
    },
    {
      category: 'DIESEL',
      paymentSource: 'PUMP_CREDIT_PARCHI',
      amount: 11400,
      fuelLitres: 120,
      fuelRatePerLitre: 95,
      pumpStationName: 'IOCL Swagat - Jalna Bypass',
      pumpSlipNumber: 'PARCHI-8821'
    }
  ]);
  const [multiAuditResult, setMultiAuditResult] = useState<any | null>(null);

  // Siphoning Detector State
  const [prevFuel, setPrevFuel] = useState(180);
  const [currFuel, setCurrFuel] = useState(165);
  const [speed, setSpeed] = useState(0);
  const [timeDelta, setTimeDelta] = useState(180);
  const [siphonResult, setSiphonResult] = useState<any | null>(null);

  // Run Trip Audit
  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: any }>('/fuel-audit/trip-audit', {
        distanceRunKm: distanceKm,
        totalDieselLitresPurchased: purchasedLitres,
        initialTankLitres: initialTank,
        finalTankLitres: finalTank,
        unexplainedIdleDropLitres: idleDrop > 0 ? idleDrop : undefined
      });
      if (res.data) setAuditResult(res.data);
    } catch (e: any) {
      alert(`Audit error: ${e.message}`);
    }
  };

  // Run Multi-Pump Reconciliation
  const handleRunMultiPump = async () => {
    try {
      const res = await api.post<{ success: boolean; data: any }>(
        '/fuel-audit/multi-pump-reconcile',
        {
          distanceRunKm: multiDistanceKm,
          parchiExpenses: parchiSlips,
          telematicsReportedConsumptionLitres: telematicsReported
        }
      );
      if (res.data) setMultiAuditResult(res.data);
    } catch (e: any) {
      alert(`Multi-pump audit error: ${e.message}`);
    }
  };

  // Run Siphon Check
  const handleCheckSiphoning = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: any }>('/fuel-audit/siphon-check', {
        previousFuelLevel: prevFuel,
        currentFuelLevel: currFuel,
        isIgnitionOn: false,
        speedKmh: speed,
        timeDeltaSeconds: timeDelta
      });
      if (res.data) setSiphonResult(res.data);
    } catch (e: any) {
      alert(`Siphon check error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Fuel Theft & Mileage Variance Radar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Loaded consumption benchmark: exactly 3.0 km/L. Automatic theft triggers below 2.6 km/L or idle drops.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`pb-3 transition-colors ${
            activeTab === 'AUDIT'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Trip Mileage Audit (3.0 km/L Benchmark)
        </button>
        <button
          onClick={() => setActiveTab('MULTI_PUMP')}
          className={`pb-3 transition-colors ${
            activeTab === 'MULTI_PUMP'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Multi-Pump Parchi Reconciler
        </button>
        <button
          onClick={() => setActiveTab('SIPHON_CHECK')}
          className={`pb-3 transition-colors ${
            activeTab === 'SIPHON_CHECK'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          Stationary Siphoning Inspector
        </button>
      </div>

      {/* TAB 1: Single Trip Audit */}
      {activeTab === 'AUDIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
              Trip Mileage Parameters
            </h2>

            <form onSubmit={handleRunAudit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Corridor Distance Run (km)
                </label>
                <input
                  type="number"
                  value={distanceKm}
                  onChange={(e) => setDistanceKm(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Total Diesel Purchased (Litres)
                </label>
                <input
                  type="number"
                  value={purchasedLitres}
                  onChange={(e) => setPurchasedLitres(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Initial Tank (L)</label>
                  <input
                    type="number"
                    value={initialTank}
                    onChange={(e) => setInitialTank(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Final Tank (L)</label>
                  <input
                    type="number"
                    value={finalTank}
                    onChange={(e) => setFinalTank(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Unexplained Idle Drop (Litres, Optional)
                </label>
                <input
                  type="number"
                  value={idleDrop}
                  onChange={(e) => setIdleDrop(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
              >
                Evaluate Fuel Economy & Leakage
              </button>
            </form>
          </div>

          {/* Results View */}
          <div className="lg:col-span-2 space-y-5">
            {auditResult ? (
              <div className="space-y-4">
                <div
                  className={`p-5 rounded-xl border flex items-start gap-4 ${
                    auditResult.isVarianceAlertTriggered
                      ? 'bg-rose-50 border-rose-200 text-rose-900'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  }`}
                >
                  {auditResult.isVarianceAlertTriggered ? (
                    <Flame className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-bold text-sm">
                      {auditResult.isVarianceAlertTriggered
                        ? 'CRITICAL ALERT: POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK'
                        : 'COMPLIANT: Mileage Meets Benchmark Standard'}
                    </div>
                    <div className="text-xs mt-1 leading-relaxed opacity-90">
                      {auditResult.reconciliationNotes.join(' ')}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500">Calculated Mileage</span>
                    <div
                      className={`text-xl font-bold mt-1 ${
                        auditResult.calculatedKmpl < 2.6 ? 'text-rose-600' : 'text-slate-900'
                      }`}
                    >
                      {auditResult.calculatedKmpl} km/L
                    </div>
                    <span className="text-[11px] text-slate-400">Target: 3.00 km/L</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500">Total Fuel Consumed</span>
                    <div className="text-xl font-bold text-slate-900 mt-1">
                      {auditResult.fuelConsumedLitres} L
                    </div>
                    <span className="text-[11px] text-slate-400">Over {auditResult.distanceRunKm} km</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500">Variance vs Benchmark</span>
                    <div
                      className={`text-xl font-bold mt-1 ${
                        auditResult.varianceKmpl < 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {auditResult.varianceKmpl > 0 ? `+${auditResult.varianceKmpl}` : auditResult.varianceKmpl} km/L
                    </div>
                    <span className="text-[11px] text-slate-400">{auditResult.variancePercentage}% delta</span>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
                    <span className="text-xs text-slate-500">Excess Litres Burned</span>
                    <div
                      className={`text-xl font-bold mt-1 ${
                        auditResult.fuelDiscrepancyLitres > 0 ? 'text-rose-600' : 'text-emerald-600'
                      }`}
                    >
                      {auditResult.fuelDiscrepancyLitres} L
                    </div>
                    <span className="text-[11px] text-slate-400">
                      Lost value: ~{formatINR(Math.max(0, auditResult.fuelDiscrepancyLitres * 95))}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-slate-200 p-12 text-center text-slate-400">
                <Gauge className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-xs">Fill in trip distance and fuel purchased to compute variance.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Multi-Pump Parchi Reconciler */}
      {activeTab === 'MULTI_PUMP' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Corridor Highway Fuel Slips (Parchi Khata)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reconciles partner pump receipts (BPCL, HPCL, IOCL) with telematics consumption.
                </p>
              </div>
              <button
                onClick={handleRunMultiPump}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
              >
                Reconcile Parchi vs Telematics
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corridor Run Distance (km)
                </label>
                <input
                  type="number"
                  value={multiDistanceKm}
                  onChange={(e) => setMultiDistanceKm(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telematics Sensor Reported Consumption (Litres)
                </label>
                <input
                  type="number"
                  value={telematicsReported}
                  onChange={(e) => setTelematicsReported(Number(e.target.value))}
                  className="w-full text-xs font-bold border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>
            </div>

            {/* Parchi List */}
            <div className="space-y-3">
              {parchiSlips.map((p, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs grid grid-cols-5 gap-2 items-center"
                >
                  <div className="col-span-2">
                    <span className="font-bold text-slate-900">{p.pumpStationName}</span>
                    <div className="text-[11px] text-slate-400">Slip: {p.pumpSlipNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Volume</span>
                    <div className="font-bold text-slate-900">{p.fuelLitres} L</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Rate</span>
                    <div className="font-bold text-slate-900">₹{p.fuelRatePerLitre}/L</div>
                  </div>
                  <div className="text-right font-bold text-slate-900">
                    {formatINR(p.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {multiAuditResult && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                Reconciliation Findings
              </h3>
              <div className="grid grid-cols-4 gap-4 text-center text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Total Parchi Fuel</span>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    {multiAuditResult.totalParchiLitres} L
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Total Fuel Expense</span>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    {formatINR(multiAuditResult.totalParchiAmount)}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Avg Diesel Rate</span>
                  <div className="text-base font-bold text-slate-900 mt-1">
                    ₹{multiAuditResult.averageDieselRate}/L
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500">Actual Corridor Mileage</span>
                  <div className="text-base font-bold text-emerald-700 mt-1">
                    {multiAuditResult.calculatedKmpl} km/L
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: Stationary Siphoning Inspector */}
      {activeTab === 'SIPHON_CHECK' && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 max-w-xl">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              Stationary Tank Siphoning Inspector
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Identifies sudden fuel sensor drops when speed = 0 km/h (dhaba stops, midnight halts).
            </p>
          </div>

          <form onSubmit={handleCheckSiphoning} className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Start Fuel Level (Litres)
                </label>
                <input
                  type="number"
                  value={prevFuel}
                  onChange={(e) => setPrevFuel(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  End Fuel Level (Litres)
                </label>
                <input
                  type="number"
                  value={currFuel}
                  onChange={(e) => setCurrFuel(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Vehicle Speed (km/h)</label>
                <input
                  type="number"
                  value={speed}
                  onChange={(e) => setSpeed(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Elapsed Time (Seconds)
                </label>
                <input
                  type="number"
                  value={timeDelta}
                  onChange={(e) => setTimeDelta(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-lg p-2.5 bg-slate-50 font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Analyze Telemetry For Siphoning
            </button>
          </form>

          {siphonResult && (
            <div
              className={`p-4 rounded-xl border text-xs leading-relaxed ${
                siphonResult.isSiphoningSuspected
                  ? 'bg-rose-50 border-rose-200 text-rose-900 font-semibold'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}
            >
              {siphonResult.message}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
