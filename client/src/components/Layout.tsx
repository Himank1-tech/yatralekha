import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
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
  Siren
} from 'lucide-react';
import { YatraMitraModal } from './YatraMitraModal';
import { EmergencyModal } from './EmergencyModal';

export const Layout: React.FC = () => {
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isYatraMitraOpen, setIsYatraMitraOpen] = useState<boolean>(false);
  const [isEmergencyOpen, setIsEmergencyOpen] = useState<boolean>(false);
  const location = useLocation();

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

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
    { to: '/', label: 'Operations Cockpit', icon: LayoutDashboard },
    { to: '/loads', label: 'Find Loads & Freight Board', icon: Search, badge: 'Loads' },
    { to: '/compliance', label: 'RTO & Compliance Vault', icon: ShieldCheck },
    { to: '/tracking', label: 'Live Tracking & How-To', icon: Navigation, ping: true },
    { to: '/balance-sentinel', label: 'Balance Bhaada Sentinel', icon: ShieldAlert, badge: 'POD Escrow' },
    { to: '/call-logs', label: 'Call Logs & Directory', icon: PhoneCall },
    { to: '/visiting-card', label: 'Visiting Card & Profile', icon: CreditCard }
  ];

  const operationalToolsNav = [
    { to: '/trips', label: 'Trips & Freight Khata', icon: Truck },
    { to: '/fuel-audit', label: 'Fuel Audit & Theft Radar', icon: Fuel },
    { to: '/vehicles', label: 'Fleet & Weight Limits', icon: Layers },
    { to: '/ledger', label: 'Double-Entry Ledger', icon: BookOpen },
    { to: '/ocr', label: 'Document OCR Scanner', icon: ScanLine },
    { to: '/corridors', label: 'Corridor Economics', icon: MapPin }
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
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Primary Hub:</span>
          <span className="font-bold text-slate-200">Nagpur (Hingna MIDC)</span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          MH-40
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto text-xs">
        {/* Core Super App Hub */}
        <div>
          <div className="px-3 mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Super-App Hub
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
            Operational Engines
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

            {/* Status indicator */}
            {isBackendConnected ? (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Backend Live {backendLatency !== null ? `(${backendLatency}ms)` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Cloud Interactive Active</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Emergency 108 / 1033 Hotline Button */}
            <button
              onClick={() => setIsEmergencyOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
              title="Highway Emergency Hotline"
            >
              <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span className="hidden sm:inline">Emergency 108 / 1033</span>
              <span className="sm:hidden">108 SOS</span>
            </button>

            {/* Fleet Identity */}
            <div className="text-right">
              <div className="text-xs font-extrabold text-slate-900 truncate max-w-[130px] sm:max-w-none">
                Vidarbha Heavy Haulers
              </div>
              <div className="text-[10px] sm:text-[11px] text-slate-500 hidden xs:block">
                Patil Transport · GST: 27AABCV1234F1Z8
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center font-bold text-xs text-indigo-800">
              VH
            </div>
          </div>
        </header>

        {/* Page Container */}
        <main className="flex-1 p-4 sm:p-6 md:p-8">
          <Outlet />
        </main>
      </div>

      {/* Floating Interactive YatraMitra AI Mascot Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsYatraMitraOpen(true)}
          className="relative group p-3.5 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 ring-4 ring-indigo-500/20"
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
