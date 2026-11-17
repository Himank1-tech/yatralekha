-- ============================================================================
-- YATRA LEKHA - PRODUCTION POSTGRESQL SCHEMA MIGRATION: 003_multitenant_auth.sql
-- Multi-Tenant Authentication, User Workspaces, and RBAC Primitives
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "citext";

-- 1. Ensure organizations table has multi-tenant enterprise columns
DO $$
BEGIN
    -- Add company_name alias column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'company_name') THEN
        ALTER TABLE organizations ADD COLUMN company_name VARCHAR(255);
        UPDATE organizations SET company_name = name WHERE company_name IS NULL;
    END IF;

    -- Add hub_city alias column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'hub_city') THEN
        ALTER TABLE organizations ADD COLUMN hub_city VARCHAR(255);
        UPDATE organizations SET hub_city = hub_location WHERE hub_city IS NULL;
    END IF;

    -- Add gstin column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'gstin') THEN
        ALTER TABLE organizations ADD COLUMN gstin VARCHAR(30);
        UPDATE organizations SET gstin = pan_or_gst WHERE gstin IS NULL;
    END IF;

    -- Add pan column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'pan') THEN
        ALTER TABLE organizations ADD COLUMN pan VARCHAR(30);
    END IF;

    -- Add vault_pin_hash column for server-side PIN authentication
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'vault_pin_hash') THEN
        ALTER TABLE organizations ADD COLUMN vault_pin_hash VARCHAR(255) DEFAULT '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi'; -- default 'password'
    END IF;

    -- Add kyc_status column if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'organizations' AND column_name = 'kyc_status') THEN
        ALTER TABLE organizations ADD COLUMN kyc_status VARCHAR(30) DEFAULT 'VERIFIED';
    END IF;
END $$;

-- 2. Multi-Tenant User Accounts Table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(150) NOT NULL,
    email CITEXT UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'OWNER', -- 'OWNER', 'MUNIM', 'DRIVER'
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tag freight loads with the posting organization for marketplace ownership
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'freight_loads' AND column_name = 'posted_by_org_id') THEN
        ALTER TABLE freight_loads ADD COLUMN posted_by_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. Multi-Tenant Indexes for Fast Tenant Query Scoping
CREATE INDEX IF NOT EXISTS idx_users_org ON users(organization_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_vehicles_org ON vehicles(organization_id);
CREATE INDEX IF NOT EXISTS idx_trips_org ON trips(organization_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_org ON call_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_pod_claims_org ON pod_balance_claims(broker_phone);
CREATE INDEX IF NOT EXISTS idx_statutory_docs_org ON statutory_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_verified_entities_org ON verified_entities(organization_id);
CREATE INDEX IF NOT EXISTS idx_freight_loads_status ON freight_loads(status);
