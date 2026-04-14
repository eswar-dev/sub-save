'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useQuizStore } from '@/lib/store/quizStore'
import { APPS, CATEGORIES, App, getLogoUrl, hashColor, formatINR } from '@/lib/data/apps'
import { track } from '@/lib/analytics'
import PlanPickerSheet from '@/components/sheets/PlanPickerSheet'
import ManualEntrySheet from '@/components/sheets/ManualEntrySheet'

const MAX_APPS = 10
const MAX_CUSTOM = 5

export default function AppSelectScreen() {
  const router = useRouter()
  const { selected, totalSpend, selectApp, deselectApp, buildCards, resetAnswers, cards } = useQuizStore()
  const [planApp, setPlanApp] = useState<App | null>(null)
  const [manualOpen, setManualOpen] = useState(false)
  const [popCounter, setPopCounter] = useState(false)
  const [activeCat, setActiveCat] = useState<string>('streaming')
  const scrollRef = useRef<HTMLDivElement>(null)
  const pillStripRef = useRef<HTMLDivElement>(null)
  const prevSpend = useRef(totalSpend)

  const selectedCount = Object.keys(selected).length
  const customCount = Object.values(selected).filter((a) => a.custom).length
  const isCapped = selectedCount >= MAX_APPS

  // Pop animation on counter change
  useEffect(() => {
    if (totalSpend !== prevSpend.current) {
      setPopCounter(true)
      prevSpend.current = totalSpend
      const t = setTimeout(() => setPopCounter(false), 280)
      return () => clearTimeout(t)
    }
  }, [totalSpend])

  // Scroll-spy: watch category sections, update active pill, auto-scroll pill strip
  useEffect(() => {
    const sections = CATEGORIES
      .filter((c) => c.id !== 'other')
      .map((c) => document.getElementById(`cat-section-${c.id}`))
      .filter((el): el is HTMLElement => !!el)
    if (sections.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)
        if (visible.length > 0) {
          const id = visible[0].target.id.replace('cat-section-', '')
          setActiveCat(id)
          const pill = pillStripRef.current?.querySelector<HTMLButtonElement>(`[data-pill="${id}"]`)
          pill?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
        }
      },
      { root: scrollRef.current, rootMargin: '-20% 0px -70% 0px', threshold: [0, 0.1, 0.5] },
    )
    sections.forEach((s) => observer.observe(s))
    return () => observer.disconnect()
  }, [])

  // All apps including custom ones from selected
  const customApps = Object.values(selected).filter((a) => a.custom)
  const allApps = [...APPS, ...customApps.filter((c) => !APPS.find((a) => a.id === c.id))]

  function scrollToCategory(catId: string) {
    const el = document.getElementById(`cat-section-${catId}`)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleAppTap(app: App) {
    if (selected[app.id]) {
      deselectApp(app.id)
      track('app_deselected', { app_id: app.id })
      return
    }
    if (isCapped) return
    if (app.multi && app.plans?.length) {
      setPlanApp(app)
    } else {
      selectApp(app, app.price)
      track('app_selected', { app_id: app.id, price: app.price })
    }
  }

  function handlePlanSelect(app: App, price: number) {
    selectApp(app, price)
    track('plan_selected', { app_id: app.id, price })
    setPlanApp(null)
  }

  function handleContinue() {
    // Only rebuild cards + wipe answers if the selection changed since last quiz build.
    // Preserves cardIndex + answers when user taps Back from Questions to tweak apps.
    const selectedIds = Object.keys(selected).sort().join('|')
    const builtIds = cards.filter((c) => c.questionNum === 1).map((c) => c.appId).sort().join('|')
    if (selectedIds !== builtIds) {
      resetAnswers()
      buildCards()
    }
    router.push('/quiz/questions')
    track('questions_started', { app_count: selectedCount, total_spend: totalSpend })
  }

  const counterHot = totalSpend >= 500

  return (
    <div className="flex flex-col"
      style={{ position: 'absolute', inset: 0, background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)' }}
    >
      {/* Sticky header */}
      <div style={{
        flexShrink: 0, padding: '52px 20px 0',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
        borderBottom: '1px solid rgba(255,255,255,0.45)',
        position: 'relative', zIndex: 10,
      }}>
        {/* Back button */}
        <button
          onClick={() => router.back()}
          style={{
            position: 'absolute', top: 56, left: 16, zIndex: 20,
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.45)',
            color: '#475569', fontSize: 13, fontWeight: 600,
            padding: '6px 13px', borderRadius: 100, cursor: 'pointer',
            backdropFilter: 'blur(10px)', fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          ‹
        </button>

        {/* Counter */}
        <div style={{ padding: '14px 0 10px', paddingLeft: 44 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
            YOUR MONTHLY SPEND
          </div>
          <div
            className={popCounter ? 'animate-pop' : ''}
            style={{
              fontSize: 38, fontWeight: 800,
              letterSpacing: '-1.5px', lineHeight: 1,
              display: 'flex', alignItems: 'baseline', gap: 1,
              ...(counterHot ? {
                background: 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              } : { color: '#0F4C81' }),
            }}
          >
            {formatINR(totalSpend)}<sup style={{ fontSize: 14, fontWeight: 600 }}>/mo</sup>
          </div>
          <div style={{ fontSize: 12, color: '#475569', marginTop: 4, fontWeight: 500 }}>
            {selectedCount === 0 ? 'Tap apps to see your total' : isCapped ? '10 apps selected (maximum reached)' : `${selectedCount} app${selectedCount !== 1 ? 's' : ''} selected`}
          </div>
        </div>

        {/* Pill strip */}
        <div className="pill-strip-wrap">
        <div ref={pillStripRef} style={{ display: 'flex', gap: 7, overflowX: 'auto', padding: '10px 0 12px', scrollbarWidth: 'none' }}
          className="scrollbar-hide">
          {CATEGORIES.filter((c) => c.id !== 'other').map((cat) => (
            <button
              key={cat.id}
              data-pill={cat.id}
              onClick={() => scrollToCategory(cat.id)}
              style={{
                flexShrink: 0, height: 30, padding: '0 13px',
                borderRadius: 100,
                border: `1px solid ${activeCat === cat.id ? 'rgba(15,76,129,0.5)' : 'rgba(15,76,129,0.14)'}`,
                background: activeCat === cat.id ? 'rgba(15,76,129,0.1)' : 'rgba(255,255,255,0.55)',
                color: activeCat === cat.id ? '#0F4C81' : '#475569',
                fontSize: 11, fontWeight: activeCat === cat.id ? 800 : 700, cursor: 'pointer',
                backdropFilter: 'blur(8px)', whiteSpace: 'nowrap',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                transition: 'all 0.2s',
              }}
            >
              {cat.label}
            </button>
          ))}
        </div>
        </div>
      </div>

      {/* App grid scroll area */}
      <div ref={scrollRef} className="scrollbar-hide" style={{ flex: 1, overflowY: 'auto', padding: '6px 20px 140px' }}>
        {CATEGORIES.map((cat) => {
          const apps = allApps.filter((a) => a.cat === cat.id && !a.custom)
          if (!apps.length) return null
          return (
            <div key={cat.id} id={`cat-section-${cat.id}`} style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
                {cat.label}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                {apps.map((app) => (
                  <AppCell
                    key={app.id}
                    app={app}
                    isSelected={!!selected[app.id]}
                    isCapped={isCapped && !selected[app.id]}
                    onTap={() => handleAppTap(app)}
                  />
                ))}
              </div>
            </div>
          )
        })}

        {/* Custom apps section */}
        {customApps.length > 0 && (
          <div id="cat-section-custom" style={{ marginTop: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              📌 Your Apps
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {customApps.map((app) => (
                <AppCell
                  key={app.id}
                  app={app}
                  isSelected={!!selected[app.id]}
                  isCapped={false}
                  onTap={() => handleAppTap(app)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Manual entry */}
        <div style={{ marginTop: 28, marginBottom: 8, textAlign: 'center' }}>
          {customCount < MAX_CUSTOM ? (
            <>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8, fontWeight: 500 }}>Don&apos;t see your app?</div>
              <button
                onClick={() => setManualOpen(true)}
                style={{
                  height: 40, padding: '0 20px',
                  background: 'rgba(255,255,255,0.62)', border: '1.5px solid rgba(15,76,129,0.15)',
                  borderRadius: 100, fontSize: 13, fontWeight: 700, color: '#0F4C81',
                  cursor: 'pointer', backdropFilter: 'blur(12px)',
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                }}
              >
                + Add your own app
              </button>
            </>
          ) : (
            <div style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Max 5 custom apps added</div>
          )}
        </div>
      </div>

      {/* Continue float bar */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '16px 20px 32px',
        background: 'linear-gradient(to top, rgba(219,234,254,0.96) 62%, transparent)',
        transform: selectedCount > 0 ? 'translateY(0)' : 'translateY(110%)',
        transition: 'transform 0.32s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        <button
          onClick={handleContinue}
          style={{
            width: '100%', height: 52,
            background: 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)',
            color: '#fff', border: 'none', borderRadius: 100,
            fontSize: 15, fontWeight: 700, cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(15,76,129,0.28), inset 0 1px 0 rgba(255,255,255,0.2)',
            fontFamily: 'Plus Jakarta Sans, sans-serif',
          }}
        >
          Analyse my spend · {selectedCount} app{selectedCount !== 1 ? 's' : ''} →
        </button>
      </div>

      {/* Plan picker sheet */}
      {planApp && (
        <PlanPickerSheet
          app={planApp}
          onSelect={handlePlanSelect}
          onClose={() => setPlanApp(null)}
        />
      )}

      {/* Manual entry sheet */}
      <ManualEntrySheet
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        currentCustomCount={customCount}
      />
    </div>
  )
}

function AppCell({ app, isSelected, isCapped, onTap }: {
  app: App
  isSelected: boolean
  isCapped: boolean
  onTap: () => void
}) {
  const [imgError, setImgError] = useState(false)
  const priceText = app.multi && app.plans?.length ? `from ₹${app.plans[0].p}` : `₹${app.price}/mo`

  return (
    <div
      onClick={!isCapped ? onTap : undefined}
      style={{
        background: isSelected ? 'rgba(204,251,241,0.65)' : 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
        borderRadius: 18, padding: '14px 8px 11px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        cursor: isCapped ? 'default' : 'pointer',
        border: `1.5px solid ${isSelected ? '#2DD4BF' : 'rgba(255,255,255,0.55)'}`,
        transition: 'all 0.15s',
        position: 'relative', minHeight: 92,
        boxShadow: isSelected
          ? '0 4px 20px rgba(45,212,191,0.18), inset 0 1px 0 rgba(255,255,255,0.7)'
          : '0 2px 10px rgba(15,76,129,0.05), inset 0 1px 0 rgba(255,255,255,0.75)',
        opacity: isCapped ? 0.45 : 1,
      }}
      onTouchStart={(e) => { if (!isCapped) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.91)' }}
      onTouchEnd={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
      onMouseDown={(e) => { if (!isCapped) (e.currentTarget as HTMLDivElement).style.transform = 'scale(0.91)' }}
      onMouseUp={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)' }}
    >
      {/* Checkmark */}
      <div style={{
        position: 'absolute', top: 6, right: 6,
        width: 18, height: 18,
        background: '#2DD4BF', borderRadius: '50%',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: '#fff', fontWeight: 900,
        transform: isSelected ? 'scale(1)' : 'scale(0)',
        transition: 'transform 0.22s cubic-bezier(0.34,1.56,0.64,1)',
        boxShadow: '0 2px 6px rgba(45,212,191,0.45)',
      }}>✓</div>

      {/* Logo — colour tile renders instantly, image loads on top */}
      <div style={{ position: 'relative', width: 42, height: 42, flexShrink: 0 }}>
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 12,
          background: hashColor(app.id),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 900, color: '#fff',
        }}>
          {app.name[0]}
        </div>
        {!app.custom && !imgError && (
          <img
            src={getLogoUrl(app.domain)}
            alt={app.name}
            width={42} height={42}
            loading="lazy"
            style={{
              position: 'absolute', inset: 0, borderRadius: 12,
              objectFit: 'contain', background: '#fff', padding: 4,
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            }}
            onError={() => setImgError(true)}
          />
        )}
      </div>

      <div style={{ fontSize: 10, color: '#1e293b', textAlign: 'center', fontWeight: 700, lineHeight: 1.2 }}>{app.name}</div>
      <div style={{ fontSize: 10, color: '#475569', fontWeight: 500 }}>{priceText}</div>
    </div>
  )
}
