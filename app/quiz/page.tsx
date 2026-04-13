'use client'

import { useEffect, useRef } from 'react'
import { useQuizStore, Screen } from '@/lib/store/quizStore'
import WelcomeScreen from '@/components/screens/WelcomeScreen'
import AppSelectScreen from '@/components/screens/AppSelectScreen'
import QuestionsScreen from '@/components/screens/QuestionsScreen'
import CalculatingScreen from '@/components/screens/CalculatingScreen'
import ResultsScreen from '@/components/screens/ResultsScreen'

const SCREEN_IDS: Screen[] = ['welcome', 'app-select', 'questions', 'calculating', 'results']

export default function QuizPage() {
  const { activeScreen } = useQuizStore()
  const prevScreen = useRef<Screen>('welcome')

  // Manage CSS classes for slide transitions
  useEffect(() => {
    const prev = prevScreen.current
    const curr = activeScreen
    if (prev === curr) return

    const SCREENS_ORDER: Screen[] = ['welcome', 'app-select', 'questions', 'calculating', 'results']
    const prevIdx = SCREENS_ORDER.indexOf(prev)
    const currIdx = SCREENS_ORDER.indexOf(curr)
    const goingForward = currIdx > prevIdx

    const prevEl = document.getElementById(`screen-${prev}`)
    const currEl = document.getElementById(`screen-${curr}`)

    if (prevEl) {
      prevEl.classList.remove('active')
      if (goingForward) {
        prevEl.classList.add('exit-left')
        setTimeout(() => prevEl.classList.remove('exit-left'), 400)
      } else {
        // Going back — slide current out to right, bring prev back
        prevEl.style.transform = 'translateX(105%)'
        setTimeout(() => {
          prevEl.style.transform = ''
          prevEl.classList.remove('active')
        }, 380)
      }
    }

    if (currEl) {
      if (goingForward) {
        currEl.classList.add('active')
      } else {
        // Back — start from -28%, slide to 0
        currEl.style.transform = 'translateX(-28%)'
        currEl.classList.add('active')
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            currEl.style.transition = 'transform 0.35s cubic-bezier(0.4,0,0.2,1)'
            currEl.style.transform = 'translateX(0)'
            setTimeout(() => {
              currEl.style.transition = ''
              currEl.style.transform = ''
            }, 380)
          })
        })
      }
    }

    prevScreen.current = curr
  }, [activeScreen])

  return (
    <div style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <WelcomeScreen />
      <AppSelectScreen />
      <QuestionsScreen />
      <CalculatingScreen />
      <ResultsScreen />
    </div>
  )
}
