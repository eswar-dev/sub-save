'use client'

import { useEffect, useState } from 'react'

export default function DesktopBlock({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth > 1024)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Allow full viewport in dev for easier testing
  const isDev = process.env.NODE_ENV === 'development'

  if (isDesktop && !isDev) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(150deg, #dbeafe 0%, #e8f4fd 45%, #d4f6ef 100%)',
        fontFamily: 'Plus Jakarta Sans, -apple-system, sans-serif',
        padding: '40px 24px',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 56, marginBottom: 20 }}>📱</div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#1e293b', marginBottom: 10 }}>
          Built for phones &amp; tablets
        </div>
        <div style={{ fontSize: 15, color: '#475569', fontWeight: 500, maxWidth: 380, lineHeight: 1.7 }}>
          SubSmart is designed for mobile. Open this link on your phone or tablet to get started.
        </div>
        <div style={{
          marginTop: 28, fontSize: 14, fontWeight: 700,
          background: 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          subsmart.app
        </div>
      </div>
    )
  }

  return <>{children}</>
}
