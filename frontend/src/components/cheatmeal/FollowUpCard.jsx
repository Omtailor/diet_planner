import { FONT, GLASS_WHITE } from '../../utils/cheatMeal/constants'

/**
 * FollowUpCard
 *
 * Props:
 *   question – string  (AI follow-up question)
 *   answer   – string
 *   onAnswerChange – (value: string) => void
 */
export default function FollowUpCard({ question, answer, onAnswerChange }) {
  return (
    <>
      <div style={s.followUpCard}>
        <div style={s.aiAvatar}>🤖</div>
        <p style={s.followUpQ}>{question}</p>
      </div>

      <div style={{ ...GLASS_WHITE, borderRadius: 24, padding: '20px' }}>
        <label style={s.label}>Your answer</label>
        <input
          style={s.input}
          placeholder="Type your answer..."
          value={answer}
          onChange={e => onAnswerChange(e.target.value)}
          autoFocus
        />
      </div>
    </>
  )
}

const s = {
  followUpCard: {
    ...GLASS_WHITE,
    background: 'rgba(52, 199, 89, 0.08)',
    border: '1px solid rgba(52, 199, 89, 0.2)',
    borderRadius: 24, padding: '24px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 14,
  },
  aiAvatar: { fontSize: '3rem' },
  followUpQ: {
    fontFamily: FONT, fontSize: '1.05rem', fontWeight: 600,
    color: 'var(--color-text)', textAlign: 'center',
    lineHeight: 1.5,
  },
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--color-text-muted)', letterSpacing: '0.5px',
    textTransform: 'uppercase', fontFamily: FONT,
    marginBottom: 10,
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16,
    padding: '14px 16px', color: 'var(--color-text)',
    fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
    outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  },
}
