import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Search, Navigation, ShieldCheck, Plus, X, Fuel, ShieldAlert } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const MobileBottomNav: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);

  const navItems = [
    { to: '/', label: t('navCockpit'), icon: LayoutDashboard },
    { to: '/trips', label: t('navTrips'), icon: Truck },
    { to: '/loads', label: t('navLoads'), icon: Search },
    { to: '/tracking', label: t('navTracking'), icon: Navigation },
    { to: '/compliance', label: t('navVault'), icon: ShieldCheck }
  ];

  const handleQuickAction = (route: string) => {
    setIsQuickActionOpen(false);
    navigate(route);
  };

  return (
    <>
      {/* Quick Action Popup Modal for Mobile */}
      {isQuickActionOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end bg-black/60 backdrop-blur-xs">
          <div
            className="fixed inset-0"
            onClick={() => setIsQuickActionOpen(false)}
          />
          <div className="relative bg-slate-900 border-t border-slate-800 rounded-t-3xl p-5 shadow-2xl z-10 animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Quick Highway Action
              </span>
              <button
                onClick={() => setIsQuickActionOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-3">
              <button
                onClick={() => handleQuickAction('/trips')}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left flex items-center gap-2.5 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Log Trip</div>
                  <div className="text-[10px] text-slate-400">75% Advance</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('/fuel-audit')}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left flex items-center gap-2.5 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Fuel Audit</div>
                  <div className="text-[10px] text-slate-400">3.0 km/L Check</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('/vehicles')}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left flex items-center gap-2.5 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Add Truck</div>
                  <div className="text-[10px] text-slate-400">10W / 12W / 16W</div>
                </div>
              </button>

              <button
                onClick={() => handleQuickAction('/balance-sentinel')}
                className="p-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-left flex items-center gap-2.5 active:scale-98 transition-all"
              >
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">POD Claim</div>
                  <div className="text-[10px] text-slate-400">WhatsApp Notice</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar on Mobile */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-0 inset-x-0 bg-slate-900/95 backdrop-blur-lg border-t border-slate-800/90 z-40 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb"
      >
        {navItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </NavLink>
          );
        })}

        {/* Center Floating Action Button */}
        <div className="relative -top-3">
          <button
            onClick={() => setIsQuickActionOpen(!isQuickActionOpen)}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-purple-600 to-amber-500 text-white shadow-xl shadow-indigo-600/40 flex items-center justify-center border-2 border-slate-900 active:scale-95 transition-all cursor-pointer"
            aria-label="Quick Action"
          >
            <Plus className={`w-6 h-6 transition-transform duration-200 ${isQuickActionOpen ? 'rotate-45' : ''}`} />
          </button>
        </div>

        {navItems.slice(2).map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all ${
                  isActive
                    ? 'text-indigo-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium'
                }`
              }
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] leading-tight">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>
    </>
  );
};
