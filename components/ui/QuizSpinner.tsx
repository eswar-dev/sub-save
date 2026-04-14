export default function QuizSpinner() {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(150deg,#dbeafe 0%,#e8f4fd 50%,#d4f6ef 100%)',
    }}>
      <div
        className="animate-spin-ring"
        style={{
          width: 44, height: 44,
          border: '3px solid rgba(15,76,129,0.12)',
          borderTopColor: '#0F4C81', borderRightColor: '#2DD4BF',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}
