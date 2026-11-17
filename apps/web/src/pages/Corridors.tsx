import React, { useState } from 'react';
import {
  MapPin,
  TrendingDown,
  Navigation,
  Fuel,
  IndianRupee,
  ShieldCheck,
  Calculator
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatINR } from '../utils/formatters';
import { api } from '../api/client';

export const Corridors: React.FC = () => {
  // Backhaul Calculator State
  const [returnDiesel, setReturnDiesel] = useState(14500);
  const [returnTolls, setReturnTolls] = useState(3950);
  const [returnBhatta, setReturnBhatta] = useState(2000);
  const [dailyEmi, setDailyEmi] = useState(1600);
  const [returnPayload, setReturnPayload] = useState(24.0);
  const [breakEvenResult, setBreakEvenResult] = useState<any | null>(null);

  const calculateBreakEven = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: any }>('/trips/backhaul-breakeven', {
        projectedReturnDieselCost: returnDiesel,
        projectedTollsCost: returnTolls,
        driverBhattaCost: returnBhatta,
        dailyAllocatedEmi: dailyEmi,
        ratedReturnPayloadTonnes: returnPayload
      });
      if (res.data) setBreakEvenResult(res.data);
    } catch (e: any) {
      alert(`Calculation error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Corridor Economics & Backhaul Break-Even
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Operational corridors: Nagpur ↔ Pune (Samruddhi Mahamarg) and Nagpur ↔ Bhandara (NH 53).
        </p>
      </div>

      {/* Corridor Profiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nagpur - Pune */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Long Haul Express
            </span>
            <Badge variant="emerald">Samruddhi Mahamarg</Badge>
          </div>

          <h2 className="text-lg font-bold text-slate-900">Nagpur ↔ Pune (~720 km)</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Major Maharashtra industrial corridor connecting Vidarbha logistics hubs with Pune auto manufacturing clusters (Chakan/Talegaon).
          </p>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-center text-xs">
            <div>
              <span className="text-slate-400">Distance</span>
              <div className="font-bold text-slate-900 mt-0.5">720 km</div>
            </div>
            <div>
              <span className="text-slate-400">Avg Transit</span>
              <div className="font-bold text-slate-900 mt-0.5">14–16 hrs</div>
            </div>
            <div>
              <span className="text-slate-400">Freight Rate</span>
              <div className="font-bold text-indigo-700 mt-0.5">₹1,000–₹1,200/MT</div>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Baseline Diesel @ 3.0 km/L:</span>
              <strong className="text-slate-900">240 Litres (~₹23,000)</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FASTag Toll (10-Wheeler):</span>
              <strong className="text-slate-900">₹3,450</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FASTag Toll (12-Wheeler):</span>
              <strong className="text-slate-900">₹3,950</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FASTag Toll (16-Wheeler):</span>
              <strong className="text-slate-900">₹4,600</strong>
            </div>
          </div>
        </div>

        {/* Nagpur - Bhandara */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              Short Haul Industrial
            </span>
            <Badge variant="slate">NH 53 (AH 46)</Badge>
          </div>

          <h2 className="text-lg font-bold text-slate-900">Nagpur ↔ Bhandara (~65 km)</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            High-turnaround mineral & alloy freight corridor serving ferro-alloy plants, rice mills, and sponge iron units.
          </p>

          <div className="grid grid-cols-3 gap-3 p-3 bg-slate-50 rounded-lg text-center text-xs">
            <div>
              <span className="text-slate-400">Distance</span>
              <div className="font-bold text-slate-900 mt-0.5">65 km</div>
            </div>
            <div>
              <span className="text-slate-400">Avg Transit</span>
              <div className="font-bold text-slate-900 mt-0.5">1.5–2 hrs</div>
            </div>
            <div>
              <span className="text-slate-400">Freight Rate</span>
              <div className="font-bold text-indigo-700 mt-0.5">₹200–₹250/MT</div>
            </div>
          </div>

          <div className="space-y-2 text-xs border-t border-slate-100 pt-3">
            <div className="flex justify-between text-slate-600">
              <span>Baseline Diesel @ 3.0 km/L:</span>
              <strong className="text-slate-900">~22 Litres (~₹2,100)</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FASTag Toll (Mathani Plaza 10-W):</span>
              <strong className="text-slate-900">₹220</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>FASTag Toll (Mathani Plaza 12-W):</span>
              <strong className="text-slate-900">₹260</strong>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Round-Trip Contract Rate:</span>
              <strong className="text-slate-900">₹5,000–₹6,000 lump sum</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Return Load (Backhaul) Break-Even Calculator */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-bold text-slate-900">
            Return Load (Backhaul) Break-Even Pricing Engine
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Determines the lowest viable freight rate to accept on return trips (e.g. Pune → Nagpur) to avoid loss after covering return diesel, tolls, driver allowance, and daily capital EMI.
        </p>

        <form onSubmit={calculateBreakEven} className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Return Diesel (₹)</label>
            <input
              type="number"
              value={returnDiesel}
              onChange={(e) => setReturnDiesel(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Return Tolls (₹)</label>
            <input
              type="number"
              value={returnTolls}
              onChange={(e) => setReturnTolls(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Driver Bhatta (₹)</label>
            <input
              type="number"
              value={returnBhatta}
              onChange={(e) => setReturnBhatta(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Daily Allocated EMI (₹)</label>
            <input
              type="number"
              value={dailyEmi}
              onChange={(e) => setDailyEmi(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Return Payload (MT)</label>
            <input
              type="number"
              value={returnPayload}
              onChange={(e) => setReturnPayload(Number(e.target.value))}
              className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
            />
          </div>

          <div className="md:col-span-5 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
            >
              Calculate Minimum Acceptable Rate
            </button>
          </div>
        </form>

        {breakEvenResult && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-100 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <span className="text-xs text-indigo-600 font-medium">Total Return Operating Cost</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatINR(breakEvenResult.totalDirectReturnCost)}
              </div>
            </div>
            <div>
              <span className="text-xs text-indigo-600 font-medium">Min Rate Per Tonne</span>
              <div className="text-xl font-bold text-indigo-700 mt-1">
                ₹{breakEvenResult.minAcceptableFreightRatePerTonne} / MT
              </div>
            </div>
            <div>
              <span className="text-xs text-indigo-600 font-medium">Min Fixed Lump Sum</span>
              <div className="text-xl font-bold text-slate-900 mt-1">
                {formatINR(breakEvenResult.minAcceptableLumpSum)}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
