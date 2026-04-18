import QuizSessionHydrate from '@/components/QuizSessionHydrate'

export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <QuizSessionHydrate>
      <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
        {children}
      </div>
    </QuizSessionHydrate>
  )
}
