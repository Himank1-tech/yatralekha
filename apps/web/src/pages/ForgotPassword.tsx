import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, KeyRound, ArrowLeft, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();

  // Step 1: 'request-otp' | Step 2: 'verify-reset' | Step 3: 'success'
  const [step, setStep] = useState<'request-otp' | 'verify-reset' | 'success'>('request-otp');

  // Form states
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI status states
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';

  // Step 1 Handler: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to dispatch verification code.');
      }

      setInfoMessage(data.message || `A 6-digit OTP has been sent to ${email.trim()}.`);
      setStep('verify-reset');
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2 Handler: Verify OTP & Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setInfoMessage('');

    if (!otp.trim() || otp.trim().length !== 6) {
      setErrorMessage('Please enter a valid 6-digit verification code.');
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and retype.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          otp: otp.trim(),
          newPassword
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to reset password.');
      }

      setStep('success');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col justify-center items-center px-4 py-8">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header / Brand */}
      <div className="mb-6 text-center relative z-10">
        <Link to="/login" className="inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-slate-900/90 border border-indigo-500/30 shadow-xl mb-3 hover:border-indigo-500/50 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-lg shadow-lg">
            YL
          </div>
          <div className="text-left">
            <h1 className="text-xl font-black tracking-tight text-white leading-none">
              YatraLekha <span className="text-amber-400 text-xs font-bold">v2.0</span>
            </h1>
            <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mt-0.5">
              Account Security & Password Recovery
            </p>
          </div>
        </Link>
      </div>

      {/* Main Container Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-xl relative z-10">
        {/* Step Progress Indicators */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'request-otp' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400'
            }`}>
              1
            </div>
            <span className={`text-xs font-medium ${step === 'request-otp' ? 'text-white' : 'text-slate-400'}`}>
              Email
            </span>
          </div>
          <div className="flex-1 h-0.5 mx-3 bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'verify-reset' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'bg-slate-800 text-slate-400'
            }`}>
              2
            </div>
            <span className={`text-xs font-medium ${step === 'verify-reset' ? 'text-white' : 'text-slate-400'}`}>
              Verify & Set
            </span>
          </div>
          <div className="flex-1 h-0.5 mx-3 bg-slate-800" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
              step === 'success' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30' : 'bg-slate-800 text-slate-400'
            }`}>
              ✓
            </div>
            <span className={`text-xs font-medium ${step === 'success' ? 'text-white' : 'text-slate-400'}`}>
              Done
            </span>
          </div>
        </div>

        {/* Error / Info Messages */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {infoMessage && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* STEP 1: REQUEST OTP */}
        {step === 'request-otp' && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Forgot Your Password?</h2>
              <p className="text-xs text-slate-400">
                Enter your fleet account email address. We'll send you a 6-digit one-time verification code valid for 15 minutes.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="fleet.owner@transport.in"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setErrorMessage(''); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Dispatching OTP Code...</span>
                </>
              ) : (
                <>
                  <span>Send Recovery OTP</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Sign In</span>
              </Link>
            </div>
          </form>
        )}

        {/* STEP 2: VERIFY OTP & RESET */}
        {step === 'verify-reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <h2 className="text-base font-bold text-white mb-1">Enter Verification Code</h2>
              <p className="text-xs text-slate-400">
                We sent a 6-digit OTP code to <strong className="text-indigo-300">{email}</strong>. Check your inbox and spam folder.
              </p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  6-Digit OTP Code
                </label>
                <button
                  type="button"
                  onClick={handleRequestOtp}
                  disabled={loading}
                  className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Resend Code</span>
                </button>
              </div>
              <div className="relative">
                <KeyRound className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  maxLength={6}
                  required
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => {
                    setOtp(e.target.value.replace(/\D/g, ''));
                    setErrorMessage('');
                  }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm tracking-widest font-mono text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 text-center"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setErrorMessage(''); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 uppercase mb-1">
                Confirm New Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="Re-enter new password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setErrorMessage(''); }}
                  className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-600/25"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <span>Reset & Save Password</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => { setStep('request-otp'); setErrorMessage(''); }}
                className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Use a different email</span>
              </button>
            </div>
          </form>
        )}

        {/* STEP 3: SUCCESS STATE */}
        {step === 'success' && (
          <div className="py-4 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center mx-auto text-emerald-400 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-lg font-bold text-white mb-1">Password Changed Successfully!</h2>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Your fleet account password has been updated. You can now log into your workspace with your new credentials.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="w-full py-2.5 px-4 rounded-xl font-bold text-xs bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25"
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Footer Security Badge */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>256-bit Encrypted Password Recovery Session</span>
        </div>
      </div>
    </div>
  );
};
