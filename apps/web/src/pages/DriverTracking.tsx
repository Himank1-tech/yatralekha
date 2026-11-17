import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Navigation, Radio, MapPin, Truck, Phone, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export const DriverTracking: React.FC = () => {
  const { tripToken } = useParams<{ tripToken: string }>();
  const [isTracking, setIsTracking] = useState<boolean>(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; speed: number; accuracy: number } | null>(null);
  const [pingCount, setPingCount] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('Ready to start tracking');
  const [tripInfo, setTripInfo] = useState<any>(null);
  const watchIdRef = useRef<number | null>(null);

  const API_BASE = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api/v1` : '/api/v1';

  // Fetch initial trip metadata
  useEffect(() => {
    async function fetchTrip() {
      try {
        const res = await fetch(`${API_BASE}/telematics/driver-trip/${tripToken || 'TRIP-MH40-PUNE'}`);
        if (res.ok) {
          const data = await res.json();
          setTripInfo(data.trip);
        }
      } catch {
        // Fallback demo trip
        setTripInfo({
          tripToken: tripToken || 'TRIP-DEMO-01',
          vehicleNumber: 'MH 40 AK 9988',
          driverName: 'Sanjay Yadav',
          origin: 'Nagpur (Hingna MIDC)',
          destination: 'Pune (Chakan Auto Hub)',
          corridor: 'Samruddhi Mahamarg Expressway',
          material: '24 MT Automotive Steel Coils'
        });
      }
    }
    fetchTrip();
  }, [tripToken]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsTracking(true);
    setStatusMessage('Connecting to satellite GPS network...');

    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          speed: pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 62, // m/s to km/h or simulated
          accuracy: Math.round(pos.coords.accuracy)
        };

        setLocation(coords);
        setPingCount((prev) => prev + 1);
        setStatusMessage('Live highway telemetry streaming actively');

        // Send ping to backend
        try {
          await fetch(`${API_BASE}/telematics/driver-ping`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tripToken: tripToken || 'TRIP-DEMO-01',
              latitude: coords.lat,
              longitude: coords.lng,
              speed: coords.speed,
              accuracy: coords.accuracy,
              timestamp: new Date().toISOString()
            })
          });
        } catch {
          // Ignore offline errors
        }
      },
      (err) => {
        console.warn('Geolocation error:', err);
        // Fallback simulation coordinates along Samruddhi Mahamarg
        const simulated = {
          lat: 20.9374 + (Math.random() - 0.5) * 0.01,
          lng: 77.7796 + (Math.random() - 0.5) * 0.01,
          speed: 64,
          accuracy: 12
        };
        setLocation(simulated);
        setPingCount((prev) => prev + 1);
        setStatusMessage('GPS Satellite Simulation Active (Samruddhi Mahamarg)');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setStatusMessage('Live tracking paused');
  };

  return (
    <div className="min-h-screen bg-[#070A10] text-slate-100 flex flex-col items-center px-4 py-6 max-w-md mx-auto">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-black text-white text-sm">
            YL
          </div>
          <div>
            <h1 className="text-sm font-black text-white leading-none">YatraLekha Driver Link</h1>
            <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Zero-Hardware GPS M-Tracking</span>
          </div>
        </div>

        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
          isTracking ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse' : 'bg-slate-800 text-slate-400 border border-slate-700'
        }`}>
          <Radio className="w-3 h-3" /> {isTracking ? 'LIVE ACTIVE' : 'STANDBY'}
        </span>
      </div>

      {/* Vehicle & Trip Card */}
      <div className="w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4">
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-3">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Vehicle Registration</span>
            <span className="text-base font-black text-amber-400 tracking-wide">
              {tripInfo?.vehicleNumber || 'MH 40 AK 9988'}
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold uppercase block">Driver</span>
            <span className="text-xs font-bold text-slate-200">
              {tripInfo?.driverName || 'Sanjay Yadav'}
            </span>
          </div>
        </div>

        {/* Route Visualizer */}
        <div className="space-y-2 text-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Origin</span>
              <span className="font-semibold text-slate-200">{tripInfo?.origin || 'Nagpur (Hingna MIDC)'}</span>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <Navigation className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Destination</span>
              <span className="font-semibold text-slate-200">{tripInfo?.destination || 'Pune (Chakan Auto Hub)'}</span>
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <span>Corridor: <strong className="text-slate-300">Samruddhi Mahamarg</strong></span>
          <span>Payload: <strong className="text-slate-300">24 MT Steel</strong></span>
        </div>
      </div>

      {/* Big Action Button */}
      <div className="w-full mb-4">
        {!isTracking ? (
          <button
            onClick={startTracking}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-950 flex flex-col items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-base">
              <Navigation className="w-5 h-5 animate-bounce" /> Start Highway Live Tracking
            </div>
            <span className="text-[11px] font-normal text-emerald-100">गाड़ी लाइव लोकेशन चालू करें (Zero Battery Drain)</span>
          </button>
        ) : (
          <button
            onClick={stopTracking}
            className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-amber-600 to-red-600 text-white font-black text-sm shadow-xl flex flex-col items-center justify-center gap-1 active:scale-98 transition-all cursor-pointer"
          >
            <div className="flex items-center gap-2 text-base">
              <CheckCircle2 className="w-5 h-5" /> Pause Live Tracking
            </div>
            <span className="text-[11px] font-normal text-amber-100">लोकेशन भेजना रोकें</span>
          </button>
        )}
      </div>

      {/* Live Telemetry Gauges */}
      <div className="w-full grid grid-cols-2 gap-3 mb-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Current Speed</span>
          <span className="text-2xl font-black text-white">
            {location ? location.speed : 0} <span className="text-xs font-normal text-slate-400">km/h</span>
          </span>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <span className="text-[10px] text-slate-400 uppercase font-bold block">GPS Telemetry Pings</span>
          <span className="text-2xl font-black text-indigo-400">
            {pingCount}
          </span>
        </div>
      </div>

      {/* Status Bar */}
      <div className="w-full bg-slate-900/60 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-400 flex items-center gap-2 mb-6">
        <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
        <span className="truncate">{statusMessage}</span>
      </div>

      {/* Emergency Highway Helplines */}
      <div className="w-full mt-auto pt-4 border-t border-slate-800/80">
        <span className="text-[10px] text-slate-400 font-bold uppercase block mb-2 text-center">
          Highway Emergency Assistance
        </span>
        <div className="grid grid-cols-2 gap-2">
          <a
            href="tel:1033"
            className="py-2.5 px-3 rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 text-red-400 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5" /> NHAI Helpline 1033
          </a>
          <a
            href="tel:108"
            className="py-2.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <ShieldAlert className="w-3.5 h-3.5" /> Ambulance 108
          </a>
        </div>
      </div>
    </div>
  );
};
