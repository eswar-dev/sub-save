-- SubSmart OTP codes table
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
