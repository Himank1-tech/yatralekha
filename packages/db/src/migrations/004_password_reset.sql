-- ============================================================================
-- YATRA LEKHA - PRODUCTION POSTGRESQL SCHEMA MIGRATION: 004_password_reset.sql
-- Password Reset OTP & Expiry Timestamp Columns
-- ============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_otp') THEN
        ALTER TABLE users ADD COLUMN reset_otp VARCHAR(20);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'reset_otp_expires') THEN
        ALTER TABLE users ADD COLUMN reset_otp_expires TIMESTAMPTZ;
    END IF;
END $$;
