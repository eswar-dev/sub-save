-- Beta access control tables
-- Run this in Supabase SQL editor before deploying the beta gate

-- Code-based access (shared code with usage cap)
create table if not exists beta_codes (
  code          text primary key,
  max_uses      int not null default 200,
  current_uses  int not null default 0,
  is_active     boolean not null default true,
  created_at    timestamptz default now()
);

-- Seed the beta code
insert into beta_codes (code, max_uses)
values ('SPS00', 200)
on conflict (code) do nothing;

-- Email-based access (personal invites, no cap)
create table if not exists invited_emails (
  email         text primary key,
  invited_by    text,               -- 'rahul', 'eswar', etc.
  used_at       timestamptz,        -- null until first access
  created_at    timestamptz default now()
);

-- Add invited emails here, e.g.:
-- insert into invited_emails (email, invited_by) values ('judge@buildathon.com', 'rahul');

-- To change the beta cap (no redeploy needed):
-- update beta_codes set max_uses = 400 where code = 'SPS00';

-- To deactivate the gate:
-- update beta_codes set is_active = false where code = 'SPS00';
