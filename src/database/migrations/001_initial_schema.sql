-- ============================================================================
-- YATRA LEKHA - PRODUCTION POSTGRESQL SCHEMA MIGRATION: 001_initial_schema.sql
-- Indian Heavy-Haul Commercial Fleet Operating System
-- Permissive, Multi-Tenant, Auditable Relational Architecture
-- ============================================================================

-- Enable UUID extension for cryptographically secure, collision-resistant primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE axle_configuration_enum AS ENUM (
    '10_WHEELER', -- 6x2: ~28.0 MT GVW, ~9.0 MT Tare, ~19.0 MT Legal Payload
    '12_WHEELER', -- 8x2 / Lift-axle: ~35.0-36.0 MT GVW, ~11.0 MT Tare, ~24.0 MT Legal Payload
    '16_WHEELER'  -- Multi-axle / Twin-steer: ~47.5 MT GVW, ~30.0 MT Legal Payload
);

CREATE TYPE document_type_enum AS ENUM (
    'PERMIT',    -- All India Permit (AIP) 5-year cycle
    'FITNESS',   -- VAHAN Form 38 (2-year < 8yo, 1-year >= 8yo)
    'INSURANCE', -- Comprehensive / Third-party commercial policy
    'ROAD_TAX',  -- State MV Tax (Quarterly / Annual)
    'PUC'        -- Pollution Under Control (6-month cycle)
);

CREATE TYPE freight_rate_type_enum AS ENUM (
    'PER_TONNE',
    'FIXED'
);

CREATE TYPE pod_clearance_status_enum AS ENUM (
    'PENDING',
    'SUBMITTED',
    'VERIFIED',
    'DEFAULTED'
);

CREATE TYPE expense_category_enum AS ENUM (
    'DIESEL',
    'TOLL_FASTAG',
    'DRIVER_BHATTA',
    'HAMALI',
    'RTO_POLICE_CHIT',
    'MAINTENANCE'
);

CREATE TYPE payment_source_enum AS ENUM (
    'CASH',
    'PUMP_CREDIT_PARCHI',
    'FASTAG_WALLET'
);

CREATE TYPE compliance_alert_tier_enum AS ENUM (
    '30_DAYS',
    '15_DAYS',
    '3_DAYS',
    'EXPIRED'
);

CREATE TYPE account_classification_enum AS ENUM (
    'ASSET',
    'LIABILITY',
    'EQUITY',
    'REVENUE',
    'EXPENSE'
);

-- ============================================================================
-- 1. TENANT / ORGANIZATIONS
-- ============================================================================

CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    pan_or_gst VARCHAR(30) NOT NULL UNIQUE,
    hub_location VARCHAR(255) NOT NULL, -- e.g. "Nagpur, Maharashtra"
    contact_phone VARCHAR(20) NOT NULL,
    contact_email CITEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_org_pan_gst ON organizations(pan_or_gst);

-- ============================================================================
-- 2. FLEET ASSETS / VEHICLES
-- ============================================================================

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    registration_number VARCHAR(20) NOT NULL, -- e.g. "MH 40 AK 1234"
    chassis_number VARCHAR(50) NOT NULL,
    engine_number VARCHAR(50) NOT NULL,
    axle_configuration axle_configuration_enum NOT NULL,
    
    -- Weight limits in Kilograms for precise legal weighbridge enforcement
    tare_weight_kg NUMERIC(10, 2) NOT NULL CHECK (tare_weight_kg > 0),
    gross_vehicle_weight_kg NUMERIC(10, 2) NOT NULL CHECK (gross_vehicle_weight_kg > tare_weight_kg),
    max_legal_payload_kg NUMERIC(10, 2) GENERATED ALWAYS AS (gross_vehicle_weight_kg - tare_weight_kg) STORED,

    -- Capital Debt & Amortization
    vehicle_purchase_date DATE,
    monthly_emi NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_emi >= 0),
    loan_tenure_months INTEGER DEFAULT 48 CHECK (loan_tenure_months >= 0),
    loan_down_payment NUMERIC(12, 2) DEFAULT 0.00 CHECK (loan_down_payment >= 0),
    crew_monthly_payroll NUMERIC(12, 2) NOT NULL DEFAULT 17000.00 CHECK (crew_monthly_payroll >= 0), -- Driver ₹12k + Cleaner ₹5k
    annual_insurance_tax NUMERIC(12, 2) NOT NULL DEFAULT 60000.00 CHECK (annual_insurance_tax >= 0),

    -- Telematics Ingestion Binding
    ais140_imei VARCHAR(20) UNIQUE,
    current_driver_name VARCHAR(120),
    current_driver_phone VARCHAR(20),

    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_vehicle_reg_org UNIQUE (organization_id, registration_number)
);

