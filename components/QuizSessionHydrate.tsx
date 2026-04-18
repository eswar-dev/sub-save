'use client'

import { useEffect } from 'react'
import { useQuizStore } from '@/lib/store/quizStore'

/** Sync email + reminder flag from localStorage so OTP is not re-asked after refresh. */
export default function QuizSessionHydrate({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const email = localStorage.getItem('sps_email')
    const reminderPaid = localStorage.getItem('sps_reminder_paid') === 'true'
    if (!email) return
    useQuizStore.setState((s) => ({
      userEmail: s.userEmail ?? email,
      reminderPaid: s.reminderPaid || reminderPaid,
    }))
  }, [])
  return <>{children}</>
}
