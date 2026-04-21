import { useLocation, useNavigate } from 'react-router-dom'
import { Home, Salad, Dumbbell, User } from 'lucide-react'
import { useRef, useEffect, useState } from 'react'

const navItems = [
  { path: '/', icon: Home, label: 'Home' },
  { path: '/training', icon: Dumbbell, label: 'Training' },
  { path: '/nutrition', icon: Salad, label: 'Nutrition' },
  { path: '/account', icon: User, label: 'Account' },
]

const FONT = "'General Sans', sans-serif"
const ACCENT = '#34C759'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const navRef = useRef(null)
  const [pillStyle, setPillStyle] = useState({ width: 0, x: 0 })

  const activeIndex = navItems.findIndex(({ path }) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path)
  )

  useEffect(() => {
    const measure = () => {
      if (!navRef.current) return
      const tabs = navRef.current.querySelectorAll('.nav-tab')
      const tab = tabs[activeIndex]
      if (!tab) return
      const navRect = navRef.current.getBoundingClientRect()
      const tabRect = tab.getBoundingClientRect()
      // Pill is 75% of tab width, centered within tab
      const pillWidth = tabRect.width * 0.75
      const pillOffset = (tabRect.width - pillWidth) / 2
      setPillStyle({
        width: pillWidth,
        x: tabRect.left - navRect.left + pillOffset,
      })
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIndex, location.pathname])

  return (
    <nav
      ref={navRef}
      style={{
        position: 'fixed',
        bottom: '28px',
        left: 0,
        right: 0,
        margin: '0 auto',
        width: '92%',
        maxWidth: '380px',
        height: '68px',
        background: 'rgba(255, 255, 255, 0.82)',
        backdropFilter: 'blur(28px) saturate(200%)',
        WebkitBackdropFilter: 'blur(28px) saturate(200%)',
        border: '1px solid rgba(255, 255, 255, 0.70)',
        borderRadius: '20px',                         // ← Rectangle outer
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 1px 0 rgba(255,255,255,0.9) inset',
        display: 'flex',
        alignItems: 'center',
        zIndex: 100,
      }}
    >
      {/* ── Sliding Oval Pill (only visual indicator) ── */}
      {pillStyle.width > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '10px',
            bottom: '10px',
            left: 0,
            width: `${pillStyle.width}px`,
            transform: `translateX(${pillStyle.x}px)`,
            background: 'rgba(52, 199, 89, 0.13)',
            border: '1px solid rgba(52, 199, 89, 0.22)',
            borderRadius: '999px',                    // ← Oval inner
            transition: [
              'transform 420ms cubic-bezier(0.34, 1.4, 0.64, 1)',
              'width 420ms cubic-bezier(0.34, 1.4, 0.64, 1)',
            ].join(', '),
            pointerEvents: 'none',
            zIndex: 0,
          }}
        />
      )}

      {navItems.map(({ path, icon: Icon, label }, i) => {
        const isActive = i === activeIndex

        return (
          <button
            key={path}
            className="nav-tab"
            onClick={() => navigate(path)}
            style={{
              flex: 1,
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              background: 'none',          // ← No background on button
              border: 'none',
              borderRadius: 0,             // ← No radius on button
              cursor: 'pointer',
              color: isActive ? ACCENT : '#8E8E93',
              transition: 'color 250ms ease, transform 300ms cubic-bezier(0.34,1.56,0.64,1)',
              transform: isActive ? 'scale(1.08)' : 'scale(1)',
              zIndex: 1,
              position: 'relative',
              padding: 0,
              outline: 'none',
            }}
          >
            <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
            <span style={{
              fontSize: '0.65rem',
              fontWeight: isActive ? 800 : 500,
              letterSpacing: '0.3px',
              fontFamily: FONT,
              lineHeight: 1,
            }}>
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}