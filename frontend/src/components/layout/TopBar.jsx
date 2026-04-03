import { useLocation } from 'react-router-dom'

const pageTitles = {
  '/':          null,
  '/nutrition': 'Nutrition',
  '/training':  'Training',
  '/account':   'Account',
}

function TopBar() {
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
      background: 'var(--bg-primary)',
      borderBottom: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      paddingInline: '20px',
      zIndex: 100,
    }}>
      <h1 style={{
        fontFamily: 'Clash Display, sans-serif',
        fontSize: '1.25rem',
        fontWeight: 600,
        color: 'var(--text-primary)',
        letterSpacing: '-0.3px',
      }}>
        {title}
      </h1>
    </header>
  )
}

export default TopBar