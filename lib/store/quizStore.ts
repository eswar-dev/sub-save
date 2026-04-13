'use client'

import { create } from 'zustand'
import { App } from '@/lib/data/apps'
import { AppResult, Q1Answer, Q2Answer, scoreApp } from '@/lib/scoring'

export type Screen = 'welcome' | 'app-select' | 'questions' | 'calculating' | 'results'

export interface SelectedApp extends App {
  selectedPrice: number
}

export interface QuestionCard {
  appId: string
  appName: string
  appDomain: string
  appPrice: number
  appCategory: string
  appCustom: boolean
  questionNum: 1 | 2
}

export interface QuizStore {
  // ── NAVIGATION ──
  activeScreen: Screen
  navigateTo: (screen: Screen) => void
  navigateBack: () => void
  previousScreen: Screen | null

  // ── APP SELECT ──
  selected: Record<string, SelectedApp>
  totalSpend: number
  selectApp: (app: App, price: number) => void
  deselectApp: (appId: string) => void
  addCustomApp: (app: App) => void

  // ── QUESTIONS ──
  answers: Record<string, string>         // 'appId-q1' | 'appId-q2' → value
  cards: QuestionCard[]
  cardIndex: number
  buildCards: () => void
  setAnswer: (key: string, value: string) => void
  undoLastAnswer: () => void
  resetAnswers: () => void

  // ── RESULTS ──
  results: AppResult[]
  sessionId: string | null
  reminderPaid: boolean
  userEmail: string | null
  lastAuditDate: string | null
  isReturningUser: boolean
  computeResults: () => void
  setSession: (id: string) => void
  setReminderPaid: (email: string) => void
  setReturningUser: (email: string, results: AppResult[], auditDate: string) => void
  startQuizWithEmail: (email: string) => void
  updateReminderConfig: (appId: string, config: AppResult['reminderConfig']) => void

  // ── FULL RESET ──
  reset: () => void
}

function getLocalSessionId(): string {
  if (typeof window === 'undefined') return `sps_${Date.now()}_${Math.random().toString(36).slice(2)}`
  let id = localStorage.getItem('sps_session_id')
  if (!id) {
    id = `sps_${Date.now()}_${Math.random().toString(36).slice(2)}`
    localStorage.setItem('sps_session_id', id)
  }
  return id
}

const SCREEN_HISTORY: Screen[] = []

export const useQuizStore = create<QuizStore>((set, get) => ({
  // ── NAVIGATION ──
  activeScreen: 'welcome',
  previousScreen: null,

  navigateTo: (screen) => {
    SCREEN_HISTORY.push(get().activeScreen)
    set({ activeScreen: screen, previousScreen: get().activeScreen })
  },

  navigateBack: () => {
    const prev = SCREEN_HISTORY.pop() ?? 'welcome'
    set({ activeScreen: prev, previousScreen: null })
  },

  // ── APP SELECT ──
  selected: {},
  totalSpend: 0,

  selectApp: (app, price) => {
    const prev = get().selected
    const updated = { ...prev, [app.id]: { ...app, selectedPrice: price } }
    const total = Object.values(updated).reduce((s, a) => s + a.selectedPrice, 0)
    set({ selected: updated, totalSpend: total })
  },

  deselectApp: (appId) => {
    const { [appId]: _, ...rest } = get().selected
    const total = Object.values(rest).reduce((s, a) => s + a.selectedPrice, 0)
    set({ selected: rest, totalSpend: total })
  },

  addCustomApp: (app) => {
    const prev = get().selected
    const updated = { ...prev, [app.id]: { ...app, selectedPrice: app.price } }
    const total = Object.values(updated).reduce((s, a) => s + a.selectedPrice, 0)
    set({ selected: updated, totalSpend: total })
  },

  // ── QUESTIONS ──
  answers: {},
  cards: [],
  cardIndex: 0,

  buildCards: () => {
    const apps = Object.values(get().selected)
    const cards: QuestionCard[] = []
    for (const app of apps) {
      cards.push({ appId: app.id, appName: app.name, appDomain: app.domain, appPrice: app.selectedPrice, appCategory: app.cat, appCustom: app.custom ?? false, questionNum: 1 })
      cards.push({ appId: app.id, appName: app.name, appDomain: app.domain, appPrice: app.selectedPrice, appCategory: app.cat, appCustom: app.custom ?? false, questionNum: 2 })
    }
    set({ cards, cardIndex: 0 })
  },

  setAnswer: (key, value) => {
    set((state) => ({ answers: { ...state.answers, [key]: value } }))
  },

  undoLastAnswer: () => {
    const { cardIndex, answers, cards } = get()
    if (cardIndex <= 0) return
    const prevIdx = cardIndex - 1
    const prevCard = cards[prevIdx]
    if (!prevCard) return
    const key = `${prevCard.appId}-q${prevCard.questionNum}`
    const { [key]: _, ...rest } = answers
    set({ cardIndex: prevIdx, answers: rest })
  },

  resetAnswers: () => {
    set({ answers: {}, cards: [], cardIndex: 0 })
  },

  // ── RESULTS ──
  results: [],
  sessionId: null,
  reminderPaid: false,
  userEmail: null,
  lastAuditDate: null,
  isReturningUser: false,

  computeResults: () => {
    const { selected, answers } = get()
    const apps = Object.values(selected)
    const results: AppResult[] = apps.map((app) => {
      const q1 = (answers[`${app.id}-q1`] ?? "Can't remember") as Q1Answer
      const q2 = (answers[`${app.id}-q2`] ?? 'Rarely') as Q2Answer
      return scoreApp(
        { id: app.id, name: app.name, price: app.selectedPrice, category: app.cat, domain: app.domain, custom: app.custom },
        q1,
        q2,
      )
    })
    // Sort: cancel first, then review, then keep
    results.sort((a, b) => {
      const order = { cancel: 0, review: 1, keep: 2 }
      return order[a.verdict] - order[b.verdict]
    })
    set({ results })
  },

  setSession: (id) => set({ sessionId: id }),

  setReminderPaid: (email) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sps_email', email)
      localStorage.setItem('sps_reminder_paid', 'true')
    }
    set({ reminderPaid: true, userEmail: email })
  },

  setReturningUser: (email, results, auditDate) => {
    set({ userEmail: email, results, lastAuditDate: auditDate, isReturningUser: true, activeScreen: 'results' })
  },

  startQuizWithEmail: (email) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sps_email', email)
    }
    SCREEN_HISTORY.length = 0
    set({
      userEmail: email,
      activeScreen: 'app-select',
      previousScreen: 'welcome',
      selected: {},
      totalSpend: 0,
      answers: {},
      cards: [],
      cardIndex: 0,
      results: [],
      sessionId: null,
      isReturningUser: false,
      lastAuditDate: null,
    })
  },

  updateReminderConfig: (appId, config) => {
    set((state) => ({
      results: state.results.map((r) => r.id === appId ? { ...r, reminderConfig: config } : r),
    }))
  },

  // ── FULL RESET ──
  reset: () => {
    if (typeof window !== 'undefined') {
      // Generate new session ID on reset
      const newId = `sps_${Date.now()}_${Math.random().toString(36).slice(2)}`
      localStorage.setItem('sps_session_id', newId)
    }
    set({
      activeScreen: 'welcome',
      previousScreen: null,
      selected: {},
      totalSpend: 0,
      answers: {},
      cards: [],
      cardIndex: 0,
      results: [],
      sessionId: null,
      isReturningUser: false,
      lastAuditDate: null,
    })
    SCREEN_HISTORY.length = 0
  },
}))
