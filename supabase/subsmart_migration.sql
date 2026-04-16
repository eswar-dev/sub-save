-- SubSmart V2 Migration
-- Run this entire file in Supabase SQL Editor
-- Project: eswar-dev/sub-save (same project as before)

-- ─── OTP CODES TABLE ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  code        TEXT NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS otp_codes_email_idx   ON otp_codes(email, created_at DESC);
CREATE INDEX IF NOT EXISTS otp_codes_expires_idx ON otp_codes(expires_at);

-- ─── VERIFY EXISTING TABLES INTACT ───────────────────────────────────
-- Expected: sessions, events, beta_codes, invited_emails, otp_codes
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ─── CLEANUP (run manually as needed) ────────────────────────────────
-- DELETE FROM otp_codes WHERE used = TRUE OR expires_at < NOW() - INTERVAL '1 hour';

-- ─── SENDGRID SETUP (Eswar to action) ────────────────────────────────
-- 1. Create SendGrid account at sendgrid.com
-- 2. Verify a sender domain or single sender email
-- 3. Generate an API key with "Mail Send" permission
-- 4. Add to Vercel environment variables:
--      SENDGRID_API_KEY    = SG.xxxxxxxxxx
--      SENDGRID_FROM_EMAIL = noreply@yourdomain.com  (must be verified sender)
-- 5. Add to .env.local for local dev (same values)
--
-- Test locally after setup:
--   curl -X POST http://localhost:3000/api/auth/send-otp \
--     -H "Content-Type: application/json" \
--     -d '{"email":"your@test.com"}'
-- Expected: {"ok":true} and a code email in inbox within ~30s