CREATE INDEX idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX idx_vehicles_imei ON vehicles(ais140_imei);
CREATE INDEX idx_vehicles_reg ON vehicles(registration_number);

-- ============================================================================
-- 3. STATUTORY COMPLIANCE DOCUMENTS
-- ============================================================================

CREATE TABLE statutory_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    document_type document_type_enum NOT NULL,
    document_number VARCHAR(100),
    issue_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    
    -- Encrypted file storage and Mahavitran-style PIN/password hash access
    encrypted_file_storage_path TEXT NOT NULL,
    pin_hash VARCHAR(255) NOT NULL, -- Scrypt/bcrypt hash of retrieval PIN
    pin_salt VARCHAR(64) NOT NULL,
    mime_type VARCHAR(100) DEFAULT 'application/pdf',
    file_size_bytes BIGINT,

    ocr_extracted_text TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    verified_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_doc_dates CHECK (expiry_date >= issue_date)
);

CREATE INDEX idx_stat_docs_vehicle ON statutory_documents(vehicle_id);
CREATE INDEX idx_stat_docs_expiry ON statutory_documents(expiry_date);
CREATE INDEX idx_stat_docs_type ON statutory_documents(document_type);

-- ============================================================================
-- 4. TRIPS & KHATA LIFECYCLE
-- ============================================================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE RESTRICT,
    trip_serial_number VARCHAR(50) NOT NULL, -- e.g. "TRIP-2026-NGP-PUN-001"
    
    origin VARCHAR(150) NOT NULL,
    destination VARCHAR(150) NOT NULL,
    corridor_distance_km NUMERIC(8, 2) NOT NULL CHECK (corridor_distance_km > 0),
    actual_odometer_start_km NUMERIC(10, 2),
    actual_odometer_end_km NUMERIC(10, 2),
    
    -- Weight & Dharam Kanta Weighbridge Verification
    billed_weight_tonnes NUMERIC(8, 3) NOT NULL CHECK (billed_weight_tonnes > 0),
    rate_type freight_rate_type_enum NOT NULL DEFAULT 'PER_TONNE',
    freight_rate NUMERIC(12, 2) NOT NULL CHECK (freight_rate > 0),
    gross_freight_amount NUMERIC(14, 2) NOT NULL CHECK (gross_freight_amount >= 0),
    
    -- Advance vs POD Khata Split
    advance_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (advance_amount >= 0),
    balance_pod_due NUMERIC(14, 2) NOT NULL DEFAULT 0.00 CHECK (balance_pod_due >= 0),
    pod_clearance_status pod_clearance_status_enum NOT NULL DEFAULT 'PENDING',
    pod_submission_date DATE,
    pod_settlement_date DATE,
    pod_document_path TEXT,

    -- Risk flags
    overload_risk_flag BOOLEAN NOT NULL DEFAULT false,
    overload_excess_kg NUMERIC(10, 2) DEFAULT 0.00,

    started_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_trip_serial_org UNIQUE (organization_id, trip_serial_number),
    CONSTRAINT chk_gross_split CHECK (gross_freight_amount = (advance_amount + balance_pod_due))
);

CREATE INDEX idx_trips_org ON trips(organization_id);
CREATE INDEX idx_trips_vehicle ON trips(vehicle_id);
CREATE INDEX idx_trips_pod_status ON trips(pod_clearance_status);
CREATE INDEX idx_trips_dates ON trips(started_at, completed_at);

-- ============================================================================
-- 5. TRIP EXPENSES & KHARCHA TRACKING
-- ============================================================================

CREATE TABLE trip_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    expense_category expense_category_enum NOT NULL,
    payment_source payment_source_enum NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    transaction_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Specific audit details for diesel fuel slips (Parchi)
    fuel_litres NUMERIC(8, 2) CHECK (fuel_litres IS NULL OR fuel_litres > 0),
    fuel_rate_per_litre NUMERIC(8, 2) CHECK (fuel_rate_per_litre IS NULL OR fuel_rate_per_litre > 0),
    pump_station_name VARCHAR(150),
    pump_slip_number VARCHAR(100),

    receipt_hash VARCHAR(128),
    receipt_document_path TEXT,
    notes TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_expenses_trip ON trip_expenses(trip_id);
