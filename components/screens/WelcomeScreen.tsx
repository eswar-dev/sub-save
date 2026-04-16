'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { track } from '@/lib/analytics'
import SignInSheet from '@/components/sheets/SignInSheet'
import BetaGateSheet, { isBetaVerified } from '@/components/sheets/BetaGateSheet'

export default function WelcomeScreen() {
  const router = useRouter()
  const [signinOpen, setSigninOpen] = useState(false)
  const [betaOpen, setBetaOpen] = useState(false)

  function handleStart() {
    track('quiz_started')
    if (isBetaVerified()) {
      router.push('/quiz/apps')
    } else {
      setBetaOpen(true)
    }
  }

  return (
    <div
      className="flex flex-col page-enter"
      style={{
        position: 'absolute', inset: 0,
        padding: 'max(52px, calc(env(safe-area-inset-top, 0px) + 20px)) 24px max(40px, calc(env(safe-area-inset-bottom, 0px) + 20px))',
        background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)',
      }}
    >
      {/* Ambient blobs */}
      <div
        style={{
          position: 'absolute', top: 90, left: -50,
          width: 220, height: 220,
          background: 'radial-gradient(circle, rgba(45,212,191,0.22) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute', top: 200, right: -60,
          width: 240, height: 240,
          background: 'radial-gradient(circle, rgba(15,76,129,0.13) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }}
      />

      {/* Brand badge */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.55)',
        borderRadius: 100, padding: '6px 14px',
        fontSize: 10, fontWeight: 800, color: '#0F4C81',
        letterSpacing: '0.06em', textTransform: 'uppercase',
        backdropFilter: 'blur(12px)', width: 'fit-content',
        boxShadow: '0 2px 8px rgba(15,76,129,0.08)',
      }}>
        <span style={{
          width: 7, height: 7, background: '#2DD4BF', borderRadius: '50%',
          animation: 'pulse-dot 2s ease-in-out infinite',
          display: 'inline-block',
        }} />
        SubSmart
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18, paddingTop: 6, position: 'relative', zIndex: 1 }}>
        {/* Headline */}
        <h1 style={{
          fontSize: 40, fontWeight: 800, color: '#1e293b',
          lineHeight: 1.04, letterSpacing: '-1.8px',
        }}>
          You&apos;re probably{' '}
          <span className="gradient-text">paying</span>{' '}
          for apps you forgot you had.
        </h1>

        {/* Sub-copy */}
        <p style={{ fontSize: 15, color: '#475569', lineHeight: 1.65, fontWeight: 500 }}>
          Find out in 90 seconds. No login. No bank access.
        </p>

        {/* Trust pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.45)',
          borderRadius: 14, padding: '10px 14px',
          backdropFilter: 'blur(12px)', boxShadow: '0 2px 10px rgba(15,76,129,0.06)',
        }}>
          <span style={{ fontSize: 20 }}>🔒</span>
          <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}>
            <strong style={{ color: '#1e293b' }}>Safe · Private · Free</strong>
          </span>
        </div>

        {/* How it works */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {[
            { icon: '📱', text: 'Pick your apps' },
            { icon: '❓', text: 'Answer 2 quick Qs' },
            { icon: '✂️', text: 'See what to cut' },
          ].map((step, i, arr) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 50, height: 50,
                  background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.55)',
                  borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 22, backdropFilter: 'blur(10px)',
                  boxShadow: '0 4px 14px rgba(15,76,129,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}>
                  {step.icon}
                </div>
                <span style={{ fontSize: 10, color: '#475569', textAlign: 'center', lineHeight: 1.3, fontWeight: 700 }}>
                  {step.text}
                </span>
              </div>
              {i < arr.length - 1 && (
                <span style={{ fontSize: 18, color: '#94a3b8', paddingBottom: 22, flexShrink: 0 }}>→</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={handleStart}
          style={{
            width: '100%', height: 56,
            background: 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 16, fontWeight: 700, cursor: 'pointer',
            letterSpacing: '-0.2px',
            boxShadow: '0 8px 24px rgba(15,76,129,0.28), inset 0 1px 0 rgba(255,255,255,0.2)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            transition: 'transform 0.12s, box-shadow 0.12s',
          }}
          onMouseDown={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
          onMouseUp={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
          onTouchStart={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(0.96)' }}
          onTouchEnd={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)' }}
        >
          Check what I&apos;m overpaying →
        </button>

        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontWeight: 500 }}>
          Free · No account · Takes 90 seconds
        </p>

        <button
          onClick={() => setSigninOpen(true)}
          style={{
            textAlign: 'center', fontSize: 13, color: '#0F4C81', fontWeight: 600,
            background: 'none', border: 'none', cursor: 'pointer',
            textDecoration: 'underline', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          Already done this? Sign in →
        </button>
      </div>

      {/* Sign-in sheet */}
      <SignInSheet open={signinOpen} onClose={() => setSigninOpen(false)} />

      {/* Beta gate sheet */}
      <BetaGateSheet open={betaOpen} onClose={() => setBetaOpen(false)} />
    </div>
  )
}
