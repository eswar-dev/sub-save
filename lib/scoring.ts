export type Q1Answer = 'This week' | 'This month' | 'Over a month ago' | "Can't remember"
export type Q2Answer = 'Daily' | 'Few times a week' | 'Weekly' | 'Few times a month' | 'Rarely'
export type Verdict = 'cancel' | 'review' | 'keep'

const BASE_SCORES: Record<Q1Answer, number> = {
  'This week':          0.90,
  'This month':         0.50,
  'Over a month ago':   0.20,
  "Can't remember":     0.05,
}

const FREQ_MODIFIERS: Record<Q2Answer, number> = {
  'Daily':              +0.20,
  'Few times a week':   +0.10,
  'Weekly':              0.00,
  'Few times a month':  -0.10,
  'Rarely':             -0.20,
}

export const Q2_OPTIONS_BY_Q1: Record<Q1Answer, Q2Answer[]> = {
  'This week':          ['Daily', 'Few times a week', 'Weekly', 'Few times a month', 'Rarely'],
  'This month':         ['Few times a week', 'Weekly', 'Few times a month', 'Rarely'],
  'Over a month ago':   ['Few times a month', 'Rarely'],
  "Can't remember":     [], // auto-advance
}

export function getCostWeight(price: number): number {
  if (price < 200) return 30
  if (price < 500) return 60
  return 100
}

export function computeUsageScore(q1: Q1Answer, q2: Q2Answer): number {
  const base = BASE_SCORES[q1]
  const mod = FREQ_MODIFIERS[q2]
  return Math.min(1.0, Math.max(0.05, base + mod))
}

export function computeWastageIndex(usageScore: number, price: number): number {
  return (1 - usageScore) * getCostWeight(price)
}

export function getVerdict(wastageIndex: number): Verdict {
  if (wastageIndex > 70) return 'cancel'
  if (wastageIndex >= 40) return 'review'
  return 'keep'
}

export function generateReason(
  verdict: Verdict,
  appName: string,
  q1: Q1Answer,
  q2: Q2Answer,
  price: number,
): string {
  if (verdict === 'cancel') {
    if (q1 === "Can't remember") {
      return `You can't recall the last time you opened ${appName}. That's ₹${price}/mo going nowhere.`
    }
    if (q1 === 'Over a month ago') {
      return `Last used over a month ago, and ${q2.toLowerCase()} at that. Time to cut.`
    }
    return `${appName} gets used ${q2.toLowerCase()} at best. Not worth ₹${price}/mo.`
  }
  if (verdict === 'review') {
    if (q1 === 'This week') {
      return `You used it this week but ${q2.toLowerCase()} overall. Watch if the habit sticks.`
    }
    return `You use it ${q2.toLowerCase()}, but it's been a while. Worth a closer look.`
  }
  // keep
  if (q2 === 'Daily') return `Daily use at ₹${price}/mo — this one earns its keep.`
  if (q2 === 'Few times a week') return `Solid usage. Worth it at ₹${price}/mo.`
  return `Actively used. ₹${price}/mo is justified.`
}

export interface AppResult {
  id: string
  name: string
  price: number
  category: string
  domain: string
  custom: boolean
  q1: Q1Answer
  q2: Q2Answer
  usageScore: number
  costWeight: number
  wastageIndex: number
  verdict: Verdict
  reason: string
  reminderConfig: ReminderConfig | null
}

export interface ReminderConfig {
  mode: 'exact' | 'estimated' | 'monthly'
  date?: string        // ISO date, mode=exact
  week?: string        // '1st'|'2nd'|'3rd'|'4th', mode=estimated
  reviewDay?: string   // '1st'|'15th'|'25th', mode=monthly
  leadDays?: number[]  // [7,3,1], mode=exact
}

export function scoreApp(
  app: { id: string; name: string; price: number; category: string; domain: string; custom?: boolean },
  q1: Q1Answer,
  q2: Q2Answer,
): AppResult {
  const usageScore = computeUsageScore(q1, q2)
  const costWeight = getCostWeight(app.price)
  const wastageIndex = computeWastageIndex(usageScore, app.price)
  const verdict = getVerdict(wastageIndex)
  const reason = generateReason(verdict, app.name, q1, q2, app.price)

  return {
    id: app.id,
    name: app.name,
    price: app.price,
    category: app.category,
    domain: app.domain,
    custom: app.custom ?? false,
    q1,
    q2,
    usageScore,
    costWeight,
    wastageIndex,
    verdict,
    reason,
    reminderConfig: null,
  }
}
