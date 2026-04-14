'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/lib/store/quizStore'
import { track } from '@/lib/analytics'

const MESSAGES = [
  'Analysing usage patterns',
  'Checking frequency scores',
  'Comparing against real prices',
  'Identifying hidden waste',
  'Building your verdict',
]

const DELAY_MS = 2800

export default function CalculatingScreen() {
  const router = useRouter()
  const { selected } = useQuizStore()
  const [msgIdx, setMsgIdx] = useState(0)
  const appNames = Object.values(selected).map((a) => a.name)

  useEffect(() => {
    setMsgIdx(0)

    const interval = setInterval(() => {
      setMsgIdx((i) => (i + 1) % MESSAGES.length)
    }, 500)

    const timeout = setTimeout(() => {
      clearInterval(interval)
      track('results_viewed')
      router.push('/quiz/results')
    }, DELAY_MS)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [router])

  return (
    <div
      className="flex flex-col items-center justify-center"
      style={{
        position: 'absolute', inset: 0,
        padding: 24,
        background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)',
      }}
    >
      <div style={{
        background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        border: '1px solid rgba(255,255,255,0.55)', borderRadius: 32,
        padding: '44px 32px', width: '100%',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 22,
        boxShadow: '0 12px 48px rgba(15,76,129,0.1), inset 0 1px 0 rgba(255,255,255,0.7)',
      }}>
        {/* Spinner */}
        <div
          className="animate-spin-ring"
          style={{
            width: 64, height: 64,
            border: '4px solid rgba(15,76,129,0.1)',
            borderTopColor: '#0F4C81', borderRightColor: '#2DD4BF',
            borderRadius: '50%',
          }}
        />

        <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', letterSpacing: '-0.3px', textAlign: 'center' }}>
          Crunching your subscriptions…
        </div>

        <div style={{
          fontSize: 14, color: '#475569', textAlign: 'center', fontWeight: 500, minHeight: 20,
          transition: 'opacity 0.4s',
        }}>
          {MESSAGES[msgIdx]}
        </div>

        {/* App chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, justifyContent: 'center' }}>
          {appNames.map((name) => (
            <div key={name} style={{
              background: 'rgba(15,76,129,0.07)', border: '1px solid rgba(15,76,129,0.12)',
              borderRadius: 100, padding: '4px 12px',
              fontSize: 11, fontWeight: 700, color: '#0F4C81',
            }}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
