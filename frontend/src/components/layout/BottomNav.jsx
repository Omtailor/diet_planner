import { NavLink, useLocation } from 'react-router-dom'
import { Home, Salad, Dumbbell, User } from 'lucide-react'

const navItems = [
  { path: '/',          icon: Home,     label: 'Home'     },
  { path: '/training',  icon: Dumbbell, label: 'Training' },
  { path: '/nutrition', icon: Salad,    label: 'Nutrition'},
  { path: '/account',   icon: User,     label: 'Account'  },
]

function BottomNav() {
  const location = useLocation()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: '480px',
      height: '64px',
      background: 'rgba(255,255,255,0.75)',
      backdropFilter: 'blur(20px) saturate(180%)',
      WebkitBackdropFilter: 'blur(20px) saturate(180%)',
      borderTop: '1px solid rgba(255,255,255,0.60)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-around',
      zIndex: 100,
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {navItems.map(({ path, icon: Icon, label }) => {
        const isActive = path === '/'
          ? location.pathname === '/'
          : location.pathname.startsWith(path)

        return (
          <NavLink
            key={path}
            to={path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              flex: 1,
              height: '100%',
              textDecoration: 'none',
              color: isActive ? 'var(--accent)' : 'var(--text-faint)',
              transition: 'color 180ms ease, transform 180ms ease',
              transform: isActive ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2.5 : 1.8}
            />
            <span style={{
              fontSize: '10px',
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '0.3px',
              fontFamily: 'Satoshi, sans-serif',
            }}>
              {label}
            </span>
          </NavLink>
        )
      })}
    </nav>
  )
}

export default BottomNav