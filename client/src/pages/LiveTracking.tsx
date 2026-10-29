import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Radio,
  Truck,
  Gauge,
  Fuel,
  Navigation,
  AlertTriangle,
  Play,
  Flame,
  User,
  Phone,
  RefreshCw,
  Terminal,
  Activity
} from 'lucide-react';
import { Badge } from '../components/Badge';
import { formatINR, formatKg } from '../utils/formatters';
import { api } from '../api/client';

// Custom SVG Truck Pin Icons for Leaflet
const createTruckIcon = (color: string, label: string) => {
  return L.divIcon({
    className: 'custom-truck-marker',
    html: `
      <div style="background-color: ${color}; width: 34px; height: 34px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 11px; font-family: sans-serif;">
        ${label}
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

const icon12W = createTruckIcon('#4f46e5', '12W');
const icon10W = createTruckIcon('#059669', '10W');
const icon16W = createTruckIcon('#d97706', '16W');
const iconAlert = createTruckIcon('#e11d48', '⚠️');

// Helper to center map smoothly
function MapRecenter({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
}

export const LiveTracking: React.FC = () => {
  const [fleet, setFleet] = useState<any[]>([]);
  const [selectedImei, setSelectedImei] = useState<string>('867530901234567');
  const [loading, setLoading] = useState(false);
  const [rawPacketLog, setRawPacketLog] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  const fetchFleet = async () => {
    try {
      const res = await api.get<{ success: boolean; data: any[] }>('/telematics/live-fleet');
      if (res.data) {
        setFleet(res.data);
      }
    } catch (err) {
      console.warn('Live fleet fetch error:', err);
    }
  };

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedTruck = fleet.find((t) => t.imei === selectedImei) || fleet[0];

  // Advance GPS waypoint simulation
  const handleSimulateStep = async () => {
    if (!selectedTruck) return;
    try {
      setIsSimulating(true);
      const res = await api.post<{ success: boolean; data: any }>('/telematics/simulate-step', {
        imei: selectedTruck.imei
      });

      if (res.data) {
        setFleet(fleet.map((t) => (t.imei === selectedTruck.imei ? res.data : t)));

        // Generate sample raw AIS-140 log
        const d = new Date();
        const dateStr = d.toISOString().slice(2, 10).replace(/-/g, '');
        const timeStr = d.toTimeString().slice(0, 8).replace(/:/g, '');
        const logLine = `$PKT,MIND,v2.1,NR,1,A,${res.data.imei},${res.data.registrationNumber.replace(/\s/g, '')},310.5,${res.data.headingDegrees},14,${dateStr},${timeStr},${res.data.latitude.toFixed(6)},N,${res.data.longitude.toFixed(6)},E,${res.data.speedKmh.toFixed(1)},${res.data.odometerKm},0001,0000,${res.data.fuelSensorLitres.toFixed(1)},0.0,Airtel*`;

        setRawPacketLog((prev) => [logLine, ...prev.slice(0, 8)]);
      }
    } catch (e: any) {
      alert(`Simulation error: ${e.message}`);
    } finally {
      setIsSimulating(false);
    }
  };

  // Simulate stationary fuel siphoning
  const handleSimulateSiphoning = async () => {
    if (!selectedTruck) return;
    try {
      const res = await api.post<{ success: boolean; data: any }>(
        '/telematics/simulate-siphoning',
        {
          imei: selectedTruck.imei,
          dropLitres: 25.0
        }
      );

      if (res.data) {
        setFleet(fleet.map((t) => (t.imei === selectedTruck.imei ? res.data : t)));
        const logLine = `[ALERT] Stationary Fuel Drop: 25.0L loss detected at 0 km/h on IMEI ${res.data.imei} (POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK)`;
        setRawPacketLog((prev) => [logLine, ...prev.slice(0, 8)]);
      }
    } catch (e: any) {
      alert(`Siphoning error: ${e.message}`);
    }
  };

  const mapCenter: [number, number] = selectedTruck
    ? [selectedTruck.latitude, selectedTruck.longitude]
    : [20.4851, 77.4892]; // Maharashtra Center

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Live Fleet GPS & Telematics Radar
            </h1>
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              AIS-140 Port 5179 Active
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time NMEA tracking along Hindu Hrudaysamrat Balasaheb Thackeray Maharashtra Samruddhi Mahamarg and NH 53.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSimulateStep}
            disabled={isSimulating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Advance Highway Route (3.0 km/L Burn)
          </button>
          <button
            onClick={handleSimulateSiphoning}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <Flame className="w-3.5 h-3.5" />
            Simulate 25L Dhaba Theft
          </button>
        </div>
      </div>

      {/* Main Grid: Map + Truck Telemetry Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Container (2 Cols) */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[600px]">
          <div className="p-3 bg-slate-900 text-slate-300 flex items-center justify-between text-xs px-4 border-b border-slate-800">
            <span className="font-semibold text-white flex items-center gap-2">
              <Navigation className="w-4 h-4 text-indigo-400" />
              Maharashtra Heavy Freight Corridors (Samruddhi Mahamarg & NH 53)
            </span>
            <span className="text-[11px] text-slate-400">
              Tracking: <strong className="text-white">{fleet.length} Active Heavy Trucks</strong>
            </span>
          </div>

          <div className="flex-1 relative">
            <MapContainer
              center={mapCenter}
              zoom={7}
              scrollWheelZoom={true}
              className="h-full w-full z-10"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <MapRecenter center={mapCenter} />

              {/* Render All Active Trucks on Map */}
              {fleet.map((t) => {
                const position: [number, number] = [t.latitude, t.longitude];
                const icon = t.siphoningAlert
                  ? iconAlert
                  : t.axleConfiguration === '16_WHEELER'
                  ? icon16W
                  : t.axleConfiguration === '12_WHEELER'
                  ? icon12W
                  : icon10W;

                return (
                  <React.Fragment key={t.imei}>
                    <Marker
                      position={position}
                      icon={icon}
                      eventHandlers={{
                        click: () => setSelectedImei(t.imei)
                      }}
                    >
                      <Popup>
                        <div className="text-xs space-y-1 font-sans">
                          <div className="font-bold text-slate-900">{t.registrationNumber}</div>
                          <div className="text-slate-500">{t.corridor}</div>
                          <div className="font-semibold text-indigo-700">
                            Speed: {t.speedKmh} km/h · Fuel: {t.fuelSensorLitres}L
                          </div>
                          <div className="text-[10px] text-slate-400">Driver: {t.driverName}</div>
                        </div>
                      </Popup>
                    </Marker>

                    {/* Historical Route Trail */}
                    {t.historyTrail && t.historyTrail.length > 1 && (
                      <Polyline
                        positions={t.historyTrail}
                        color={t.imei === selectedImei ? '#4f46e5' : '#94a3b8'}
                        weight={t.imei === selectedImei ? 4 : 2}
                        opacity={0.8}
                        dashArray={t.imei === selectedImei ? undefined : '5, 5'}
                      />
                    )}
                  </React.Fragment>
                );
              })}
            </MapContainer>
          </div>
        </div>

        {/* Selected Truck Telemetry Card (1 Col) */}
        <div className="space-y-4">
          {selectedTruck ? (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 space-y-4">
              {/* Truck Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Selected Fleet Asset
                  </span>
                  <h2 className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                    {selectedTruck.registrationNumber}
                  </h2>
                </div>
                <Badge
                  variant={
                    selectedTruck.siphoningAlert
                      ? 'rose'
                      : selectedTruck.ignitionOn
                      ? 'emerald'
                      : 'amber'
                  }
                >
                  {selectedTruck.siphoningAlert
                    ? 'THEFT ALERT'
                    : selectedTruck.ignitionOn
                    ? 'HIGHWAY IN-TRANSIT'
                    : 'STOPPED / DHABA'}
                </Badge>
              </div>

              {/* Siphoning Alert Banner if active */}
              {selectedTruck.siphoningAlert && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-900 text-xs leading-relaxed flex items-start gap-2">
                  <Flame className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{selectedTruck.alertMessage}</span>
                </div>
              )}

              {/* Corridor & Route */}
              <div className="text-xs space-y-1">
                <span className="text-slate-400 font-medium">Active Freight Corridor:</span>
                <div className="font-semibold text-slate-800">{selectedTruck.corridor}</div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Trip Ref: {selectedTruck.currentTripSerial}
                </div>
              </div>

              {/* Real-time Gauges */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Gauge className="w-3.5 h-3.5" />
                    <span>Speed</span>
                  </div>
                  <div className="text-xl font-bold text-slate-900">
                    {selectedTruck.speedKmh}{' '}
                    <span className="text-xs font-normal text-slate-500">km/h</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    Ignition: {selectedTruck.ignitionOn ? 'ON (Cruising)' : 'OFF'}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 text-xs mb-1">
                    <Fuel className="w-3.5 h-3.5" />
                    <span>Fuel Tank</span>
                  </div>
                  <div className="text-xl font-bold text-indigo-700">
                    {selectedTruck.fuelSensorLitres}{' '}
                    <span className="text-xs font-normal text-slate-500">L</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {selectedTruck.fuelPercentage}% of {selectedTruck.tankCapacityLitres}L Tank
                  </div>
                </div>
              </div>

              {/* Fuel Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>Tank Level</span>
                  <span>{selectedTruck.fuelPercentage}%</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      selectedTruck.siphoningAlert
                        ? 'bg-rose-500'
                        : selectedTruck.fuelPercentage < 25
                        ? 'bg-amber-500'
                        : 'bg-indigo-600'
                    }`}
                    style={{ width: `${selectedTruck.fuelPercentage}%` }}
                  />
                </div>
              </div>

              {/* Live Coordinates & Telematics Details */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Latitude / Longitude:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedTruck.latitude.toFixed(4)}°N, {selectedTruck.longitude.toFixed(4)}°E
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Odometer:</span>
                  <span className="font-mono font-semibold text-slate-900">
                    {selectedTruck.odometerKm.toLocaleString('en-IN')} km
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">AIS-140 IMEI Tag:</span>
                  <span className="font-mono text-slate-700">{selectedTruck.imei}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Driver:</span>
                  <span className="font-semibold text-slate-900">{selectedTruck.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact:</span>
                  <span className="font-mono text-indigo-700">{selectedTruck.driverPhone}</span>
                </div>
              </div>

              {/* Quick Truck Switcher */}
              <div>
                <span className="text-xs font-semibold text-slate-700 block mb-2">
                  Select Active Fleet Truck:
                </span>
                <div className="space-y-1.5">
                  {fleet.map((t) => (
                    <button
                      key={t.imei}
                      onClick={() => setSelectedImei(t.imei)}
                      className={`w-full p-2.5 rounded-lg border text-xs text-left flex items-center justify-between transition ${
                        t.imei === selectedImei
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-900 font-bold'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Truck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{t.registrationNumber}</span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-500">{t.speedKmh} km/h</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 bg-white rounded-xl border border-slate-200">
              Loading truck telemetry...
            </div>
          )}
        </div>
      </div>

      {/* Live AIS-140 Packet Stream Terminal */}
      <div className="bg-slate-950 text-slate-200 rounded-xl p-5 shadow-lg border border-slate-800 space-y-3 font-mono text-xs">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="font-bold text-white tracking-wide">
              Live AIS-140 Telemetry Stream (Port 5179 TCP Listener)
            </span>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
            Streaming Live Packets
          </span>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto">
          {rawPacketLog.length === 0 ? (
            <p className="text-slate-500 italic py-2">
              Awaiting tracker transmission. Click "Advance Highway Route" or "Simulate 25L Dhaba Theft" above to inject live packets.
            </p>
          ) : (
            rawPacketLog.map((log, idx) => (
              <div
                key={idx}
                className={`py-0.5 break-all ${
                  log.includes('ALERT') ? 'text-rose-400 font-bold' : 'text-emerald-400'
                }`}
              >
                <span className="text-slate-600 mr-2">[{new Date().toLocaleTimeString('en-IN')}]</span>
                {log}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
