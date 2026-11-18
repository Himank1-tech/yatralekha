import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ProtectedRoute } from './components/ProtectedRoute';
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
import { Auth } from './pages/Auth';
import { DriverTracking } from './pages/DriverTracking';
import { CreatorAdmin } from './pages/CreatorAdmin';

export function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LanguageProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Auth & Driver Mobile Tracking Routes */}
              <Route path="/login" element={<Auth />} />
              <Route path="/register" element={<Auth />} />
              <Route path="/driver-track/:tripToken" element={<DriverTracking />} />
              <Route path="/driver-track" element={<DriverTracking />} />

              {/* Main Super-App Dashboard Workspace Protected by Strict JWT Guard */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }
              >
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
                <Route path="creator-admin" element={<CreatorAdmin />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </LanguageProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