CREATE INDEX idx_expenses_category ON trip_expenses(expense_category);
CREATE INDEX idx_expenses_payment_src ON trip_expenses(payment_source);

-- ============================================================================
-- 6. TELEMATICS PINGS (AIS-140 HIGH-FREQUENCY INGESTION)
-- ============================================================================

CREATE TABLE telematics_pings (
    id BIGSERIAL PRIMARY KEY,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    imei VARCHAR(20) NOT NULL,
    packet_timestamp TIMESTAMPTZ NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed_kmh NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    heading_deg NUMERIC(5, 2) DEFAULT 0.00,
    odometer_km NUMERIC(12, 2),
    ignition_status BOOLEAN NOT NULL DEFAULT false,
    fuel_sensor_litres NUMERIC(8, 2),
    digital_inputs VARCHAR(32),
    raw_packet_payload TEXT,
    is_gps_valid BOOLEAN NOT NULL DEFAULT true,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_telematics_veh_time ON telematics_pings(vehicle_id, packet_timestamp DESC);
CREATE INDEX idx_telematics_imei_time ON telematics_pings(imei, packet_timestamp DESC);

-- ============================================================================
-- 7. DOUBLE-ENTRY LEDGER (INTEGER PAISE EXACT ARITHMETIC)
-- ============================================================================

CREATE TABLE ledger_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL, -- e.g. "1010-CASH", "2010-PAYABLE-DIESEL-PUMP"
    name VARCHAR(150) NOT NULL,
    classification account_classification_enum NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_account_code_org UNIQUE (organization_id, code)
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE SET NULL,
    entry_number VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    entry_timestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_journal_entry_no UNIQUE (organization_id, entry_number)
);

CREATE TABLE journal_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    journal_entry_id UUID NOT NULL REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID NOT NULL REFERENCES ledger_accounts(id) ON DELETE RESTRICT,
    debit_paise BIGINT NOT NULL DEFAULT 0 CHECK (debit_paise >= 0),
    credit_paise BIGINT NOT NULL DEFAULT 0 CHECK (credit_paise >= 0),
    memo VARCHAR(255),

    CONSTRAINT chk_line_has_movement CHECK (debit_paise > 0 OR credit_paise > 0),
    CONSTRAINT chk_line_exclusive CHECK (
        (debit_paise > 0 AND credit_paise = 0) OR
        (credit_paise > 0 AND debit_paise = 0)
    )
);

CREATE INDEX idx_journal_lines_entry ON journal_lines(journal_entry_id);
CREATE INDEX idx_journal_lines_account ON journal_lines(account_id);

-- ============================================================================
-- 8. COMPLIANCE & AUDIT LOGS
-- ============================================================================

CREATE TABLE compliance_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    statutory_document_id UUID NOT NULL REFERENCES statutory_documents(id) ON DELETE CASCADE,
    alert_tier compliance_alert_tier_enum NOT NULL,
    days_to_expiry INTEGER NOT NULL,
    is_resolved BOOLEAN NOT NULL DEFAULT false,
    resolved_at TIMESTAMPTZ,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_compliance_alerts_active ON compliance_alerts(organization_id, is_resolved);

CREATE TABLE fuel_audit_discrepancies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    distance_run_km NUMERIC(8, 2) NOT NULL,
    fuel_consumed_litres NUMERIC(8, 2) NOT NULL,
    actual_mileage_kmpl NUMERIC(6, 2) NOT NULL,
    benchmark_mileage_kmpl NUMERIC(6, 2) NOT NULL DEFAULT 3.00,
    discrepancy_litres NUMERIC(8, 2) NOT NULL,
    alert_flag VARCHAR(80) NOT NULL, -- e.g. "POTENTIAL_FUEL_SIPHON_OR_IDLE_LEAK"
    telematics_start_fuel NUMERIC(8, 2),
    telematics_end_fuel NUMERIC(8, 2),
    pump_slips_total_litres NUMERIC(8, 2),
    detected_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_fuel_audit_trip ON fuel_audit_discrepancies(trip_id);
