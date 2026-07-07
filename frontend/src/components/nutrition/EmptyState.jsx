import { Loader2 } from 'lucide-react'
import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

const emptyStateStyle = {
  ...GLASS_WHITE,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '60px 24px',
  borderRadius: '24px',
}

export default function EmptyState({ onGenerateNextWeek, generatingNextWeek }) {
  return (
    <div
      style={{
        ...emptyStateStyle,
        padding: '28px 20px',
        alignItems: 'stretch',
        textAlign: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '3.2rem' }}>📅</span>
        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--color-text)',
            fontWeight: 800,
            fontFamily: FONT,
            margin: 0,
          }}
        >
          No plan generated for this day
        </p>
        <p
          style={{
            fontSize: '0.9rem',
            color: 'var(--color-text-muted)',
            fontWeight: 500,
            fontFamily: FONT,
            textAlign: 'center',
            lineHeight: 1.55,
            maxWidth: 280,
            margin: '0 auto',
          }}
        >
          This date does not have a meal plan yet. Generate a new 3-day plan to start from the next available day.
        </p>
      </div>

      <button
        onClick={onGenerateNextWeek}
        disabled={generatingNextWeek}
        style={{
          marginTop: 18,
          width: '100%',
          padding: '15px 16px',
          background: 'var(--color-accent)',
          color: '#fff',
          border: 'none',
          borderRadius: 18,
          fontSize: '0.95rem',
          fontWeight: 800,
          fontFamily: FONT,
          cursor: generatingNextWeek ? 'not-allowed' : 'pointer',
          opacity: generatingNextWeek ? 0.75 : 1,
          boxShadow: '0 8px 24px rgba(52,199,89,0.28)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          transition: 'all 180ms ease',
        }}
      >
        {generatingNextWeek ? (
          <>
            <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
            Generating plan...
          </>
        ) : (
          <>
            <span style={{ fontSize: '1rem' }}>✨</span>
            Generate Plan
          </>
        )}
      </button>
    </div>
  )
}
