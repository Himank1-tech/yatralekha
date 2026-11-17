import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { LiveTracking } from './pages/LiveTracking';
import { Trips } from './pages/Trips';
import { FuelAudit } from './pages/FuelAudit';
import { Vehicles } from './pages/Vehicles';
import { Compliance } from './pages/Compliance';
import { Ledger } from './pages/Ledger';
import { DocumentOcr } from './pages/DocumentOcr';
import { Corridors } from './pages/Corridors';
import { FreightBoard } from './pages/FreightBoard';
import { BalanceSentinel } from './pages/BalanceSentinel';
import { CallLogs } from './pages/CallLogs';
import { VisitingCard } from './pages/VisitingCard';

export function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="loads" element={<FreightBoard />} />
            <Route path="balance-sentinel" element={<BalanceSentinel />} />
            <Route path="call-logs" element={<CallLogs />} />
            <Route path="visiting-card" element={<VisitingCard />} />
            <Route path="tracking" element={<LiveTracking />} />
            <Route path="trips" element={<Trips />} />
            <Route path="fuel-audit" element={<FuelAudit />} />
            <Route path="vehicles" element={<Vehicles />} />
            <Route path="compliance" element={<Compliance />} />
            <Route path="ledger" element={<Ledger />} />
            <Route path="ocr" element={<DocumentOcr />} />
            <Route path="corridors" element={<Corridors />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
