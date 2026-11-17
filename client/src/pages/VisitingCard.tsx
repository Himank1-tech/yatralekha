import React, { useState } from 'react';
import {
  CreditCard,
  Share2,
  Download,
  Printer,
  PhoneCall,
  MessageSquare,
  ShieldCheck,
  Truck,
  MapPin,
  QrCode,
  Award,
  Sparkles,
  Edit3
} from 'lucide-react';

export const VisitingCard: React.FC = () => {
  const [fleetName, setFleetName] = useState('Vidarbha Heavy Haulers Pvt Ltd');
  const [proprietorName, setProprietorName] = useState('Rajeshwar Patil');
  const [phone, setPhone] = useState('+91 98220 01122');
  const [email, setEmail] = useState('operations@vidarbhahaulers.in');
  const [gstin, setGstin] = useState('27AABCV1234F1Z8');
  const [hub, setHub] = useState('Nagpur Logistics Park, Hingna MIDC');
  const [routes, setRoutes] = useState('Nagpur ↔ Pune ↔ Mumbai / Bhandara (NH 53 & Samruddhi)');
  const [fleetSummary, setFleetSummary] = useState('10-Wheeler (28T) · 12-Wheeler (35T) · 16-Wheeler (47.5T)');
  const [isCopied, setIsCopied] = useState(false);

  const handleShareWhatsApp = () => {
    const text = `*DIGITAL BUSINESS CARD - ${fleetName}*\n` +
      `Proprietor: ${proprietorName}\n` +
      `📞 Contact: ${phone}\n` +
      `🚛 Fleet Capacity: ${fleetSummary}\n` +
      `🛣️ Regular Corridors: ${routes}\n` +
      `📍 Hub: ${hub}\n` +
      `📜 GSTIN: ${gstin}\n` +
      `✅ Verified All India Permit & AIS-140 Live GPS Tracking Enabled.\n\n` +
      `Powered by YatraLekha Fleet Operating System`;

    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                Digital Transporter Identity
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                Network Growth & Visiting Card
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Commercial Visiting Card Showcase
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              Instant branded digital business card for mandi brokers, dispatchers, and factory logistics managers. One-tap WhatsApp sharing and print-ready card export.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/30 flex items-center gap-2 transition-all"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Share on WhatsApp</span>
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-slate-700 flex items-center gap-2 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Card</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* The Digital Visiting Card (Preview) */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-indigo-500/40 relative overflow-hidden transition-transform hover:scale-[1.01]">
            {/* Background elements */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-indigo-600/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-purple-600/20 rounded-full blur-2xl pointer-events-none" />

            {/* Top Brand Header */}
            <div className="flex items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center font-black text-xl text-white shadow-lg shadow-indigo-600/30">
                  YL
                </div>
                <div>
                  <h3 className="font-extrabold text-base sm:text-lg text-white leading-tight">
                    {fleetName}
                  </h3>
                  <p className="text-xs text-indigo-400 font-semibold tracking-wide uppercase mt-0.5">
                    Heavy-Haul Commercial Fleet OS
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>KYC VERIFIED</span>
              </div>
            </div>

            {/* Proprietor & Contact Info */}
            <div className="py-5 space-y-3.5 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Fleet Proprietor & Transport Lead
                </span>
                <span className="text-sm font-bold text-slate-100">{proprietorName}</span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    Direct Phone / WhatsApp
                  </span>
                  <span className="font-mono font-bold text-indigo-300 text-xs sm:text-sm">{phone}</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                    GSTIN Registration
                  </span>
                  <span className="font-mono text-slate-300 font-semibold">{gstin}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Verified Fleet Passing Strength
                </span>
                <div className="mt-1 flex items-center gap-1.5 text-slate-200 font-semibold">
                  <Truck className="w-4 h-4 text-indigo-400 shrink-0" />
                  <span>{fleetSummary}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                  Primary Operating Corridors
                </span>
                <div className="mt-1 flex items-start gap-1.5 text-slate-300 text-[11px] leading-relaxed">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{routes}</span>
                </div>
              </div>
            </div>

            {/* Bottom QR & Verification Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                {/* Visual QR Code representation */}
                <div className="w-12 h-12 bg-white p-1 rounded-xl shadow-xs flex items-center justify-center">
                  <div className="w-full h-full bg-slate-900 rounded-lg flex items-center justify-center text-white">
                    <QrCode className="w-8 h-8 text-white" />
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-300 block">Scan to Save Bilty Contact</span>
                  <span className="text-[9px] text-indigo-400">All India Permit Valid · AIS-140 Live</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[9px] text-slate-400 block">Hub Base</span>
                <span className="text-[10px] font-bold text-slate-200">{hub}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card Customizer Form */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Edit3 className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 text-sm">Customize Visiting Card Details</h3>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Company / Fleet Name</label>
              <input
                type="text"
                value={fleetName}
                onChange={(e) => setFleetName(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Owner / Manager</label>
                <input
                  type="text"
                  value={proprietorName}
                  onChange={(e) => setProprietorName(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl font-mono uppercase focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Operational Hub Location</label>
              <input
                type="text"
                value={hub}
                onChange={(e) => setHub(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Fleet Axle Breakdown</label>
              <input
                type="text"
                value={fleetSummary}
                onChange={(e) => setFleetSummary(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Corridors Served</label>
              <textarea
                rows={2}
                value={routes}
                onChange={(e) => setRoutes(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={handleCopyLink}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{isCopied ? 'Link Copied!' : 'Copy Shareable Link'}</span>
            </button>
            <button
              onClick={handleShareWhatsApp}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Card</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
