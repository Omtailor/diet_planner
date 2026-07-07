import { ChevronRight } from 'lucide-react'
import { FONT, MEAL_SLOT_CONFIG } from '../../utils/dashboard/constants'
import { mealCardStyle, mealThumb } from '../../utils/dashboard/styles'

/**
 * Tappable card showing a brief preview of a single meal slot
 * (breakfast, lunch, or dinner).
 */
export default function MealPreviewCard({ slot, meal, onTap, index = 0 }) {
  const { emoji, label } = MEAL_SLOT_CONFIG[slot] || { emoji: '🍽️', label: slot }

  return (
    <button
      onClick={onTap}
      className="meal-card"
      style={{
        ...mealCardStyle,
        animationDelay: `${index * 0.1}s`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={mealThumb}>
          <span style={{ fontSize: '1.3rem' }}>{emoji}</span>
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{
            fontSize: '0.72rem', color: 'var(--color-text-faint)',
            fontFamily: FONT,
            letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 700,
          }}>{label}</p>
          <p style={{
            fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)',
            fontFamily: FONT,
            marginTop: '3px', lineHeight: 1.3,
          }}>
            {meal?.food_item?.name || '—'}
          </p>
          {meal?.calories && (
            <p style={{
              fontSize: '0.8rem', color: 'var(--color-text-muted)',
              fontFamily: FONT, marginTop: '3px', fontWeight: 500,
            }}>
              ~{Math.round(meal.calories)} kcal
            </p>
          )}
        </div>
        <ChevronRight size={15} color="var(--color-text-faint)" />
      </div>
    </button>
  )
}
