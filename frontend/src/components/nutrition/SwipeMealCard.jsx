import { useRef } from 'react'
import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

const tagStyle = {
  fontSize: '0.65rem', fontWeight: 700,
  color: 'var(--color-text-muted)',
  background: 'rgba(0,0,0,0.04)',
  borderRadius: '999px', padding: '3px 10px',
  fontFamily: FONT,
}

const ingTag = {
  fontSize: '0.75rem', color: 'var(--color-text)', fontWeight: 500,
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: '999px', padding: '4px 10px',
  fontFamily: FONT,
}

export default function SwipeMealCard({ meal, slot, onViewDetail, onRegenerate, regenerating }) {
  const dragRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const cardRef = useRef(null)

  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }
  // Apple Light Theme Accent Colors
  const slotColors = {
    breakfast: 'rgba(255, 149, 0, 0.12)', // Orange
    lunch: 'rgba(52, 199, 89, 0.12)',    // Green
    dinner: 'rgba(0, 122, 255, 0.12)',   // Blue
  }
  const slotAccents = {
    breakfast: '#FF9500',
    lunch: '#34C759',
    dinner: '#007AFF',
  }

  const icon = icons[slot] || '🍽️'
  const bg = slotColors[slot] || 'transparent'
  const accent = slotAccents[slot] || 'var(--color-accent)'
  const label = slot.charAt(0).toUpperCase() + slot.slice(1)

  const name = meal?.food_item?.name || 'No meal assigned'
  const calories = meal?.calories || 0
  const protein = meal?.protein_g || 0
  const carbs = meal?.carbs_g || 0
  const fats = meal?.fats_g || 0

  // Drag handlers
  const onPointerDown = (e) => {
    isDragging.current = true
    startX.current = e.clientX || e.touches?.[0]?.clientX || 0
    cardRef.current.style.transition = 'none'
  }

  const onPointerMove = (e) => {
    if (!isDragging.current) return
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - startX.current
    currentX.current = x
    const rotate = x * 0.05
    cardRef.current.style.transform = `translateX(${x}px) rotate(${rotate}deg)`
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    cardRef.current.style.transition = 'transform 300ms cubic-bezier(0.16,1,0.3,1)'
    cardRef.current.style.transform = 'translateX(0) rotate(0deg)'
    currentX.current = 0
  }

  return (
    <div
      ref={cardRef}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      style={{
        ...GLASS_WHITE,
        borderRadius: '24px',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'pan-y',
        cursor: 'grab',
        willChange: 'transform',
        transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Card top accent area */}
      <div style={{
        background: bg, padding: '24px 20px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(255,255,255,0.6)',
          borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800,
              color: accent, letterSpacing: '1px',
              textTransform: 'uppercase', fontFamily: FONT,
            }}>{label}</span>
            {meal?.food_item?.is_fasting_friendly && (
              <span style={tagStyle}>🙏 Fasting</span>
            )}
          </div>
          <h3 style={{
            fontFamily: FONT,
            fontSize: '1.3rem', fontWeight: 800,
            color: 'var(--color-text)', letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}>{name}</h3>
          {meal?.food_item?.serving_size && (
            <p style={{
              fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
              fontFamily: FONT, marginTop: '4px'
            }}>
              {meal.quantity} × {meal.food_item.serving_size} {meal.food_item.serving_unit}
            </p>
          )}
        </div>
      </div>

      {/* Macro pills */}
      <div style={{
        display: 'flex', gap: '8px', padding: '16px 20px',
        borderBottom: '1px solid rgba(0,0,0,0.04)', flexWrap: 'wrap'
      }}>
        {[
          { label: 'Calories', value: `${calories}`, unit: 'kcal', color: accent },
          { label: 'Protein', value: `${protein}`, unit: 'g', color: '#007AFF' },
          { label: 'Carbs', value: `${carbs}`, unit: 'g', color: '#FF9500' },
          { label: 'Fats', value: `${fats}`, unit: 'g', color: '#FF3B30' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{
            background: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.04)',
            borderRadius: '12px', padding: '10px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '64px', flex: 1,
          }}>
            <span style={{
              fontSize: '1.1rem', fontWeight: 800,
              color, fontFamily: FONT, lineHeight: 1
            }}>
              {value}<span style={{ fontSize: '0.65rem', marginLeft: '1px' }}>{unit}</span>
            </span>
            <span style={{
              fontSize: '0.65rem', color: 'var(--color-text-faint)', fontWeight: 600,
              fontFamily: FONT, marginTop: '4px',
              letterSpacing: '0.3px', textTransform: 'uppercase'
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Ingredients preview */}
      {meal?.food_item?.ingredients?.length > 0 && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <p style={{
            fontSize: '0.7rem', color: 'var(--color-text-faint)',
            fontFamily: FONT, letterSpacing: '0.5px',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px'
          }}>
            Ingredients
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {meal.food_item.ingredients.slice(0, 5).map((ing, i) => (
              <span key={i} style={ingTag}>
                {typeof ing === 'object' ? ing.name : ing}
              </span>
            ))}
            {meal.food_item.ingredients.length > 5 && (
              <span style={ingTag}>+{meal.food_item.ingredients.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
        <button
          onClick={onViewDetail}
          style={{
            flex: 1, padding: '14px',
            background: 'var(--color-accent)', color: '#ffffff',
            border: 'none', borderRadius: '16px',
            fontSize: '0.9rem', fontWeight: 700,
            fontFamily: FONT, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(52,199,89,0.3)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}>
          View Nutrition Details
        </button>
      </div>
    </div>
  )
}
