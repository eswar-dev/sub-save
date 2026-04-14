'use client'

import { useState } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'
import { Category, CATEGORIES, hashColor } from '@/lib/data/apps'
import { track } from '@/lib/analytics'

interface Props {
  open: boolean
  onClose: () => void
  currentCustomCount: number
}

export default function ManualEntrySheet({ open, onClose, currentCustomCount }: Props) {
  const { addCustomApp } = useQuizStore()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [cat, setCat] = useState<Category>('streaming')

  const canAdd = name.trim().length > 0 && Number(price) > 0

  function handleAdd() {
    if (!canAdd) return
    const id = `custom_${Date.now()}`
    const app = {
      id,
      name: name.trim(),
      cat,
      domain: '',
      price: Number(price),
      multi: false,
      custom: true,
    }
    addCustomApp(app)
    track('custom_app_added', { price: Number(price), category: cat })
    setName(''); setPrice(''); setCat('streaming')
    onClose()
  }

  return (
    <>
      <div className={`b-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <div className={`b-sheet ${open ? 'open' : ''}`}>
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>Add your app</div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 16, fontWeight: 500 }}>We&apos;ll include it in your audit</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>App name</div>
            <input
              className="gate-input"
              type="text"
              placeholder="e.g. Hotstar Kids"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Monthly price (₹)</div>
            <input
              className="gate-input"
              type="number"
              placeholder="e.g. 299"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Category</div>
            <select
              className="gate-input"
              value={cat}
              onChange={(e) => setCat(e.target.value as Category)}
              style={{ cursor: 'pointer' }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAdd}
            disabled={!canAdd}
            style={{
              width: '100%', height: 50,
              background: canAdd ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(148,163,184,0.3)',
              color: canAdd ? '#fff' : '#94a3b8', border: 'none', borderRadius: 100,
              fontSize: 15, fontWeight: 700, cursor: canAdd ? 'pointer' : 'default',
              marginTop: 4, fontFamily: 'Plus Jakarta Sans, sans-serif',
            }}
          >
            Add app →
          </button>
        </div>
      </div>
    </>
  )
}
