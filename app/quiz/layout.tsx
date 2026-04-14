export default function QuizLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
      {children}
    </div>
  )
}
