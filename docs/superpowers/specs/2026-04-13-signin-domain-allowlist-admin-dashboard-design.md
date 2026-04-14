# Sign-in Domain Allowlist + Admin Dashboard — Design Spec
_Date: 2026-04-13_

---

## Overview

Two features added on top of the existing email-only sign-in flow:

1. **Domain allowlist** — restrict sign-in to common personal email domains; redirect new (first-time) users to the quiz instead of showing an error.
2. **Admin dashboard** — a protected `/admin` page showing live metrics from the `sessions` table, accessible only to admin emails.

---

## Feature 1 — Sign-in Domain Allowlist + New User Redirect

### Allowed Domains

Hardcoded constant `ALLOWED_DOMAINS` (Set) in the API:

```
gmail.com, googlemail.com, outlook.com, hotmail.com, live.com,
yahoo.com, ymail.com, icloud.com, me.com, mac.com,
protonmail.com, pm.me, rediffmail.com, zoho.com, aol.com, msn.com
```

### API changes — `/api/auth/signin` (POST)

New response shape:

| Scenario | Response |
|---|---|
| Invalid email format | `{ allowed: false, found: false, error: 'Invalid email' }` 400 |
| Domain not in allowlist | `{ allowed: false, found: false, error: 'Please use a personal email' }` 400 |
| Domain allowed, no session | `{ allowed: true, found: false }` 200 |
| Domain allowed, session found | `{ allowed: true, found: true, session: { ... } }` 200 |

### SignInSheet changes

| Response | UI behaviour |
|---|---|
| `allowed: false` | Show error: "Please use a personal email (Gmail, Outlook, Yahoo, etc.)" |
| `allowed: true, found: false` | Save email to localStorage (`sps_email`), call `startQuizWithEmail(email)` on quiz store, close sheet |
| `allowed: true, found: true` | Existing behaviour — load session, show "Welcome back!" |

### Quiz store changes

Add `startQuizWithEmail(email: string)` action to `quizStore`:
- Sets `email` field on the store
- Resets quiz to the beginning (step 1 — App Select)
- Email is then used when the session is saved at results time, so results are attributed to the user

---

## Feature 2 — Admin Dashboard at `/admin`

### Access control

- Hardcoded `ADMIN_EMAILS` list: `['eswar@gmail.com']`
- Client-side guard: reads `sps_email` from localStorage; if not in `ADMIN_EMAILS` → redirect to `/`
- Server-side guard: `/api/admin/metrics` reads `x-admin-email` request header; if not in `ADMIN_EMAILS` → 403. **Server is the real authority.**

### API — `/api/admin/metrics` (GET)

Returns from the `sessions` table (via Supabase service client):

```ts
{
  summary: {
    total_sessions: number,
    unique_users: number,        // distinct non-null emails
    avg_savings: number,         // average of total_savings
    avg_spend: number,           // average of total_spend
  },
  top_apps_selected: { app_id: string, count: number }[],   // top 5
  top_apps_cancelled: { app_id: string, count: number }[],  // top 5
  sessions: {
    id: string,
    email: string | null,
    total_spend: number,
    total_savings: number,
    created_at: string,
    apps_selected: object,
  }[]   // all rows, ordered by created_at desc
}
```

Top apps are computed by flattening `apps_selected` jsonb across all sessions server-side (JS, not SQL) — no schema changes needed. "Most selected" = all apps across all sessions. "Most cancelled" = apps where `verdict === 'cancel'` in the AppResult object.

### Page — `app/admin/page.tsx`

Client component. Layout:

1. **Header** — "Admin Dashboard" + logged-in email
2. **Summary cards row** — Total Sessions | Unique Users | Avg Savings | Avg Spend
3. **Top Apps tables** — "Most Selected" (5 rows) | "Most Cancelled" (5 rows), side by side
4. **Sessions table** — columns: Email, Spend, Savings, Apps count, Date; ordered newest first; no pagination for MVP (full list)

Styling follows existing app design tokens (Plus Jakarta Sans, blue gradient palette).

---

## What's NOT in scope

- Pagination on sessions table (MVP — full list is fine)
- Admin sign-in flow (admin signs in via the existing sign-in sheet first)
- Multiple admin roles or permissions
- Exporting data (Supabase Studio covers this)
- Email digest / scheduled reports

---

## Files Changed

| File | Change |
|---|---|
| `app/api/auth/signin/route.ts` | Add domain check, update response shape |
| `components/sheets/SignInSheet.tsx` | Handle new response states |
| `lib/store/quizStore.ts` | Add `startQuizWithEmail` action |
| `app/api/admin/metrics/route.ts` | New — metrics API with admin guard |
| `app/admin/page.tsx` | New — admin dashboard page |
