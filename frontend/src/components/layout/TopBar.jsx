import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/': null,
  '/nutrition': 'Nutrition',
  '/training': 'Training',
  '/account': 'Account',
}

export default function TopBar() {
  const location = useLocation()
  const title = pageTitles[location.pathname]

  if (!title) return null

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: '60px',
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(12px) saturate(180%)',
      WebkitBackdropFilter: 'blur(12px) saturate(180%)',
      borderBottom: '1px solid rgba(255,255,255,0.60)',
      display: 'flex',
      alignItems: 'center',
      paddingInline: '20px',
      zIndex: 100,
    }}>
      <h1 style={{
        fontFamily: "'General Sans', sans-serif",
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--color-text)',
        letterSpacing: '-0.3px',
      }}>
        {title}
      </h1>
    </header>
  )
}