-- SubSmart — Supabase Schema
-- Run this in Supabase SQL Editor to set up the database

-- ─── SESSIONS TABLE ───────────────────────────────────────────────
-- One row per quiz run. The "user record" for SubSmart.
CREATE TABLE IF NOT EXISTS sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id       TEXT NOT NULL,          -- anonymous localStorage ID (format: sps_<ts>_<rand>)
  email            TEXT,                   -- null until user registers/signs in
  apps_selected    JSONB NOT NULL,         -- array of AppResult objects (see system.md §4)
  total_spend      INTEGER NOT NULL,       -- total monthly spend in ₹
  total_savings    INTEGER NOT NULL,       -- potential monthly savings (cancel-verdict sum) in ₹
  reminder_paid    BOOLEAN DEFAULT FALSE,  -- true after ₹49 Razorpay payment confirmed
  feedback_rating  INTEGER,               -- 1–5 star rating (from feedback card)
  feedback_text    TEXT,                  -- optional free-text feedback
  feedback_meta    JSONB,                  -- { decision, rating, text, recommend }
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS sessions_email_idx      ON sessions(email, created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_session_id_idx ON sessions(session_id);
CREATE INDEX IF NOT EXISTS sessions_created_at_idx ON sessions(created_at DESC);

-- ─── EVENTS TABLE ─────────────────────────────────────────────────
-- Raw funnel event stream for drop-off analysis.
CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  TEXT NOT NULL,
  event       TEXT NOT NULL,    -- e.g. 'quiz_started', 'app_selected', 'results_viewed'
  properties  JSONB DEFAULT '{}',
  ts          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS events_session_id_idx ON events(session_id);
CREATE INDEX IF NOT EXISTS events_event_idx      ON events(event);
CREATE INDEX IF NOT EXISTS events_ts_idx         ON events(ts DESC);

-- ─── USEFUL ANALYTICS QUERIES ─────────────────────────────────────

-- Funnel: quiz_started → results_viewed rate
-- SELECT
--   COUNT(DISTINCT CASE WHEN event = 'quiz_started'  THEN session_id END) AS started,
--   COUNT(DISTINCT CASE WHEN event = 'results_viewed' THEN session_id END) AS completed,
--   ROUND(
--     100.0 * COUNT(DISTINCT CASE WHEN event = 'results_viewed' THEN session_id END)
--     / NULLIF(COUNT(DISTINCT CASE WHEN event = 'quiz_started' THEN session_id END), 0)
--   ) AS completion_pct
-- FROM events;

-- Average savings per session
-- SELECT AVG(total_savings) FROM sessions WHERE total_savings > 0;

-- Daily unique sessions
-- SELECT DATE(created_at), COUNT(*) FROM sessions GROUP BY 1 ORDER BY 1 DESC;

-- Gate conversion
-- SELECT
--   COUNT(DISTINCT CASE WHEN event = 'bell_tapped' THEN session_id END) AS bell_taps,
--   COUNT(DISTINCT CASE WHEN event = 'payment_completed' THEN session_id END) AS payments
-- FROM events;
