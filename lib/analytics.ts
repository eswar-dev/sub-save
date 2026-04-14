'use client'

function getSessionId(): string {
  if (typeof window === 'undefined') return 'ssr'
  return localStorage.getItem('sps_session_id') ?? 'unknown'
}

export async function track(event: string, properties?: Record<string, unknown>): Promise<void> {
  const payload = JSON.stringify({
    session_id: getSessionId(),
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
