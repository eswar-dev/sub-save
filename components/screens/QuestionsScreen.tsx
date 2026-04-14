'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/lib/store/quizStore'
import { Q2_OPTIONS_BY_Q1, Q1Answer } from '@/lib/scoring'
import { getLogoUrl, hashColor, formatINR } from '@/lib/data/apps'
import { track } from '@/lib/analytics'
import { getOptTintClass } from '@/lib/utils'

const Q1_OPTIONS: string[] = ['This week', 'This month', 'Over a month ago', "Can't remember"]

export default function QuestionsScreen() {
  const router = useRouter()
  const routerRef = useRef(router)
  routerRef.current = router
  const { cards, cardIndex, answers, totalSpend, selected, setAnswer, buildCards } = useQuizStore()
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({})
  const [showSwipeCue, setShowSwipeCue] = useState(true)
  const touchStartY = useRef<number | null>(null)
  const isAnimating = useRef(false)

  // Ensure cards are built
  useEffect(() => {
    if (cards.length === 0) buildCards()
  }, [cards.length, buildCards])

  // Hide swipe cue after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowSwipeCue(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const appCount = Object.keys(selected).length
  const currentCard = cards[cardIndex]

  function getQ2Options(appId: string): string[] {
    const q1 = answers[`${appId}-q1`] as Q1Answer | undefined
    if (!q1) return []
    return Q2_OPTIONS_BY_Q1[q1] ?? []
  }

  function getVisibleOptions(): string[] {
    if (!currentCard) return []
    if (currentCard.questionNum === 1) return Q1_OPTIONS
    return getQ2Options(currentCard.appId)
  }

  const advanceCard = useCallback(() => {
    if (isAnimating.current) return
    isAnimating.current = true

    const { cardIndex: idx, cards: c, computeResults } = useQuizStore.getState()
    const nextIdx = idx + 1

    if (nextIdx >= c.length) {
      // Done — go to calculating
      useQuizStore.setState({ cardIndex: nextIdx })
      computeResults()
      routerRef.current.push('/quiz/calculating')
      isAnimating.current = false
      return
    }

    // Skip Q2 if "Can't remember" was answered on Q1
    // Do NOT recurse — nextIdx+1 is always a Q1 card (fresh app), no further skipping needed
    const nextCard = c[nextIdx]
    if (nextCard?.questionNum === 2) {
      const q1Answer = useQuizStore.getState().answers[`${nextCard.appId}-q1`]
      if (q1Answer === "Can't remember") {
        useQuizStore.getState().setAnswer(`${nextCard.appId}-q2`, 'Rarely')
        useQuizStore.setState({ cardIndex: nextIdx + 1 })
        isAnimating.current = false
        return
      }
    }

    useQuizStore.setState({ cardIndex: nextIdx })
    setTimeout(() => { isAnimating.current = false }, 350)
  }, [])

  function handleAnswer(value: string) {
    if (!currentCard || isAnimating.current) return
    const key = `${currentCard.appId}-q${currentCard.questionNum}`
    setAnswer(key, value)
    track('question_answered', { app_id: currentCard.appId, question: `q${currentCard.questionNum}`, value })
    setTimeout(advanceCard, 110)
  }

  // Swipe-down to undo (touch only)
  function handleTouchStart(e: React.TouchEvent) {
    touchStartY.current = e.touches[0].clientY
  }
  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartY.current === null) return
    const delta = e.changedTouches[0].clientY - touchStartY.current
    touchStartY.current = null
    if (delta >= 55) {
      useQuizStore.getState().undoLastAnswer()
      track('question_undone', { app_id: currentCard?.appId })
    }
  }

  if (!currentCard) return null

  // Progress dots — one per app
  const appIds = cards
    .filter((c) => c.questionNum === 1)
    .map((c) => c.appId)

  function isAppDone(appId: string): boolean {
    return !!answers[`${appId}-q2`] ||
      (answers[`${appId}-q1`] === "Can't remember")
  }
  function isAppCurrent(appId: string): boolean {
    return currentCard.appId === appId
  }

  const isCustom = currentCard.appCustom
  const logoUrl = !isCustom ? getLogoUrl(currentCard.appDomain) : ''

  return (
    <div
      className="page-enter"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)' }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar */}
      <div style={{
        position: 'absolute', top: 44, left: 0, right: 0,
        padding: '12px 20px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        zIndex: 10,
      }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.45)',
            color: '#475569', fontSize: 13, fontWeight: 600,
            padding: '6px 13px', borderRadius: 100, cursor: 'pointer',
            backdropFilter: 'blur(10px)', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          ‹
        </button>

        {/* Progress dots */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {appIds.map((appId) => (
            <div
              key={appId}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: isAppDone(appId) ? '#2DD4BF' : 'transparent',
                border: `2px solid ${isAppDone(appId) ? '#2DD4BF' : isAppCurrent(appId) ? '#0F4C81' : 'rgba(15,76,129,0.18)'}`,
                transition: 'all 0.3s',
                boxShadow: isAppCurrent(appId) && !isAppDone(appId) ? '0 0 0 3px rgba(15,76,129,0.12)' : undefined,
              }}
            />
          ))}
        </div>

        {/* Mini counter */}
        <div style={{
          fontSize: 12, fontWeight: 800, color: '#0F4C81',
          background: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.5)',
          borderRadius: 100, padding: '4px 11px', backdropFilter: 'blur(10px)',
        }}>
          {formatINR(totalSpend)}/mo
        </div>
      </div>

      {/* Question card */}
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', padding: '104px 24px 40px' }}>
        {/* App block */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginBottom: 28 }}>
          {/* Colour tile always visible instantly; image fades in on top once loaded */}
          <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
            <div style={{
              position: 'absolute', inset: 0, borderRadius: 20,
              background: hashColor(currentCard.appId),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 26, fontWeight: 900, color: '#fff',
              boxShadow: '0 8px 28px rgba(15,76,129,0.12)',
            }}>
              {currentCard.appName[0]}
            </div>
            {!isCustom && !imgErrors[currentCard.appId] && (
              <img
                src={logoUrl}
                alt={currentCard.appName}
                width={64} height={64}
                style={{
                  position: 'absolute', inset: 0, borderRadius: 20,
                  objectFit: 'contain', background: '#fff', padding: 6,
                  boxShadow: '0 8px 28px rgba(15,76,129,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                }}
                onError={() => setImgErrors((prev) => ({ ...prev, [currentCard.appId]: true }))}
              />
            )}
          </div>
          <div style={{ fontSize: 11, color: '#475569', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {currentCard.appName}
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color: '#0F4C81',
            background: 'rgba(15,76,129,0.08)', borderRadius: 100, padding: '3px 10px',
          }}>
            ₹{currentCard.appPrice}/mo
          </div>
        </div>

        {/* Question + options — key+animation gives game-card-flip feel on each new card */}
        <div
          key={`${currentCard.appId}-q${currentCard.questionNum}`}
          style={{ animation: 'stagger-in 0.2s ease forwards', display: 'contents' }}
        >

        {/* Question */}
        <div style={{
          fontSize: 25, fontWeight: 800, color: '#1e293b',
          textAlign: 'center', lineHeight: 1.2, letterSpacing: '-0.6px', marginBottom: 20,
        }}>
          {currentCard.questionNum === 1
            ? `When did you last use ${currentCard.appName}?`
            : `How often do you use ${currentCard.appName}?`}
        </div>

        {/* Answer options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
          {getVisibleOptions().map((opt) => (
            <button
              key={opt}
              onClick={() => handleAnswer(opt)}
              className={getOptTintClass(opt)}
              style={{
                height: 54,
                backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
                border: '1.5px solid rgba(255,255,255,0.52)', borderRadius: 16,
                display: 'flex', alignItems: 'center', padding: '0 20px',
                fontSize: 15, color: '#1e293b', cursor: 'pointer', fontWeight: 600,
                boxShadow: '0 2px 8px rgba(15,76,129,0.04), inset 0 1px 0 rgba(255,255,255,0.65)',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 0.15s',
                textAlign: 'left', width: '100%',
              }}
            >
              {opt}
            </button>
          ))}
        </div>

        {/* Swipe cue */}
        {showSwipeCue && (
          <div className="swipe-fade" style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 14, fontWeight: 500 }}>
            ↓ Swipe to undo
          </div>
        )}

        </div>{/* end animated wrapper */}
      </div>
    </div>
  )
}
