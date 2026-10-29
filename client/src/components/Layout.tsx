import React, { useState, useEffect } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
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
  Server
} from 'lucide-react';

export const Layout: React.FC = () => {
  const [backendLatency, setBackendLatency] = useState<number | null>(null);
  const [isBackendConnected, setIsBackendConnected] = useState<boolean>(true);

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
    const interval = setInterval(checkHealth, 6000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { to: '/', label: 'Executive Dashboard', icon: LayoutDashboard },
    { to: '/tracking', label: 'Live GPS Tracking Map', icon: Navigation },
    { to: '/trips', label: 'Trips & Freight Khata', icon: Truck },
    { to: '/fuel-audit', label: 'Fuel Audit & Theft Radar', icon: Fuel },
    { to: '/vehicles', label: 'Fleet & Weight Limits', icon: Layers },
    { to: '/compliance', label: 'RTO Compliance Vault', icon: ShieldCheck },
    { to: '/ledger', label: 'Double-Entry Ledger', icon: BookOpen },
    { to: '/ocr', label: 'Document OCR Scanner', icon: ScanLine },
    { to: '/corridors', label: 'Corridor Economics', icon: MapPin }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800">
        {/* Brand */}
        <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            YL
          </div>
          <div>
            <div className="font-bold text-white tracking-tight leading-none text-base">
              YatraLekha
            </div>
            <div className="text-[10px] text-indigo-400 font-medium tracking-wider uppercase mt-1">
              Fleet OS · Heavy Haul
            </div>
          </div>
        </div>

        {/* Hub Info Banner */}
        <div className="mx-4 my-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-center justify-between text-xs">
          <span className="text-slate-400">Primary Hub:</span>
          <span className="font-semibold text-slate-200">Nagpur (Hingna)</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
                {item.to === '/tracking' && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* AIS-140 Telematics Status Footer */}
        <div className="p-4 border-t border-slate-800 text-xs bg-slate-950/40">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold mb-1">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>AIS-140 Telematics Live</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Listening on ITS Port 5179 (TCP/UDP). Ingesting GPS pings & fuel sensors.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Navbar */}
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {isBackendConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Backend Connected {backendLatency !== null ? `(${backendLatency}ms)` : ''}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Backend Offline
              </span>
            )}

            <span className="text-xs text-slate-500 hidden sm:inline">
              Corridor Focus:{' '}
              <span className="font-semibold text-slate-800">
                Nagpur ↔ Pune (Samruddhi) & Bhandara (NH 53)
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-slate-900">Vidarbha Heavy Haulers</div>
              <div className="text-[11px] text-slate-500">GST: 27AABCV1234F1Z8</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700">
              VH
            </div>
          </div>
        </header>

        {/* View Container */}
        <main className="flex-1 p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
