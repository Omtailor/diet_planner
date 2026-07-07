import { useNavigate } from 'react-router-dom';
import { FONT } from '../../utils/training/constants';

/**
 * Full-screen overlay shown when the user's profile is incomplete
 * and cannot generate a training plan until onboarding is finished.
 */
export default function OnboardingBlocker({ onDismiss }) {
  const navigate = useNavigate();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(255,255,255,0.97)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '32px', fontFamily: FONT,
      animation: 'fadeUp 0.3s ease-out',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏋️</div>

      <h2 style={{
        fontFamily: FONT, fontSize: '1.5rem', fontWeight: 800,
        color: 'var(--color-text)', textAlign: 'center',
        letterSpacing: '-0.3px', marginBottom: '10px',
      }}>
        Complete Your Profile First
      </h2>

      <p style={{
        fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
        color: 'var(--color-text-muted)', textAlign: 'center',
        maxWidth: '260px', lineHeight: 1.6, marginBottom: '32px',
      }}>
        We need your fitness details to build a personalised training plan tailored to your goals.
      </p>

      <div style={{
        width: '100%', maxWidth: '300px',
        background: 'rgba(52,199,89,0.06)',
        border: '1px solid rgba(52,199,89,0.2)',
        borderRadius: '16px', padding: '16px 20px',
        marginBottom: '28px',
        display: 'flex', flexDirection: 'column', gap: '10px',
      }}>
        {[
          { emoji: '👤', text: 'Basic info — age, gender, city' },
          { emoji: '⚖️', text: 'Body stats — height & weight' },
          { emoji: '🎯', text: 'Your goal — fat loss, muscle gain...' },
          { emoji: '💪', text: 'Activity level & gym preference' },
        ].map(({ emoji, text }) => (
          <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
            <span style={{
              fontFamily: FONT, fontSize: '0.85rem',
              fontWeight: 600, color: 'var(--color-text)',
            }}>{text}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate('/onboarding')}
        style={{
          width: '100%', maxWidth: '300px', padding: '16px',
          background: 'var(--color-accent)',
          border: 'none', borderRadius: '16px',
          color: '#ffffff', fontFamily: FONT,
          fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
          boxShadow: '0 8px 24px rgba(52,199,89,0.35)',
          marginBottom: '12px',
        }}
      >
        Complete Onboarding →
      </button>

      <button
        onClick={onDismiss}
        style={{
          width: '100%', maxWidth: '300px', padding: '12px',
          background: 'transparent',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '16px',
          color: 'var(--color-text-muted)',
          fontFamily: FONT, fontWeight: 600,
          fontSize: '0.9rem', cursor: 'pointer',
        }}
      >
        Maybe Later
      </button>
    </div>
  );
}
