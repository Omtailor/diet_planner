import { useNavigate } from 'react-router-dom'
import { FONT, ONBOARDING_CHECKLIST } from '../../utils/dashboard/constants'
import { accentBtn } from '../../utils/dashboard/styles'

/**
 * Full-screen overlay shown when the user tries to perform an action
 * that requires a completed profile (e.g. update weight, generate plan).
 *
 * Props:
 *  onDismiss – called when the user taps "Maybe Later" or the backdrop
 */
export default function OnboardingBlocker({ onDismiss }) {
  const navigate = useNavigate()

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px',
        animation: 'dashFadeUp 0.3s ease-out',
      }}
      onClick={onDismiss}
    >
      <div
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 340 }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ fontSize: '4rem', marginBottom: 16 }}>📋</div>

        <h2 style={{
          fontFamily: FONT, fontSize: '1.5rem', fontWeight: 800,
          color: 'var(--color-text)', textAlign: 'center',
          letterSpacing: '-0.3px', marginBottom: 10,
        }}>
          Complete Your Profile First
        </h2>

        <p style={{
          fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
          color: 'var(--color-text-muted)', textAlign: 'center',
          maxWidth: 260, lineHeight: 1.6, marginBottom: 32,
        }}>
          We need a few details about you to personalise your meal plan and track your progress.
        </p>

        <div style={{
          width: '100%', maxWidth: 300,
          background: 'rgba(52,199,89,0.06)',
          border: '1px solid rgba(52,199,89,0.2)',
          borderRadius: 16, padding: '16px 20px',
          marginBottom: 28,
          display: 'flex', flexDirection: 'column', gap: 10,
        }}>
          {ONBOARDING_CHECKLIST.map(({ emoji, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
              <span style={{
                fontFamily: FONT, fontSize: '0.85rem',
                fontWeight: 600, color: 'var(--color-text)',
              }}>
                {text}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={() => { onDismiss(); navigate('/onboarding') }}
          style={{
            ...accentBtn,
            width: '100%', maxWidth: 300,
            padding: 16, borderRadius: 16,
            fontSize: '1rem', marginBottom: 12,
          }}
        >
          Complete Onboarding →
        </button>

        <button
          onClick={onDismiss}
          style={{
            width: '100%', maxWidth: 300, padding: 12,
            background: 'transparent',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: 16, color: 'var(--color-text-muted)',
            fontFamily: FONT, fontWeight: 600, fontSize: '0.9rem',
            cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>
    </div>
  )
}
