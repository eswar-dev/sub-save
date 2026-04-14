'use client'

import { App } from '@/lib/data/apps'

interface Props {
  app: App
  onSelect: (app: App, price: number) => void
  onClose: () => void
}

export default function PlanPickerSheet({ app, onSelect, onClose }: Props) {
  return (
    <>
      <div className="b-overlay open" onClick={onClose} />
      <div className="b-sheet open">
        <div style={{ width: 36, height: 4, background: 'rgba(15,76,129,0.12)', borderRadius: 2, margin: '4px auto 18px' }} />
        <div style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', marginBottom: 2 }}>{app.name}</div>
        <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, fontWeight: 500 }}>Choose your plan</div>
        {app.plans?.map((plan, i) => (
          <div
            key={plan.n}
            onClick={() => onSelect(app, plan.p)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '14px 0',
              borderBottom: i < (app.plans?.length ?? 0) - 1 ? '1px solid rgba(15,76,129,0.06)' : 'none',
              cursor: 'pointer',
            }}
            onTouchStart={(e) => { (e.currentTarget as HTMLDivElement).style.background = 'rgba(45,212,191,0.08)'; (e.currentTarget as HTMLDivElement).style.borderRadius = '12px'; (e.currentTarget as HTMLDivElement).style.padding = '14px 10px'; (e.currentTarget as HTMLDivElement).style.margin = '0 -10px' }}
            onTouchEnd={(e) => { (e.currentTarget as HTMLDivElement).style.background = ''; (e.currentTarget as HTMLDivElement).style.borderRadius = ''; (e.currentTarget as HTMLDivElement).style.padding = '14px 0'; (e.currentTarget as HTMLDivElement).style.margin = '' }}
          >
            <span style={{ fontSize: 15, color: '#1e293b', fontWeight: 500 }}>{plan.n}</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#0F4C81' }}>₹{plan.p}/mo</span>
          </div>
        ))}
      </div>
    </>
  )
}
