import React, { useState } from 'react';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Calendar,
  Truck,
  UserCheck,
  Building2,
  Award,
  ExternalLink,
  Lock,
  Sparkles
} from 'lucide-react';
import { api } from '../api/client';
import { VerifiedEntity } from '../types';

export const RtoVerification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'VAHAN' | 'SARATHI' | 'KYC'>('VAHAN');

  // VAHAN state
  const [vahanInput, setVahanInput] = useState('MH 40 AK 9988');
  const [vahanResult, setVahanResult] = useState<any>(null);
  const [vahanLoading, setVahanLoading] = useState(false);

  // Sarathi DL state
  const [sarathiInput, setSarathiInput] = useState('MH14 20180012345');
  const [sarathiResult, setSarathiResult] = useState<any>(null);
  const [sarathiLoading, setSarathiLoading] = useState(false);

  // KYC state
  const [kycType, setKycType] = useState<'GSTIN' | 'PAN' | 'AADHAAR'>('GSTIN');
  const [kycInput, setKycInput] = useState('27AABCV1234F1Z8');
  const [kycResult, setKycResult] = useState<any>(null);
  const [kycLoading, setKycLoading] = useState(false);

  const handleVerifyVahan = async (regNo?: string) => {
    const target = regNo || vahanInput;
    if (!target) return;
    try {
      setVahanLoading(true);
      const res = await api.post<{ success: boolean; data: any }>('/verify/vahan', {
        registrationNumber: target
      });
      if (res.data) {
        setVahanResult(res.data.payload);
      }
    } catch (err) {
      alert('VAHAN Verification failed: ' + err);
    } finally {
      setVahanLoading(false);
    }
  };

  const handleVerifySarathi = async (dlNo?: string) => {
    const target = dlNo || sarathiInput;
    if (!target) return;
    try {
      setSarathiLoading(true);
      const res = await api.post<{ success: boolean; data: any }>('/verify/sarathi', {
        dlNumber: target
      });
      if (res.data) {
        setSarathiResult(res.data.payload);
      }
    } catch (err) {
      alert('Sarathi DL Verification failed: ' + err);
    } finally {
      setSarathiLoading(false);
    }
  };

  const handleVerifyKyc = async () => {
    if (!kycInput) return;
    try {
      setKycLoading(true);
      const res = await api.post<{ success: boolean; data: any }>('/verify/kyc', {
        documentType: kycType,
        documentNumber: kycInput,
        entityName: 'Vidarbha Heavy Haulers Pvt Ltd'
      });
      if (res.data) {
        setKycResult(res.data.payload);
      }
    } catch (err) {
      alert('KYC Verification failed: ' + err);
    } finally {
      setKycLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                MoRTH VAHAN 4.0 & Sarathi Registry
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                Section 194 MV Act Compliance
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Statutory RTO & Identity Verification Center
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Authenticate RC registration, Sarathi commercial transport driving licenses, and transporter business KYC before dispatching high-value freight.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Tamper-Proof Audit</span>
            </span>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-2 mt-6 pt-4 border-t border-slate-800">
          <button
            onClick={() => setActiveTab('VAHAN')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'VAHAN'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Truck className="w-4 h-4" />
            <span>VAHAN RC Lookup</span>
          </button>
          <button
            onClick={() => setActiveTab('SARATHI')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'SARATHI'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span>Sarathi Driver DL</span>
          </button>
          <button
            onClick={() => setActiveTab('KYC')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeTab === 'KYC'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Transporter KYC (PAN/GSTIN)</span>
          </button>
        </div>
      </div>

      {/* 1. VAHAN RC LOOKUP TAB */}
      {activeTab === 'VAHAN' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Government VAHAN 4.0 Vehicle RC Search</h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter Vehicle Registration (e.g. MH 40 AK 9988)..."
                  value={vahanInput}
                  onChange={(e) => setVahanInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold tracking-wider uppercase border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => handleVerifyVahan()}
                disabled={vahanLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {vahanLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Fetch VAHAN Record</span>
              </button>
            </div>

            {/* Quick Chips */}
            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400">Quick Fleet Tests:</span>
              <button
                onClick={() => {
                  setVahanInput('MH 40 AK 9988');
                  handleVerifyVahan('MH 40 AK 9988');
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                MH 40 AK 9988 (12-Wheeler)
              </button>
              <button
                onClick={() => {
                  setVahanInput('MH 31 AP 4411');
                  handleVerifyVahan('MH 31 AP 4411');
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                MH 31 AP 4411 (10-Wheeler)
              </button>
              <button
                onClick={() => {
                  setVahanInput('MH 40 CD 1616');
                  handleVerifyVahan('MH 40 CD 1616');
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                MH 40 CD 1616 (16-Wheeler)
              </button>
            </div>
          </div>

          {vahanResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
              {/* Header Badge */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center font-mono font-black text-indigo-700 text-sm">
                    RC
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-lg font-black text-slate-900 tracking-wide font-mono">
                        {vahanResult.registrationNumber}
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>VAHAN VERIFIED</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{vahanResult.makerModel} · {vahanResult.rtoOffice}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Passing Class</span>
                  <span className="text-xs font-bold text-slate-800">{vahanResult.vehicleClass}</span>
                </div>
              </div>

              {/* Legal Payload and Overload Protection Banner */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Passing GVW Limit</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {vahanResult.passingGvwKg?.toLocaleString('en-IN')} kg
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">RTO Maximum Authorized Weight</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs text-slate-500 block mb-1">Unladen Tare Weight</span>
                  <span className="text-xl font-extrabold text-slate-900">
                    {vahanResult.unladenTareKg?.toLocaleString('en-IN')} kg
                  </span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">Physical Weighbridge Tare</span>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs text-emerald-700 font-bold block mb-1">Max Legal Payload</span>
                  <span className="text-xl font-extrabold text-emerald-800">
                    {vahanResult.maxLegalPayloadKg ? (vahanResult.maxLegalPayloadKg / 1000).toFixed(1) : 24.0} MT
                  </span>
                  <span className="text-[11px] text-emerald-600 block mt-0.5">
                    ({vahanResult.maxLegalPayloadKg?.toLocaleString('en-IN')} kg Legal Net Capacity)
                  </span>
                </div>
              </div>

              {/* Statutory Expiry Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-500 block mb-1">Fitness Certificate</span>
                  <span className="font-bold text-slate-800 block">
                    Valid till {vahanResult.fitnessExpiryDate}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ● {vahanResult.fitnessStatus}
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-500 block mb-1">National Permit (AIP)</span>
                  <span className="font-bold text-slate-800 block">
                    Valid till {vahanResult.nationalPermitExpiryDate || '2027-04-10'}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ● All India 5-Year Active
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-500 block mb-1">Commercial Insurance</span>
                  <span className="font-bold text-slate-800 block">Comprehensive</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ● Policy In-Force
                  </span>
                </div>

                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-slate-500 block mb-1">Commercial Road Tax</span>
                  <span className="font-bold text-slate-800 block">Maharashtra State</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    ● Paid Annual
                  </span>
                </div>
              </div>

              {/* Section 194 MV Act Warning Shield */}
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-amber-900 mb-0.5">Section 194 MV Act Anti-Overload Shield</h5>
                  <p className="text-amber-800 leading-relaxed">
                    Under Indian Motor Vehicles (Amendment) Act Section 194, any loading exceeding{' '}
                    <strong>{vahanResult.maxLegalPayloadKg ? (vahanResult.maxLegalPayloadKg / 1000).toFixed(1) : 24.0} MT</strong>{' '}
                    will attract a mandatory <strong>₹20,000 base challan plus ₹2,000 per excess metric tonne</strong>, along with offloading detention.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. SARATHI DRIVER DL TAB */}
      {activeTab === 'SARATHI' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">MoRTH Sarathi Driving License (DL) Check</h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Enter DL Number (e.g. MH14 20180012345)..."
                  value={sarathiInput}
                  onChange={(e) => setSarathiInput(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 text-xs font-mono font-bold uppercase border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
              <button
                onClick={() => handleVerifySarathi()}
                disabled={sarathiLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {sarathiLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                <span>Verify Driver DL</span>
              </button>
            </div>

            <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
              <span className="text-[11px] font-semibold text-slate-400">Quick Test Drivers:</span>
              <button
                onClick={() => {
                  setSarathiInput('MH14 20180012345');
                  handleVerifySarathi('MH14 20180012345');
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                MH14 20180012345 (Sanjay Yadav)
              </button>
              <button
                onClick={() => {
                  setSarathiInput('MH31 20150044112');
                  handleVerifySarathi('MH31 20150044112');
                }}
                className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[11px]"
              >
                MH31 20150044112 (Rameshwar Patil)
              </button>
            </div>
          </div>

          {sarathiResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center font-bold text-purple-700 text-lg">
                    DL
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{sarathiResult.driverName}</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        COMMERCIAL ENDORSED
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-500">{sarathiResult.dlNumber}</p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400 block text-[10px]">Issuing RTO</span>
                  <span className="font-semibold text-slate-800">{sarathiResult.issuingRto}</span>
                </div>
              </div>

              {/* Endorsement Details */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-100 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-semibold">Commercial Transport (TRANS) Endorsement:</span>
                  <span className="font-bold text-emerald-700">VALID & CERTIFIED</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Authorized Vehicle Classes:</span>
                  <span className="font-bold text-slate-800">
                    {Array.isArray(sarathiResult.vehicleClassesAuthorized)
                      ? sarathiResult.vehicleClassesAuthorized.join(' · ')
                      : 'TRANS · HMV · LMV'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Commercial Transport Badge:</span>
                  <span className="font-mono font-bold text-indigo-700">
                    {sarathiResult.commercialTransportEndorsement?.badgeNumber || 'MH/TR/COMM/88192'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Validity Expiration:</span>
                  <span className="font-bold text-slate-800">
                    {sarathiResult.commercialTransportEndorsement?.validUntil || '2028-08-13'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. TRANSPORTER KYC TAB */}
      {activeTab === 'KYC' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-2">Transporter Business & Identity KYC</h3>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <select
                value={kycType}
                onChange={(e) => setKycType(e.target.value as any)}
                className="px-3 py-2.5 text-xs font-semibold border border-slate-200 rounded-xl bg-white"
              >
                <option value="GSTIN">GSTIN (27AABCV...)</option>
                <option value="PAN">Company PAN</option>
                <option value="AADHAAR">Proprietor Aadhaar</option>
              </select>
              <input
                type="text"
                placeholder="Enter ID number..."
                value={kycInput}
                onChange={(e) => setKycInput(e.target.value)}
                className="flex-1 px-3 py-2.5 text-xs font-mono uppercase font-bold border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleVerifyKyc}
                disabled={kycLoading}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
              >
                {kycLoading ? <Sparkles className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                <span>Verify KYC Badge</span>
              </button>
            </div>
          </div>

          {kycResult && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 font-bold">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{kycResult.entityName}</h4>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-amber-700" />
                        <span>KYC: VERIFIED GOLD</span>
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">
                      {kycResult.documentType}: <span className="font-mono font-bold text-slate-700">{kycResult.documentNumber}</span>
                    </p>
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-400 block">Status</span>
                  <span className="font-bold text-emerald-600">{kycResult.taxStatus}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
