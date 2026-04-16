'use client'

import { useQuizStore } from '@/lib/store/quizStore'
import ResultsScreen from '@/components/screens/ResultsScreen'
import DashboardScreen from '@/components/screens/DashboardScreen'

export default function ResultsPage() {
  const { isReturningUser } = useQuizStore()
  return isReturningUser ? <DashboardScreen /> : <ResultsScreen />
}
