import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Lock, ArrowRight, CheckCircle2, Plus, X, Sparkles, ShieldCheck, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../api/client';
import { AxleConfiguration } from '../types';

interface OnboardingCardProps {
  vehicleCount: number;
  tripCount: number;
  onVehicleAdded: (vehicle: any) => void;
}

export const OnboardingCard: React.FC<OnboardingCardProps> = ({
  vehicleCount,
  tripCount,
  onVehicleAdded
}) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem('yatralekha_dismiss_onboarding') === 'true';
  });

  // Modal / Form state for Step 1: Quick Add Truck
  const [showAddTruckModal, setShowAddTruckModal] = useState(false);
  const [regNo, setRegNo] = useState('');
  const [axle, setAxle] = useState<AxleConfiguration>('12_WHEELER');
  const [submittingTruck, setSubmittingTruck] = useState(false);

  // Form state for Step 2: Confirm Vault PIN
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('8821');
  const [pinConfirmed, setPinConfirmed] = useState(() => {
    return localStorage.getItem('yatralekha_vault_pin_set') === 'true';
  });

  if (isDismissed) return null;

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('yatralekha_dismiss_onboarding', 'true');
  };

  const handleQuickAddTruck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regNo.trim()) return;

    setSubmittingTruck(true);
    try {
      const tare = axle === '10_WHEELER' ? 9000 : axle === '12_WHEELER' ? 11000 : 17500;
      const gvw = axle === '10_WHEELER' ? 28000 : axle === '12_WHEELER' ? 36000 : 47500;

      const res = await api.post<{ success: boolean; data: any }>('/vehicles', {
        registrationNumber: regNo.toUpperCase().trim(),
        axleConfiguration: axle,
        tareWeightKg: tare,
        grossVehicleWeightKg: gvw,
        monthlyEmi: axle === '10_WHEELER' ? 38000 : axle === '12_WHEELER' ? 48000 : 75000,
        annualInsuranceTax: 60000,
        currentDriverName: 'Assigned Fleet Driver',
        currentDriverPhone: '+91 98220 00000'
      });

      if (res && res.data) {
        onVehicleAdded(res.data);
      }
      setShowAddTruckModal(false);
      setRegNo('');
    } catch (err) {
      console.warn('Quick add truck error:', err);
    } finally {
      setSubmittingTruck(false);
    }
  };

  const handleConfirmPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 4) {
      setPinConfirmed(true);
      localStorage.setItem('yatralekha_vault_pin_set', 'true');
      localStorage.setItem('yatralekha_vault_pin', pin);
      setShowPinModal(false);
    }
  };

  const step1Complete = vehicleCount > 0;
  const step2Complete = pinConfirmed;
  const step3Complete = tripCount > 0;

  return (
    <div className="mb-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 p-5 text-white shadow-xl relative overflow-hidden">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-start justify-between relative z-10 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black tracking-tight text-white">
                {t('onboardingTitle')}
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                New Fleet
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
              {t('onboardingSubtitle')}
            </p>
          </div>
        </div>

        <button
          onClick={handleDismiss}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/60 transition-colors cursor-pointer"
          title={t('dismiss')}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 3 Interactive Step Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 relative z-10">
        {/* Step 1: Add First Truck */}
        <div className={`p-4 rounded-xl border transition-all ${
          step1Complete 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' 
            : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5 text-white">
              <Truck className="w-4 h-4 text-indigo-400" />
              {t('step1Title')}
            </span>
            {step1Complete ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Done ({vehicleCount})
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                Pending
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            {t('step1Desc')}
          </p>
          {!step1Complete ? (
            <button
              onClick={() => setShowAddTruckModal(true)}
              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" /> {t('addTruckBtn')}
            </button>
          ) : (
            <button
              onClick={() => navigate('/vehicles')}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
            >
              View Fleet ({vehicleCount} Trucks) <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Step 2: Confirm RTO Vault PIN */}
        <div className={`p-4 rounded-xl border transition-all ${
          step2Complete 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' 
            : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5 text-white">
              <Lock className="w-4 h-4 text-purple-400" />
              {t('step2Title')}
            </span>
            {step2Complete ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Protected
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                Step 2
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            {t('step2Desc')}
          </p>
          {!step2Complete ? (
            <button
              onClick={() => setShowPinModal(true)}
              className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/30 transition-all cursor-pointer active:scale-98"
            >
              <ShieldCheck className="w-3.5 h-3.5" /> {t('setPinBtn')}
            </button>
          ) : (
            <button
              onClick={() => navigate('/compliance')}
              className="w-full py-1.5 px-3 rounded-lg bg-emerald-900/40 hover:bg-emerald-900/60 text-emerald-300 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
            >
              Open Vault <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Step 3: Log First Trip or Find Load */}
        <div className={`p-4 rounded-xl border transition-all ${
          step3Complete 
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-100' 
            : 'bg-slate-800/80 border-slate-700/80 hover:border-indigo-500/50'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold flex items-center gap-1.5 text-white">
              <MapPin className="w-4 h-4 text-emerald-400" />
              {t('step3Title')}
            </span>
            {step3Complete ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            ) : (
              <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
                Step 3
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
            {t('step3Desc')}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/trips')}
              className="flex-1 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-md shadow-emerald-600/30 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3 h-3" /> {t('logTripBtn')}
            </button>
            <button
              onClick={() => navigate('/loads')}
              className="flex-1 py-2 px-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-98"
            >
              {t('findLoadsBtn')}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add Truck Modal */}
      {showAddTruckModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-sm w-full text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-indigo-400" /> Add Truck to Fleet
              </h3>
              <button
                onClick={() => setShowAddTruckModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleQuickAddTruck} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Registration Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. MH 40 AK 1234"
                  value={regNo}
                  onChange={(e) => setRegNo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white uppercase placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Axle Configuration
                </label>
                <select
                  value={axle}
                  onChange={(e) => setAxle(e.target.value as AxleConfiguration)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="10_WHEELER">10-Wheeler (28 MT Passing / 19 MT Payload)</option>
                  <option value="12_WHEELER">12-Wheeler (36 MT Passing / 25 MT Payload)</option>
                  <option value="16_WHEELER">16-Wheeler (47.5 MT Passing / 30 MT Payload)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddTruckModal(false)}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTruck}
                  className="flex-1 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white flex items-center justify-center gap-1 shadow-md shadow-indigo-600/30"
                >
                  {submittingTruck ? 'Adding...' : 'Save Truck'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Set PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-xs w-full text-slate-100 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-400" /> Set 4-Digit RTO PIN
              </h3>
              <button
                onClick={() => setShowPinModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleConfirmPin} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                  Vault Security PIN
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="e.g. 8821"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full text-center tracking-widest text-lg font-black px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-purple-500"
                />
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                This PIN encrypts your RTO fitness certificates and insurance policies.
              </p>
              <button
                type="submit"
                className="w-full py-2 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30"
              >
                Lock & Save PIN
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
