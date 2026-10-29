import React, { useState, useEffect } from 'react';
import {
  Truck,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ArrowRight,
  TrendingUp,
  DollarSign,
  Scale,
  RefreshCw,
  Eye,
  FileCheck2
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatINR, formatTonnes, formatKg } from '../utils/formatters';
import { api } from '../api/client';
import { Trip, Vehicle, ExpenseCategory, PaymentSource } from '../types';

export const Trips: React.FC = () => {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [financeSummary, setFinanceSummary] = useState<any | null>(null);

  // New Trip Form State
  const [vehicleId, setVehicleId] = useState('');
  const [tripSerial, setTripSerial] = useState(`TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
  const [origin, setOrigin] = useState('Nagpur, Maharashtra');
  const [destination, setDestination] = useState('Pune, Maharashtra');
  const [corridorDistanceKm, setCorridorDistanceKm] = useState(720);
  const [billedWeightTonnes, setBilledWeightTonnes] = useState(24.0);
  const [rateType, setRateType] = useState<'PER_TONNE' | 'FIXED'>('PER_TONNE');
  const [freightRate, setFreightRate] = useState(1150);
  const [advancePercentage, setAdvancePercentage] = useState(0.75);

  // New Expense Form State
  const [expenseCategory, setExpenseCategory] = useState<ExpenseCategory>('DIESEL');
  const [paymentSource, setPaymentSource] = useState<PaymentSource>('PUMP_CREDIT_PARCHI');
  const [expenseAmount, setExpenseAmount] = useState(12000);
  const [fuelLitres, setFuelLitres] = useState(125);
  const [fuelRate, setFuelRate] = useState(96);
  const [pumpName, setPumpName] = useState('BPCL Highway Oasis - Karanja Lad');
  const [pumpSlipNo, setPumpSlipNo] = useState('PARCHI-9921');
  const [expenseMemo, setExpenseMemo] = useState('');

  // Load vehicles and trips
  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch vehicles
      const vehRes = await api.get<{ success: boolean; data: Vehicle[] }>(
        '/organizations/default/vehicles'
      ).catch(() => ({ data: [] }));

      let loadedVehicles = vehRes.data || [];
      if (loadedVehicles.length === 0) {
        // Create initial sample vehicles if empty
        const sample1 = await api.post<{ success: boolean; data: Vehicle }>('/vehicles', {
          organizationId: 'default-org',
          registrationNumber: 'MH 40 AK 9988',
          chassisNumber: 'MAT628400K12904',
          engineNumber: 'CUMMINS6BT9988',
          axleConfiguration: '12_WHEELER',
          monthlyEmi: 48000,
          crewMonthlyPayroll: 17000,
          annualInsuranceTax: 60000,
          currentDriverName: 'Sanjay Yadav'
        }).catch(() => null);

        const sample2 = await api.post<{ success: boolean; data: Vehicle }>('/vehicles', {
          organizationId: 'default-org',
          registrationNumber: 'MH 31 AP 4411',
          chassisNumber: 'MAT109288J99120',
          engineNumber: 'TATA697TC4411',
          axleConfiguration: '10_WHEELER',
          monthlyEmi: 38000,
          crewMonthlyPayroll: 17000,
          annualInsuranceTax: 50000,
          currentDriverName: 'Rameshwar Patil'
        }).catch(() => null);

        loadedVehicles = [sample1?.data, sample2?.data].filter(Boolean) as Vehicle[];
      }
      setVehicles(loadedVehicles);
      if (loadedVehicles.length > 0) {
        setVehicleId(loadedVehicles[0].id);
      }
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Selected vehicle legal specs for Dharam Kanta Weighbridge Check
  const selectedVehicleObj = vehicles.find((v) => v.id === vehicleId);
  const tareWeightKg = selectedVehicleObj?.tareWeightKg ?? 11000;
  const grossLimitKg = selectedVehicleObj?.grossVehicleWeightKg ?? 35000;
  const calculatedTotalGvwKg = billedWeightTonnes * 1000 + tareWeightKg;
  const isOverloadViolation = calculatedTotalGvwKg > grossLimitKg;
  const excessOverloadKg = isOverloadViolation ? calculatedTotalGvwKg - grossLimitKg : 0;

  // Real-time Billing Preview
  const grossFreightPreview =
    rateType === 'PER_TONNE' ? billedWeightTonnes * freightRate : freightRate;
  const advanceAmountPreview = Math.round(grossFreightPreview * advancePercentage * 100) / 100;
  const balancePodDuePreview = Math.round((grossFreightPreview - advanceAmountPreview) * 100) / 100;

  // Handle Trip Submit
  const handleCreateTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: { trip: Trip } }>('/trips', {
        organizationId: 'default-org',
        vehicleId,
        tripSerialNumber: tripSerial,
        origin,
        destination,
        corridorDistanceKm,
        billedWeightTonnes,
        rateType,
        freightRate,
        advancePercentage
      });

      if (res.data?.trip) {
        setTrips([res.data.trip, ...trips]);
        setIsModalOpen(false);
        setTripSerial(`TRIP-2026-${Math.floor(1000 + Math.random() * 9000)}`);
      }
    } catch (err: any) {
      alert(`Trip creation error: ${err.message}`);
    }
  };

  // Handle View Finance Summary
  const handleViewFinance = async (trip: Trip) => {
    setSelectedTrip(trip);
    try {
      const res = await api.get<{ success: boolean; data: any }>(`/trips/${trip.id}/finance`);
      if (res.data) {
        setFinanceSummary(res.data);
      }
    } catch (e: any) {
      alert(`Error fetching finance: ${e.message}`);
    }
  };

  // Handle Settle POD
  const handleSettlePod = async (tripId: string) => {
    if (!confirm('Confirm Proof-of-Delivery (POD) clearance and realize balance into Ledger?')) return;
    try {
      const res = await api.post<{ success: boolean; data: { trip: Trip } }>(
        `/trips/${tripId}/pod-settle`
      );
      if (res.data?.trip) {
        setTrips(trips.map((t) => (t.id === tripId ? res.data.trip : t)));
        if (selectedTrip?.id === tripId) {
          setSelectedTrip(res.data.trip);
        }
        alert('POD Verified successfully! Ledger journal updated.');
      }
    } catch (e: any) {
      alert(`Error settling POD: ${e.message}`);
    }
  };

  // Handle Add Expense
  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTrip) return;
    try {
      const res = await api.post<{ success: boolean; data: Trip }>(
        `/trips/${selectedTrip.id}/expenses`,
        {
          category: expenseCategory,
          paymentSource,
          amount: expenseAmount,
          fuelLitres: expenseCategory === 'DIESEL' ? fuelLitres : undefined,
          fuelRatePerLitre: expenseCategory === 'DIESEL' ? fuelRate : undefined,
          pumpStationName: pumpName,
          pumpSlipNumber: pumpSlipNo,
          memo: expenseMemo
        }
      );

      if (res.data) {
        setTrips(trips.map((t) => (t.id === selectedTrip.id ? res.data : t)));
        setSelectedTrip(res.data);
        setIsExpenseModalOpen(false);
        handleViewFinance(res.data);
      }
    } catch (e: any) {
      alert(`Expense error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Trip Management & Freight Khata
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Dharam Kanta legal weighbridge enforcement, split advance/POD khata, and expense contribution.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Dispatch New Trip
        </button>
      </div>

      {/* Trips Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            All Registered Heavy-Haul Trips
          </span>
          <Badge variant="indigo">{trips.length} Total Trips</Badge>
        </div>

        {trips.length === 0 ? (
          <div className="p-12 text-center">
            <Truck className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800">No Trips Recorded Yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Click "Dispatch New Trip" to record a freight consignment with Dharam Kanta legal weight check.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Trip Serial</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Billed Payload</th>
                  <th className="py-3 px-4">Gross Freight</th>
                  <th className="py-3 px-4">Advance (75%)</th>
                  <th className="py-3 px-4">POD Balance (25%)</th>
                  <th className="py-3 px-4">Overload Risk</th>
                  <th className="py-3 px-4">POD Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {trips.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {t.tripSerialNumber}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{t.origin}</div>
                      <div className="text-[11px] text-slate-400">→ {t.destination} ({t.corridorDistanceKm} km)</div>
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
                      {t.overloadRiskFlag ? (
                        <Badge variant="rose" size="sm">
                          Overloaded +{formatKg(t.overloadExcessKg)}
                        </Badge>
                      ) : (
                        <Badge variant="emerald" size="sm">
                          Legal Passed
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.podClearanceStatus === 'VERIFIED' ? (
                        <Badge variant="emerald" size="sm">
                          POD Realized
                        </Badge>
                      ) : (
                        <Badge variant="amber" size="sm">
                          Khata Pending
                        </Badge>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <button
                        onClick={() => handleViewFinance(t)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      >
                        <Eye className="w-3 h-3" />
                        Khata
                      </button>
                      {t.podClearanceStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => handleSettlePod(t.id)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 hover:bg-emerald-700 text-white transition"
                        >
                          <FileCheck2 className="w-3 h-3" />
                          Settle POD
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Trip Financial Contribution Drawer / View */}
      {selectedTrip && financeSummary && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                Trip Contribution Breakdown
              </span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">
                {selectedTrip.tripSerialNumber}: {selectedTrip.origin} → {selectedTrip.destination}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Expense / Parchi Slip
              </button>
              <button
                onClick={() => setSelectedTrip(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2 py-1"
              >
                Close ✕
              </button>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Gross Freight</span>
              <div className="text-lg font-bold text-slate-900 mt-1">
                {formatINR(financeSummary.grossFreightAmount)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Operating Expenses</span>
              <div className="text-lg font-bold text-rose-700 mt-1">
                {formatINR(financeSummary.contribution.expenseBreakdown.totalExpenses)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Net Contribution</span>
              <div
                className={`text-lg font-bold mt-1 ${
                  financeSummary.contribution.netContribution >= 0
                    ? 'text-emerald-700'
                    : 'text-rose-700'
                }`}
              >
                {formatINR(financeSummary.contribution.netContribution)}
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-xs text-slate-500 font-medium">Operating Margin</span>
              <div className="text-lg font-bold text-indigo-700 mt-1">
                {financeSummary.contribution.operatingMarginPercent}%
              </div>
            </div>
          </div>

          {/* Expenses Breakdown List */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              Itemized Trip Expenses (Kharcha)
            </h3>
            {selectedTrip.expenses.length === 0 ? (
              <p className="text-xs text-slate-400 italic">No expenses logged yet. Add diesel parchi, FASTag, or bhatta.</p>
            ) : (
              <div className="space-y-2">
                {selectedTrip.expenses.map((exp, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{exp.category}</span>
                      <span className="text-slate-500 ml-2">via {exp.paymentSource}</span>
                      {exp.fuelLitres && (
                        <span className="text-indigo-600 font-semibold ml-2">
                          ({exp.fuelLitres}L @ ₹{exp.fuelRatePerLitre}/L)
                        </span>
                      )}
                      {exp.pumpStationName && (
                        <span className="text-slate-400 ml-2">· {exp.pumpStationName}</span>
                      )}
                    </div>
                    <span className="font-bold text-slate-900">{formatINR(exp.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Trip Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Dispatch New Freight Consignment</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Legal RTO passing weight enforcement and khata advance split.
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrip} className="space-y-5">
              {/* Select Vehicle */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Select Fleet Asset (Truck)
                </label>
                <select
                  value={vehicleId}
                  onChange={(e) => setVehicleId(e.target.value)}
                  className="w-full text-xs font-medium border border-slate-200 rounded-lg px-3 py-2.5 bg-slate-50 focus:bg-white focus:outline-indigo-500"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} ({v.axleConfiguration.replace('_', ' ')}) — Tare:{' '}
                      {formatKg(v.tareWeightKg)} | GVW: {formatKg(v.grossVehicleWeightKg)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Corridor & Route */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Origin</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Destination</label>
                  <input
                    type="text"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Billed Weight & Dharam Kanta Enforcement */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Scale className="w-4 h-4 text-indigo-600" />
                    Dharam Kanta Weighbridge Verification
                  </span>
                  {isOverloadViolation ? (
                    <Badge variant="rose" size="sm">
                      OVERLOAD VIOLATION (+{formatKg(excessOverloadKg)})
                    </Badge>
                  ) : (
                    <Badge variant="emerald" size="sm">
                      COMPLIANT PASSING GVW
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div>
                    <span className="text-slate-500">Unladen Tare</span>
                    <div className="font-bold text-slate-800 mt-0.5">{formatKg(tareWeightKg)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Billed Payload</span>
                    <input
                      type="number"
                      step="0.1"
                      value={billedWeightTonnes}
                      onChange={(e) => setBilledWeightTonnes(Number(e.target.value))}
                      className="w-full text-center font-bold text-slate-900 border border-slate-300 rounded px-2 py-1 mt-0.5 bg-white"
                    />
                  </div>
                  <div>
                    <span className="text-slate-500">Total Gross GVW</span>
                    <div
                      className={`font-bold mt-0.5 ${
                        isOverloadViolation ? 'text-rose-600' : 'text-emerald-700'
                      }`}
                    >
                      {formatKg(calculatedTotalGvwKg)}
                    </div>
                  </div>
                </div>

                {isOverloadViolation && (
                  <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-[11px] leading-relaxed flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>
                      WARNING: Total GVW ({formatKg(calculatedTotalGvwKg)}) exceeds legal passing limit (
                      {formatKg(grossLimitKg)}) by {formatKg(excessOverloadKg)}. Risk of RTO challan.
                    </span>
                  </div>
                )}
              </div>

              {/* Rate & Split */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Rate Type</label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                  >
                    <option value="PER_TONNE">₹ Per MT</option>
                    <option value="FIXED">Fixed Lump Sum</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    {rateType === 'PER_TONNE' ? 'Rate (₹ / MT)' : 'Fixed Freight (₹)'}
                  </label>
                  <input
                    type="number"
                    value={freightRate}
                    onChange={(e) => setFreightRate(Number(e.target.value))}
                    className="w-full text-xs font-bold border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Advance Split</label>
                  <select
                    value={advancePercentage}
                    onChange={(e) => setAdvancePercentage(Number(e.target.value))}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:bg-white"
                  >
                    <option value="0.70">70% Advance / 30% POD</option>
                    <option value="0.75">75% Advance / 25% POD</option>
                    <option value="0.80">80% Advance / 20% POD</option>
                  </select>
                </div>
              </div>

              {/* Split Preview */}
              <div className="grid grid-cols-3 gap-3 p-3 bg-indigo-50/60 border border-indigo-100 rounded-lg text-center text-xs">
                <div>
                  <span className="text-indigo-600 font-medium">Gross Freight</span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatINR(grossFreightPreview)}
                  </div>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium">
                    Loading Advance ({Math.round(advancePercentage * 100)}%)
                  </span>
                  <div className="text-sm font-bold text-slate-900 mt-0.5">
                    {formatINR(advanceAmountPreview)}
                  </div>
                </div>
                <div>
                  <span className="text-indigo-600 font-medium">
                    POD Retained ({Math.round((1 - advancePercentage) * 100)}%)
                  </span>
                  <div className="text-sm font-bold text-amber-700 mt-0.5">
                    {formatINR(balancePodDuePreview)}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm"
                >
                  Confirm & Dispatch Trip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {isExpenseModalOpen && selectedTrip && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Record Trip Expense / Parchi Slip</h3>
              <button
                onClick={() => setIsExpenseModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expense Category</label>
                  <select
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="DIESEL">Diesel Fuel</option>
                    <option value="TOLL_FASTAG">FASTag Toll</option>
                    <option value="DRIVER_BHATTA">Driver Bhatta / Kharcha</option>
                    <option value="HAMALI">Hamali / Loading Unloading</option>
                    <option value="RTO_POLICE_CHIT">RTO / Police Chit</option>
                    <option value="MAINTENANCE">Tyre / Breakdown</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Payment Source</label>
                  <select
                    value={paymentSource}
                    onChange={(e) => setPaymentSource(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="PUMP_CREDIT_PARCHI">Pump Credit (Parchi)</option>
                    <option value="CASH">Cash / UPI</option>
                    <option value="FASTAG_WALLET">FASTag Wallet</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(Number(e.target.value))}
                  className="w-full font-bold border border-slate-200 rounded-lg p-2 bg-slate-50"
                />
              </div>

              {expenseCategory === 'DIESEL' && (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Fuel Litres</label>
                      <input
                        type="number"
                        value={fuelLitres}
                        onChange={(e) => setFuelLitres(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded p-1.5 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1">Rate (₹ / Litre)</label>
                      <input
                        type="number"
                        value={fuelRate}
                        onChange={(e) => setFuelRate(Number(e.target.value))}
                        className="w-full border border-slate-200 rounded p-1.5 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Pump Station Name</label>
                    <input
                      type="text"
                      value={pumpName}
                      onChange={(e) => setPumpName(e.target.value)}
                      className="w-full border border-slate-200 rounded p-1.5 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 mb-1">Slip / Parchi #</label>
                    <input
                      type="text"
                      value={pumpSlipNo}
                      onChange={(e) => setPumpSlipNo(e.target.value)}
                      className="w-full border border-slate-200 rounded p-1.5 bg-white"
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
