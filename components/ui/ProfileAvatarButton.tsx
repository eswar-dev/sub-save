'use client'

interface Props {
  email: string | null
  onClick: () => void
}

export default function ProfileAvatarButton({ email, onClick }: Props) {
  const initial = email?.trim()
  const letter = initial && initial.includes('@') ? initial[0]!.toUpperCase() : null

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={email ? `Account: ${email}` : 'Sign in to your account'}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: '1.5px solid rgba(255,255,255,0.65)',
        background: letter ? 'linear-gradient(135deg, #0F4C81 0%, #2DD4BF 100%)' : 'rgba(255,255,255,0.72)',
        color: letter ? '#fff' : '#0F4C81',
        fontSize: letter ? 15 : 20,
        fontWeight: 800,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        boxShadow: '0 2px 10px rgba(15,76,129,0.12)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {letter ?? '👤'}
    </button>
  )
}
