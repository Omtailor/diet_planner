import { FONT } from '../../utils/dashboard/constants'

/**
 * Full-page gate shown when the user has not completed onboarding.
 * Replaces the entire Dashboard with a prompt to finish their profile.
 */
export default function OnboardingGate({ onCompleteOnboarding }) {
  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'linear-gradient(160deg, rgba(242,242,247,0.98) 0%, rgba(232,244,236,0.96) 100%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        borderRadius: '28px',
        padding: '32px 28px',
        background: 'rgba(255,255,255,0.86)',
        border: '1px solid rgba(255,255,255,0.78)',
        boxShadow: '0 24px 80px rgba(17, 24, 39, 0.10)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📋</div>
        <h1 style={{
          fontFamily: FONT,
          fontSize: '1.65rem', fontWeight: 800,
          color: 'var(--color-text)',
          marginBottom: '10px', letterSpacing: '-0.3px',
        }}>
          Please complete onboarding
        </h1>
        <p style={{
          fontFamily: FONT,
          fontSize: '0.95rem', lineHeight: 1.6,
          color: 'var(--color-text-muted)',
          marginBottom: '28px',
        }}>
          We need your profile details before we can unlock the dashboard and generate
          personalized meal and training plans.
        </p>
        <button
          onClick={onCompleteOnboarding}
          style={{
            width: '100%',
            padding: '15px 18px',
            borderRadius: '16px',
            border: 'none',
            background: 'var(--color-accent)',
            color: '#fff',
            fontFamily: FONT,
            fontSize: '1rem', fontWeight: 700,
            cursor: 'pointer',
            boxShadow: '0 10px 24px rgba(52, 199, 89, 0.24)',
          }}
        >
          Complete Onboarding →
        </button>
      </div>
    </div>
  )
}
