'use client'

import posthog from 'posthog-js'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  return localStorage.getItem('sps_session_id') ?? 'unknown'
}

export async function track(event: string, properties?: Record<string, unknown>): Promise<void> {
  const sessionId = getSessionId()

  // PostHog
  try {
    if (typeof window !== 'undefined') {
      posthog.capture(event, { session_id: sessionId, ...properties })
    }
  } catch {}

  // Supabase events (powers the admin dashboard)
  const payload = JSON.stringify({
    session_id: sessionId,
    event,
    properties: properties ?? {},
  })

  try {
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      navigator.sendBeacon('/api/events', payload)
    } else {
      fetch('/api/events', {
        method: 'POST',
        body: payload,
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch(() => {})
    }
  } catch {
    // analytics must never throw
  }
}
