import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  Truck,
  ShieldCheck,
  Scale,
  Calendar,
  IndianRupee,
  User,
  Radio
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatINR, formatTonnes, formatKg } from '../utils/formatters';
import { api } from '../api/client';
import { Vehicle, AxleConfiguration } from '../types';

export const Vehicles: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Vehicle Form State
  const [regNo, setRegNo] = useState('MH 40 AK 1234');
  const [chassis, setChassis] = useState('MAT882910J1928');
  const [engine, setEngine] = useState('CUMMINS6BT882');
  const [axle, setAxle] = useState<AxleConfiguration>('12_WHEELER');
  const [emi, setEmi] = useState(48000);
  const [crewSalary, setCrewSalary] = useState(17000);
  const [insurance, setInsurance] = useState(60000);
  const [driverName, setDriverName] = useState('Sanjay Yadav');
  const [imei, setImei] = useState('867530901234567');

  const fetchVehicles = async () => {
    try {
      const res = await api.get<{ success: boolean; data: Vehicle[] }>('/vehicles').catch(() => null);
      if (res?.data && res.data.length > 0) {
        setVehicles(res.data);
      }
    } catch (e) {
      console.warn(e);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post<{ success: boolean; data: Vehicle }>('/vehicles', {
        organizationId: 'default-org',
        registrationNumber: regNo,
        chassisNumber: chassis,
        engineNumber: engine,
        axleConfiguration: axle,
        monthlyEmi: emi,
        crewMonthlyPayroll: crewSalary,
        annualInsuranceTax: insurance,
        ais140Imei: imei,
        currentDriverName: driverName
      });

      if (res.data) {
        setIsModalOpen(false);
        fetchVehicles();
      }
    } catch (e: any) {
      alert(`Vehicle registration error: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Fleet Assets & Legal Weight Limits
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standard legal payloads: 10-W (19.0 MT), 12-W (24.0 MT), 16-W (30.0 MT). Daily fixed burn amortization.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          Register Vehicle
        </button>
      </div>

      {/* Fleet Benchmark Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              10-Wheeler (6x2)
            </span>
            <Badge variant="indigo" size="sm">Rigid Haul</Badge>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900">28.0 MT Passing GVW</div>
            <div className="text-xs text-slate-500 mt-1">
              Tare: ~9.0 MT · <strong className="text-indigo-600">Max Legal: 19.0 MT</strong>
            </div>
            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Typical EMI: ₹38,000–₹48,000/mo
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              12-Wheeler (8x2)
            </span>
            <Badge variant="emerald" size="sm">Lift-Axle</Badge>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900">35.0 MT Passing GVW</div>
            <div className="text-xs text-slate-500 mt-1">
              Tare: ~11.0 MT · <strong className="text-emerald-700">Max Legal: 24.0 MT</strong>
            </div>
            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Typical EMI: ₹70,000–₹95,000/mo
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600">
              16-Wheeler (Multi-Axle)
            </span>
            <Badge variant="amber" size="sm">Twin-Steer</Badge>
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900">47.5 MT Passing GVW</div>
            <div className="text-xs text-slate-500 mt-1">
              Tare: ~17.5 MT · <strong className="text-amber-700">Max Legal: 30.0 MT</strong>
            </div>
            <div className="text-xs text-slate-400 mt-2 pt-2 border-t border-slate-100">
              Long-haul heavy industrial corridor
            </div>
          </div>
        </div>
      </div>

      {/* Vehicles Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Registered Fleet Assets ({vehicles.length})
          </span>
          <Badge variant="indigo">All Active</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Registration #</th>
                <th className="py-3 px-4">Axle Config</th>
                <th className="py-3 px-4">Passing GVW</th>
                <th className="py-3 px-4">Tare Weight</th>
                <th className="py-3 px-4">Legal Max Payload</th>
                <th className="py-3 px-4">Driver & Telematics</th>
                <th className="py-3 px-4">Monthly Fixed Burn</th>
                <th className="py-3 px-4 text-right">Per-Day Idle Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900 font-mono">
                    {v.registrationNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <Badge variant="slate" size="sm">
                      {v.axleConfiguration.replace('_', ' ')}
                    </Badge>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-900">
                    {formatKg(v.grossVehicleWeightKg)}
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{formatKg(v.tareWeightKg)}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700">
                    {formatTonnes(v.maxLegalPayloadKg / 1000)}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-900 flex items-center gap-1">
                      <User className="w-3 h-3 text-slate-400" />
                      {v.currentDriverName || 'Not Assigned'}
                    </div>
                    {v.ais140Imei && (
                      <div className="text-[11px] text-indigo-600 flex items-center gap-1 mt-0.5">
                        <Radio className="w-2.5 h-2.5" />
                        {v.ais140Imei}
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">
                      {formatINR(v.monthlyEmi + v.crewMonthlyPayroll + Math.round(v.annualInsuranceTax / 12))}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      EMI: {formatINR(v.monthlyEmi)} + Crew: {formatINR(v.crewMonthlyPayroll)}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="font-mono font-bold text-slate-900 text-sm">
                      {formatINR(v.dailyFixedBurnMetrics?.dailyFixedBurn || Math.round((v.monthlyEmi + 17000 + 5000) / 30))}
                    </span>
                    <div className="text-[10px] text-slate-400">Per day idle burn</div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register Heavy Commercial Truck</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Registration # (e.g. MH 40 AK 1234)
                  </label>
                  <input
                    type="text"
                    value={regNo}
                    onChange={(e) => setRegNo(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 font-mono font-bold uppercase bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Axle Configuration</label>
                  <select
                    value={axle}
                    onChange={(e) => setAxle(e.target.value as any)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  >
                    <option value="10_WHEELER">10-Wheeler (6x2: 28.0 MT GVW)</option>
                    <option value="12_WHEELER">12-Wheeler (8x2: 35.0 MT GVW)</option>
                    <option value="16_WHEELER">16-Wheeler (Multi-axle: 47.5 MT GVW)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Chassis Number</label>
                  <input
                    type="text"
                    value={chassis}
                    onChange={(e) => setChassis(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Engine Number</label>
                  <input
                    type="text"
                    value={engine}
                    onChange={(e) => setEngine(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly EMI (₹)</label>
                  <input
                    type="number"
                    value={emi}
                    onChange={(e) => setEmi(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Crew Payroll (₹)</label>
                  <input
                    type="number"
                    value={crewSalary}
                    onChange={(e) => setCrewSalary(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Annual Insurance (₹)</label>
                  <input
                    type="number"
                    value={insurance}
                    onChange={(e) => setInsurance(Number(e.target.value))}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Driver Name</label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">AIS-140 IMEI Tag</label>
                  <input
                    type="text"
                    value={imei}
                    onChange={(e) => setImei(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg p-2 bg-slate-50 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
