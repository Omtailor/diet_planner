import { FONT, GLASS_WHITE } from '../../utils/cheatMeal/constants'

/**
 * ResultCard
 *
 * Props:
 *   result – CheatMealSerializer data object
 */
export default function ResultCard({ result }) {
  const calories = result.user_edited_calories || result.ai_estimated_calories
  const confidence = result.ai_confidence

  const confidenceStyle = confidence
    ? {
        background: confidence > 0.7
          ? 'rgba(52,199,89,0.12)'   // Apple Green tint
          : 'rgba(255,149,0,0.12)', // Apple Orange tint
        color: confidence > 0.7 ? '#34C759' : '#FF9500',
      }
    : null

  const confidenceLabel =
    confidence > 0.7
      ? '🎯 High confidence'
      : confidence > 0.4
        ? '📊 Medium confidence'
        : '⚠️ Low confidence estimate'

  return (
    <div style={s.resultCard}>
      <div style={s.resultCheck}>✅</div>
      <p style={s.resultTitle}>{result.food_name || 'Cheat meal logged'}</p>

      {result.ai_estimated_calories > 0 && (
        <p style={s.resultCals}>~{calories} kcal</p>
      )}

      {confidence != null && (
        <div style={{ ...s.confidenceBadge, ...confidenceStyle }}>
          {confidenceLabel}
        </div>
      )}

      <p style={s.resultSub}>
        Plan will be adjusted automatically for the next meal slot.
      </p>
    </div>
  )
}

const s = {
  resultCard: {
    ...GLASS_WHITE,
    borderRadius: 24, padding: '36px 24px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12,
  },
  resultCheck: { fontSize: '3.5rem' },
  resultTitle: {
    fontFamily: FONT,
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)', textAlign: 'center',
  },
  resultCals: {
    fontSize: '2.5rem', fontWeight: 800,
    color: 'var(--color-accent)',
    fontFamily: FONT, letterSpacing: '-0.5px',
  },
  confidenceBadge: {
    fontSize: '0.85rem', fontFamily: FONT,
    fontWeight: 700, padding: '6px 16px',
    borderRadius: 999, border: '1px solid transparent', marginTop: 4,
  },
  resultSub: {
    fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, textAlign: 'center',
    marginTop: 8, lineHeight: 1.5,
  },
}
