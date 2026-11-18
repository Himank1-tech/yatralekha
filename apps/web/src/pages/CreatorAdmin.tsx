import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShieldCheck,
  Building2,
  Users,
  Truck,
  Route,
  Package,
  Search,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ExternalLink,
  Crown,
  Activity,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface AdminStats {
  totalOrganizations: number;
  totalUsers: number;
  totalVehicles: number;
  totalTrips: number;
  totalLoads: number;
}

interface AdminOrganization {
  id: string;
  companyName: string;
  hubCity: string;
  panOrGst?: string;
  gstin?: string;
  kycStatus: string;
  signupDate: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  ownerRole: string;
  vehicleCount: number;
  tripCount: number;
}

const CREATOR_EMAIL = 'himankbatra2005@gmail.com';

export const CreatorAdmin: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats>({
    totalOrganizations: 0,
    totalUsers: 0,
    totalVehicles: 0,
    totalTrips: 0,
    totalLoads: 0,
  });
  const [organizations, setOrganizations] = useState<AdminOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());

  // Strict client-side email guard
  if (!user || user.email?.trim().toLowerCase() !== CREATOR_EMAIL) {
    return <Navigate to="/" replace />;
  }

  const fetchAdminOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';
      const token = localStorage.getItem('yatralekha_token');

      const res = await fetch(`${API_BASE}/admin/overview`, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Access Denied: Creator Admin privilege verification failed.');
        }
        throw new Error(`Failed to load admin overview (Status: ${res.status})`);
      }

      const json = await res.json();
      if (json.success && json.data) {
        setStats(json.data.stats);
        setOrganizations(json.data.organizations || []);
        setLastRefreshed(new Date());
      } else {
        throw new Error(json.error || 'Failed to retrieve admin data');
      }
    } catch (err: any) {
      console.error('Admin fetch error:', err);
      setError(err.message || 'Error communicating with control room API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminOverview();
  }, []);

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      org.companyName.toLowerCase().includes(q) ||
      org.ownerName.toLowerCase().includes(q) ||
      org.ownerPhone.toLowerCase().includes(q) ||
      org.ownerEmail.toLowerCase().includes(q) ||
      org.hubCity.toLowerCase().includes(q) ||
      (org.gstin && org.gstin.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6 text-slate-100">
      {/* Top Creator Header Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-amber-500/30 p-6 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-96 bg-radial from-amber-500/10 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <Crown className="w-3.5 h-3.5 text-amber-400" />
                Private Creator Control Room
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live Fleet Pulse
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2">
              YatraLekha Mission Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              Real-time multi-tenant monitoring across Indian freight corridors, registered transport enterprises, truck allocations, and cloud storage health.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Authorized Creator</span>
              <span className="text-xs font-mono font-bold text-amber-300">{user.email}</span>
            </div>
            <button
              onClick={fetchAdminOverview}
              disabled={loading}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 border border-slate-700 hover:border-amber-500/50 text-white text-xs font-bold flex items-center gap-2 transition shadow-lg cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Control Room</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Top KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Transporter Signups */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Transporters</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.totalOrganizations}
          </div>
          <span className="text-[11px] text-indigo-400 font-semibold mt-1 block">
            {stats.totalUsers} registered users
          </span>
        </div>

        {/* Total Heavy Trucks */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-emerald-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Fleet Trucks</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <Truck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.totalVehicles}
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-1 block">
            Enrolled heavy-haul assets
          </span>
        </div>

        {/* Total Trips */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Trips Executed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-600/20 text-amber-400 flex items-center justify-center">
              <Route className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.totalTrips}
          </div>
          <span className="text-[11px] text-amber-400 font-semibold mt-1 block">
            Corridor khata dispatches
          </span>
        </div>

        {/* Marketplace Loads */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Marketplace Loads</span>
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 text-purple-400 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {stats.totalLoads}
          </div>
          <span className="text-[11px] text-purple-400 font-semibold mt-1 block">
            Exchange freight listings
          </span>
        </div>
      </div>

      {/* Main Section: Search & Transporters Directory */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Search & Title Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <span>Registered Transporters & Fleet Owners</span>
              <span className="text-xs font-normal text-slate-400">({filteredOrgs.length} enterprises)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live database records from Neon PostgreSQL (`organizations` & `users`).
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company, owner, phone, city..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-hidden focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Transporters Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Company Name</th>
                <th className="py-3 px-4">Fleet Owner & Contact</th>
                <th className="py-3 px-4">Hub City</th>
                <th className="py-3 px-4 text-center">Trucks</th>
                <th className="py-3 px-4 text-center">Trips</th>
                <th className="py-3 px-4">Registered Date</th>
                <th className="py-3 px-4 text-right">Quick Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-400 mb-2" />
                    <span>Loading platform records from Neon PostgreSQL...</span>
                  </td>
                </tr>
              ) : filteredOrgs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <Building2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <span>No transport enterprises matched your search criteria.</span>
                  </td>
                </tr>
              ) : (
                filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-slate-800/50 transition-colors">
                    {/* Company Details */}
                    <td className="py-3.5 px-4 font-medium">
                      <div className="font-bold text-slate-100 text-sm">{org.companyName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        {org.gstin ? (
                          <span className="font-mono text-slate-300">GST: {org.gstin}</span>
                        ) : org.panOrGst ? (
                          <span className="font-mono text-slate-300">ID: {org.panOrGst}</span>
                        ) : null}
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {org.kycStatus || 'VERIFIED'}
                        </span>
                      </div>
                    </td>

                    {/* Owner & Contact */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{org.ownerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{org.ownerPhone}</div>
                      <div className="text-[11px] text-slate-500 truncate max-w-[180px]">{org.ownerEmail}</div>
                    </td>

                    {/* Hub City */}
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 text-slate-300 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span>{org.hubCity || 'Maharashtra'}</span>
                      </span>
                    </td>

                    {/* Trucks Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs">
                        🚛 {org.vehicleCount}
                      </span>
                    </td>

                    {/* Trips Count */}
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-bold text-xs">
                        🛣️ {org.tripCount}
                      </span>
                    </td>

                    {/* Signup Date */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <div className="flex items-center gap-1.5 text-[11px]">
                        <Calendar className="w-3 h-3 text-slate-500" />
                        <span>
                          {org.signupDate
                            ? new Date(org.signupDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Recent'}
                        </span>
                      </div>
                    </td>

                    {/* Quick Call / WhatsApp */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={`tel:${org.ownerPhone?.replace(/\s+/g, '')}`}
                          title="Call Transporter"
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 flex items-center justify-center text-slate-300 transition"
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </a>
                        <a
                          href={`https://wa.me/${org.ownerPhone?.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noreferrer"
                          title="WhatsApp Transporter"
                          className="w-7 h-7 rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 flex items-center justify-center text-slate-300 transition"
                        >
                          <span className="text-xs">💬</span>
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info bar */}
        <div className="p-3 bg-slate-950/80 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Control Room Connected to Cloud PostgreSQL</span>
          <span>Last Refreshed: {lastRefreshed.toLocaleTimeString('en-IN')}</span>
        </div>
      </div>
    </div>
  );
};
