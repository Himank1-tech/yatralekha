import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage, Language } from '../context/LanguageContext';
import { OfflineSync } from '../utils/offlineSync';
import { MobileBottomNav } from './MobileBottomNav';
import {
  LayoutDashboard,
  Navigation,
  Truck,
  Fuel,
  ShieldCheck,
  BookOpen,
  ScanLine,
  MapPin,
  Layers,
  Radio,
  Menu,
  X,
  Sparkles,
  PhoneCall,
  Search,
  ShieldAlert,
  CreditCard,
  Mic,
  Siren,
  LogOut,
  WifiOff,
  User as UserIcon,
  Crown
} from 'lucide-react';
import { YatraMitraModal } from './YatraMitraModal';
import { EmergencyModal } from './EmergencyModal';

export const Layout: React.FC = () => {
  const { user, organization, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(() => navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isYatraMitraOpen, setIsYatraMitraOpen] = useState<boolean>(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Online / Offline listener & background highway queue sync
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      const token = localStorage.getItem('yatralekha_token');
      const apiBase = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';
      OfflineSync.flushQueue(apiBase, token);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    async function checkHealth() {
      const t0 = performance.now();
      try {
        const res = await fetch('/health');
        if (res.ok) {
          const t1 = performance.now();
          setBackendLatency(Math.round(t1 - t0));
          setIsBackendConnected(true);
        } else {
          setIsBackendConnected(false);
        }
      } catch {
        setIsBackendConnected(false);
      }
    }

    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  const coreSuperAppNav = [
    { to: '/', label: t('cockpit'), icon: LayoutDashboard },
    { to: '/loads', label: t('loads'), icon: Search, badge: 'Loads' },
    { to: '/compliance', label: t('vault'), icon: ShieldCheck },
    { to: '/tracking', label: t('tracking'), icon: Navigation, ping: true },
    { to: '/balance-sentinel', label: t('balance'), icon: ShieldAlert, badge: 'POD Escrow' },
    { to: '/call-logs', label: t('callLogs'), icon: PhoneCall },
    { to: '/visiting-card', label: t('card'), icon: CreditCard }
  ];

  const operationalToolsNav = [
    { to: '/trips', label: t('trips'), icon: Truck },
    { to: '/fuel-audit', label: t('fuel'), icon: Fuel },
    { to: '/vehicles', label: t('fleet'), icon: Layers },
    { to: '/ledger', label: t('ledger'), icon: BookOpen },
    { to: '/ocr', label: t('ocr'), icon: ScanLine },
    { to: '/corridors', label: t('corridors'), icon: MapPin }
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-900 text-slate-300">
      {/* Brand */}
      <div className="h-16 px-5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 flex items-center justify-center text-white font-black text-base shadow-md">
            YL
          </div>
          <div>
            <div className="font-extrabold text-white tracking-tight leading-none text-base">
              YatraLekha <span className="text-amber-400 text-xs font-bold">v2.0</span>
            </div>
            <div className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase mt-1">
              Heavy-Haul Super-App
            </div>
          </div>
        </div>

        {/* Mobile close button */}
        <button
          onClick={() => setIsMobileMenuOpen(false)}
          className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          aria-label="Close menu"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Hub Info Banner */}
      <div className="mx-3 my-2 px-3 py-2 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">{t('primaryHub')}</span>
          <span className="font-bold text-slate-200">{organization?.hubCity || organization?.hubLocation || 'Transport Fleet Hub'}</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          MH
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto text-xs">
        {/* Core Super App Hub */}
        <div>
          <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('superAppHub')}
          </div>
          <div className="space-y-1">
            {coreSuperAppNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-indigo-600 text-white font-bold shadow-xs'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      {item.badge}
                    </span>
                  )}
                  {item.ping && (
                    <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Operational Modules */}
        <div>
          <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            {t('operationalEngines')}
          </div>
          <div className="space-y-1">
            {operationalToolsNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium transition-all ${
                      isActive
                        ? 'bg-slate-800 text-white font-bold border border-slate-700'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Creator Control Room (Private Space) */}
        {user?.email?.trim().toLowerCase() === 'himankbatra2005@gmail.com' && (
          <div>
            <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center justify-between">
              <span>Creator Space</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-300 px-1 py-0.2 rounded font-black">ROOT</span>
            </div>
            <div className="space-y-1">
              <NavLink
                to="/creator-admin"
                className={({ isActive }) =>
                  `flex items-center gap-2.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    isActive
                      ? 'bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs'
                      : 'text-amber-400 hover:text-amber-200 hover:bg-slate-800/80 border border-amber-500/20'
                  }`
                }
              >
                <Crown className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="truncate">👑 Creator Admin</span>
              </NavLink>
            </div>
          </div>
        )}
      </nav>

      {/* AIS-140 Telematics Status Footer */}
      <div className="p-3.5 border-t border-slate-800 text-xs bg-slate-950/60">
        <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
          <div className="flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>AIS-140 & SIM Engine</span>
          </div>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded">
            PORT 5179
          </span>
        </div>
        <p className="text-slate-400 text-[10px] leading-relaxed">
          Samruddhi Mahamarg & NH 53 corridor pings active.
        </p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar (hidden on mobile) */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-slate-800 fixed inset-y-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-slate-900 shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-64">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 md:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg focus:outline-hidden"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Mobile Brand Title */}
            <div className="flex items-center gap-2 md:hidden">
              <div className="w-7 h-7 rounded-md bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                YL
              </div>
              <span className="font-bold text-slate-900 text-sm">YatraLekha v2.0</span>
            </div>

            {/* Active Corridor Badges */}
            <div className="hidden lg:flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <span>🛣️ Samruddhi Mahamarg</span>
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                <span>🏭 NH 53 Steel Corridor</span>
              </span>
            </div>

            {/* Status & Highway Connectivity indicator */}
            {!isOnline ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                <WifiOff className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                <span>{t('offlineMode')}</span>
              </span>
            ) : isBackendConnected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                {t('cloudLive')} {backendLatency !== null ? `(${backendLatency}ms)` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Cloud Interactive Active</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Top-Bar Multilingual UI Switcher (EN | हिं | मरा) */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 border border-slate-200" title="Switch Language / भाषा बदलें">
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-0.8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-2 py-0.8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'hi'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                हिं
              </button>
              <button
                onClick={() => setLanguage('mr')}
                className={`px-2 py-0.8 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  language === 'mr'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                मरा
              </button>
            </div>

            {/* Emergency 108 / 1033 Hotline Button */}
            <button
              onClick={() => setIsEmergencyOpen(true)}
              className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title={t('emergency')}
            >
              <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">108 / 1033</span>
              <span className="sm:hidden">108</span>
            </button>

            {/* Fleet Identity & Switch Account */}
            <div className="flex items-center gap-2">
              <div className="text-right">
                <div className="text-xs font-extrabold text-slate-900 truncate max-w-[110px] sm:max-w-none">
                  {organization?.companyName || organization?.name || 'Transport Fleet'}
                </div>
                <div className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block">
                  {user?.fullName || 'Transporter'} {organization?.gstin ? `· GST: ${organization.gstin}` : '· Owner'}
                </div>
              </div>

              {/* Private Creator Admin Link - strictly visible ONLY to platform creator */}
              {user?.email?.trim().toLowerCase() === 'himankbatra2005@gmail.com' && (
                <NavLink
                  to="/creator-admin"
                  title="Private Creator Control Room"
                  className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-800 font-black text-xs flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Crown className="w-3.5 h-3.5 text-amber-600" />
                  <span className="hidden sm:inline">👑 Creator Admin</span>
                </NavLink>
              )}

              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                title={t('logout')}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 border border-slate-200 hover:border-red-200 flex items-center justify-center text-slate-600 hover:text-red-600 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </header>

        {/* Page Container with Mobile pb-24 padding so content is never hidden behind bottom nav */}
        <main className="flex-1 p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileBottomNav />

      {/* Floating Interactive YatraMitra AI Mascot Button (positioned above mobile bottom nav) */}
      <div className="fixed bottom-20 md:bottom-6 right-4 md:right-6 z-30">
        <button
          onClick={() => setIsYatraMitraOpen(true)}
          className="relative group p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ring-4 ring-indigo-500/20 cursor-pointer"
          aria-label="Open YatraMitra AI Voice Assistant"
        >
          <span className="text-2xl">👳🏽‍♂️</span>
          <span className="hidden md:inline-block font-extrabold text-xs tracking-wide pr-1">
            यात्रा-मित्र AI
          </span>
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-slate-900 animate-ping" />
        </button>
      </div>

      {/* YatraMitra Modal */}
      <YatraMitraModal
        isOpen={isYatraMitraOpen}
        onClose={() => setIsYatraMitraOpen(false)}
      />

      {/* Emergency Hotline Modal */}
      <EmergencyModal
        isOpen={isEmergencyOpen}
        onClose={() => setIsEmergencyOpen(false)}
      />
    </div>
  );
};
