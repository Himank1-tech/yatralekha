import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Truck, ShieldCheck, ArrowRight, Sparkles, Building, User, Phone, Mail, Lock, MapPin, FileText } from 'lucide-react';

export const Auth: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Form State
  const [formData, setFormData] = useState({
    companyName: '',
    ownerName: '',
    phone: '',
    email: '',
    password: '',
    hubCity: 'Nagpur (Hingna MIDC)',
    gstin: '',
    pan: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrorMessage('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    if (isRegister) {
      const res = await register({
        companyName: formData.companyName,
        ownerName: formData.ownerName,
        phone: formData.phone,
        email: formData.email,
        password: formData.password,
        hubCity: formData.hubCity,
        gstin: formData.gstin || undefined,
        pan: formData.pan || undefined
      });
      setLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMessage(res.error || 'Registration failed');
      }
    } else {
      const res = await login(formData.email, formData.password);
      setLoading(false);
      if (res.success) {
        navigate('/');
      } else {
        setErrorMessage(res.error || 'Invalid email or password');
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="mb-6 text-center relative z-10">
        <div className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
            YL
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black tracking-tight text-white leading-none">
              YatraLekha <span className="text-amber-400 text-xs font-bold">v2.0</span>
            </h1>
            <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
              Commercial Heavy-Haul Fleet OS & Marketplace
            </p>
          </div>
        </div>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          India's dedicated operating system for 10W, 12W & 16W fleet owners, backhaul freight radar, and zero-loss POD recovery.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Auth Toggle */}
        <div className="flex border-b border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => { setIsRegister(false); setErrorMessage(''); }}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              !isRegister
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In to Fleet
          </button>
          <button
            type="button"
            onClick={() => { setIsRegister(true); setErrorMessage(''); }}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              isRegister
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Register New Workspace
          </button>
        </div>

        {errorMessage && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium">
            {errorMessage}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {isRegister && (
            <>
              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Company / Fleet Name</label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="companyName"
                    required
                    placeholder="e.g. Nagpur Freight Logistics Pvt Ltd"
                    value={formData.companyName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Owner / Munim Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    name="ownerName"
                    required
                    placeholder="e.g. Rajeshwar Patil"
                    value={formData.ownerName}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Primary Transport Hub</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                  <select
                    name="hubCity"
                    value={formData.hubCity}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Nagpur (Hingna MIDC)">Nagpur (Hingna MIDC) - MH 40 / MH 31</option>
                    <option value="Pune (Chakan Auto Cluster)">Pune (Chakan Auto Cluster) - MH 12 / MH 14</option>
                    <option value="Mumbai (Bhiwandi Logistics Hub)">Mumbai (Bhiwandi Hub) - MH 04 / MH 43</option>
                    <option value="Hyderabad (Medchal Highway)">Hyderabad (Medchal) - TS 07 / TS 08</option>
                    <option value="Raipur (Urla Heavy Industrial)">Raipur (Urla Industrial) - CG 04</option>
                    <option value="Indore (Pithampur SEZ)">Indore (Pithampur SEZ) - MP 09</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Phone Number</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="tel"
                      name="phone"
                      required
                      placeholder="+91 98220 00000"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">GSTIN (Optional)</label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      name="gstin"
                      placeholder="27AAACV..."
                      value={formData.gstin}
                      onChange={handleChange}
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="email"
                name="email"
                required
                placeholder="fleet.owner@transport.in"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              <input
                type="password"
                name="password"
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 hover:border-slate-600 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            {loading ? 'Processing...' : isRegister ? 'Create Fleet Workspace' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>MoRTH Compliant • All India VAHAN 4.0 Verified Data</span>
        </div>
      </div>
    </div>
  );
};
