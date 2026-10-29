import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Trips } from './pages/Trips';
import { FuelAudit } from './pages/FuelAudit';
import { Vehicles } from './pages/Vehicles';
import { Compliance } from './pages/Compliance';
import { Ledger } from './pages/Ledger';
import { DocumentOcr } from './pages/DocumentOcr';
import { Corridors } from './pages/Corridors';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
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
  );
}

export default App;
