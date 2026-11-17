import React from 'react';
import { PhoneCall, AlertTriangle, ShieldCheck, Wrench, X, Siren } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const helplines = [
    {
      title: 'NHAI Highway Helpline (Accident & Medical)',
      number: '1033',
      description: 'Nationwide 24x7 emergency medical aid, route obstruction removal, and toll assistance.',
      category: 'MEDICAL & HIGHWAY',
      color: 'bg-rose-500/10 text-rose-400 border-rose-500/30'
    },
    {
      title: 'National Emergency Unified Response',
      number: '112',
      description: 'Police, fire, and immediate highway robbery/threat rapid intervention.',
      category: 'POLICE & CRIME',
      color: 'bg-amber-500/10 text-amber-400 border-amber-500/30'
    },
    {
      title: 'Samruddhi Mahamarg Expressway Patrol',
      number: '1800 233 2233',
      description: 'MSRDC 24x7 control tower for towing cranes, animal hazard, and high-speed tire bursts.',
      category: 'EXPRESSWAY RESCUE',
      color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
    },
    {
      title: 'Heavy Vehicle Highway Crane / Towing Helpline',
      number: '+91 98220 99110',
      description: 'Dedicated 50-tonne hydraulic crane network covering Nagpur, Jalna, and Chakan corridors.',
      category: 'COMMERCIAL CRANE',
      color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-slate-900 border border-rose-500/30 rounded-2xl shadow-2xl overflow-hidden text-slate-100">
        {/* Banner */}
        <div className="bg-rose-600/20 border-b border-rose-500/30 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-lg animate-pulse">
              <Siren className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>National Highway Emergency Hub</span>
              </h3>
              <p className="text-xs text-rose-300">
                Direct hotline dialer for drivers & fleet managers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Helpline cards */}
        <div className="p-5 space-y-3 max-h-[65vh] overflow-y-auto">
          {helplines.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-800/80 border border-slate-700/70 rounded-xl p-3.5 flex items-center justify-between gap-4 hover:border-slate-600 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${item.color}`}>
                    {item.category}
                  </span>
                </div>
                <h4 className="text-sm font-semibold text-white">{item.title}</h4>
                <p className="text-xs text-slate-400 mt-0.5">{item.description}</p>
              </div>

              <a
                href={`tel:${item.number.replace(/\s+/g, '')}`}
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-colors"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {item.number}</span>
              </a>
            </div>
          ))}

          {/* Golden Hour Guidelines */}
          <div className="mt-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-400">
              <AlertTriangle className="w-4 h-4" />
              <span>Accident & Breakdown Protocol:</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              1. Turn on Hazard Flashers immediately and place reflective triangles 50m behind the heavy truck.
              2. Do not dispute on the expressway carriageway; move crew to the outer side barrier.
              3. Dial 1033 with GPS coordinates from YatraLekha Live Map.
            </p>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-950/70 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
          >
            Close Emergency Hub
          </button>
        </div>
      </div>
    </div>
  );
};
