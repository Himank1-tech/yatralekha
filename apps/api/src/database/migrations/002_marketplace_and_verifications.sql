-- Migration 002: Freight Marketplace, Call Logs, Statutory Verifications & POD Balance Claims

-- 1. Available Freight Marketplace / Load Board
CREATE TABLE IF NOT EXISTS freight_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  corridor_name VARCHAR(150),
  material_type VARCHAR(100) NOT NULL,
  weight_tonnes NUMERIC(8,2) NOT NULL,
  required_axle_type VARCHAR(50) NOT NULL, -- '10_WHEELER', '12_WHEELER', '16_WHEELER', 'TRAILER'
  body_type VARCHAR(50) DEFAULT 'DALA', -- 'DALA', 'CONTAINER', 'FLATBED', 'TANKER'
  offered_rate NUMERIC(12,2) NOT NULL,
  rate_type VARCHAR(20) DEFAULT 'PER_TONNE', -- 'PER_TONNE' or 'FIXED'
  advance_percent NUMERIC(5,2) DEFAULT 75.0,
  balance_payment_terms VARCHAR(100) DEFAULT 'Balance upon POD in 3 days',
  shipper_name VARCHAR(150) NOT NULL,
  shipper_phone VARCHAR(20) NOT NULL,
  is_verified_shipper BOOLEAN DEFAULT true,
  status VARCHAR(30) DEFAULT 'AVAILABLE', -- 'AVAILABLE', 'BOOKED', 'EXPIRED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Transporter Call Logs & Broker Interactions
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  contact_role VARCHAR(50) DEFAULT 'Broker', -- 'Broker', 'Driver', 'Shipper', 'Mandi Agent'
  phone_number VARCHAR(20) NOT NULL,
  lane_discussed VARCHAR(150),
  call_type VARCHAR(20) DEFAULT 'OUTGOING', -- 'INCOMING', 'OUTGOING', 'MISSED'
  duration_seconds INTEGER DEFAULT 0,
  deal_status VARCHAR(50) DEFAULT 'NEGOTIATING', -- 'RATE_CONFIRMED', 'RATE_TOO_LOW', 'POD_FOLLOWUP', 'EN_ROUTE'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Driver & Vehicle Government Verifications (VAHAN & Sarathi)
CREATE TABLE IF NOT EXISTS verified_entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  verification_type VARCHAR(30) NOT NULL, -- 'VAHAN_RC', 'SARATHI_DL', 'PAN_KYC', 'AADHAAR_KYC'
  identifier_number VARCHAR(100) NOT NULL,
  holder_name VARCHAR(150),
  verification_status VARCHAR(30) DEFAULT 'VERIFIED',
  payload JSONB,
  verified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Balance Bhaada (POD Escrow & Debt Recovery)
CREATE TABLE IF NOT EXISTS pod_balance_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID,
  broker_name VARCHAR(150) NOT NULL,
  broker_phone VARCHAR(20) NOT NULL,
  bilty_number VARCHAR(100),
  origin VARCHAR(100) NOT NULL,
  destination VARCHAR(100) NOT NULL,
  vehicle_number VARCHAR(50) NOT NULL,
  total_freight NUMERIC(12,2) NOT NULL,
  advance_paid NUMERIC(12,2) NOT NULL,
  balance_due NUMERIC(12,2) NOT NULL,
  unloading_date DATE NOT NULL,
  due_date DATE NOT NULL,
  recovery_status VARCHAR(30) DEFAULT 'PENDING', -- 'PENDING', 'OVERDUE', 'LEGAL_NOTICE_SENT', 'SETTLED'
  pod_document_url TEXT,
  dispute_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
