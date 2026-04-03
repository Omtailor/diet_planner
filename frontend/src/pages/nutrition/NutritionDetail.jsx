import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { mealService } from '../../services/mealService'

// ─── Flower UI ─────────────────────────────────────────────────

function FlowerUI({ meal }) {
  if (!meal?.food_item) return null

  const fi = meal.food_item
  const cal = meal.calories || 0
  const protein = meal.protein_g || 0
  const carbs = meal.carbs_g || 0
  const fats = meal.fats_g || 0
  const fiber = fi?.fiber_g || 0

  const total = protein + carbs + fats + fiber || 1
  const items = [
    {
      label: 'Protein', value: protein, unit: 'g',
      pct: Math.round((protein / total) * 100), color: '#60B8FF'
    },
    {
      label: 'Carbs', value: carbs, unit: 'g',
      pct: Math.round((carbs / total) * 100), color: '#FFA726'
    },
    {
      label: 'Fats', value: fats, unit: 'g',
      pct: Math.round((fats / total) * 100), color: '#FF4D4D'
    },
    {
      label: 'Fiber', value: fiber, unit: 'g',
      pct: Math.round((fiber / total) * 100), color: '#4CAF50'
    },
    {
      label: 'Calories', value: cal, unit: 'kcal',
      pct: null, color: '#C8F135'
    },
  ]

  // Petal positions (angles in degrees, 0 = top)
  const petalAngles = [-90, -30, 30, 90, 150, 210]
  const petalItems = items.slice(0, 5)
  const centerR = 56
  const petalDist = 108

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px' }}>
      {/* SVG Flower */}
      <div style={{ position: 'relative', width: '300px', height: '300px' }}>
        <svg width="300" height="300" viewBox="0 0 300 300" style={{ position: 'absolute', inset: 0 }}>
          {/* Petal shadows/glow */}
          <defs>
            <radialGradient id="petalGrad0" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#60B8FF" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#60B8FF" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="petalGrad1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FFA726" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FFA726" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="petalGrad2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF4D4D" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#FF4D4D" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="petalGrad3" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#4CAF50" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#4CAF50" stopOpacity="0.05" />
            </radialGradient>
            <radialGradient id="petalGrad4" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#C8F135" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#C8F135" stopOpacity="0.05" />
            </radialGradient>
          </defs>

          {/* Draw 5 petals */}
          {petalItems.map((item, i) => {
            const angleDeg = petalAngles[i]
            const angleRad = (angleDeg * Math.PI) / 180
            const cx = 150 + Math.cos(angleRad) * petalDist * 0.58
            const cy = 150 + Math.sin(angleRad) * petalDist * 0.58
            return (
              <ellipse
                key={i}
                cx={cx} cy={cy}
                rx="46" ry="58"
                fill={`url(#petalGrad${i})`}
                stroke={item.color}
                strokeWidth="1.5"
                strokeOpacity="0.4"
                transform={`rotate(${angleDeg + 90}, ${cx}, ${cy})`}
                style={{
                  filter: `drop-shadow(0 0 8px ${item.color}40)`,
                }}
              />
            )
          })}

          {/* Center circle */}
          <circle cx="150" cy="150" r={centerR}
            fill="var(--bg-surface-2)"
            stroke="var(--border)"
            strokeWidth="2" />

          {/* Center emoji */}
          <text x="150" y="155" textAnchor="middle"
            fontSize="32" dominantBaseline="middle">
            🍽️
          </text>
        </svg>

        {/* Floating labels around petals */}
        {petalItems.map((item, i) => {
          const angleDeg = petalAngles[i]
          const angleRad = (angleDeg * Math.PI) / 180
          const labelDist = petalDist * 1.05
          const lx = 150 + Math.cos(angleRad) * labelDist
          const ly = 150 + Math.sin(angleRad) * labelDist

          // Convert SVG coords to % for absolute positioning
          const leftPct = (lx / 300) * 100
          const topPct = (ly / 300) * 100

          return (
            <div key={i} style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '1px',
              pointerEvents: 'none',
            }}>
              {item.pct !== null && (
                <span style={{
                  fontSize: '0.9rem', fontWeight: 800,
                  color: item.color, fontFamily: 'Satoshi, sans-serif',
                  lineHeight: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}>
                  {item.pct}%
                </span>
              )}
              <span style={{
                fontSize: '0.65rem', fontWeight: 600,
                color: 'var(--text-secondary)',
                fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.3px',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                {item.label}
              </span>
              <span style={{
                fontSize: '0.7rem', fontWeight: 700,
                color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif',
                textShadow: '0 1px 4px rgba(0,0,0,0.8)',
              }}>
                {item.value}{item.unit}
              </span>
            </div>
          )
        })}
      </div>

      {/* Macro detail list */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(({ label, value, unit, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '12px', padding: '12px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '10px', height: '10px',
                background: color, borderRadius: '50%', flexShrink: 0,
                boxShadow: `0 0 6px ${color}80`,
              }} />
              <span style={{
                fontSize: '0.875rem', color: 'var(--text-secondary)',
                fontFamily: 'Satoshi, sans-serif'
              }}>{label}</span>
            </div>
            <span style={{
              fontSize: '0.9375rem', fontWeight: 700,
              color, fontFamily: 'Satoshi, sans-serif'
            }}>
              {value} {unit}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Ingredient Detail ─────────────────────────────────────────

function IngredientsSection({ ingredients }) {
  if (!ingredients?.length) return null
  return (
    <div style={card}>
      <p style={sectionLabel}>Ingredients</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
        {ingredients.map((ing, i) => {
          const name = typeof ing === 'object' ? ing.name : ing
          const qty = typeof ing === 'object' ? `${ing.quantity || ''}${ing.unit || ''}` : ''
          return (
            <div key={i} style={ingChip}>
              <span style={{
                fontSize: '0.8125rem', fontWeight: 600,
                color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif'
              }}>
                {name}
              </span>
              {qty && (
                <span style={{
                  fontSize: '0.7rem', color: 'var(--text-faint)',
                  fontFamily: 'Satoshi, sans-serif'
                }}>{qty}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ingChip = {
  display: 'flex', flexDirection: 'column',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '10px', padding: '8px 12px',
}

// ─── Main NutritionDetail ──────────────────────────────────────

function NutritionDetail() {
  const { date } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const initSlot = location.state?.slot || 'breakfast'
  const [dayMeal, setDayMeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSlot, setActiveSlot] = useState(initSlot)

  useEffect(() => { fetchDay() }, [date])

  const fetchDay = async () => {
    setLoading(true)
    try {
      const res = await mealService.getDayMeal(date)
      setDayMeal(res.data)
    } catch {
      setDayMeal(null)
    } finally {
      setLoading(false)
    }
  }

  const getMeal = (slot) => dayMeal?.meal_slots?.find(m => m.slot === slot)
  const currentMeal = getMeal(activeSlot)

  const slots = [
    { key: 'breakfast', icon: '🌅', label: 'Breakfast' },
    { key: 'lunch', icon: '☀️', label: 'Lunch' },
    { key: 'dinner', icon: '🌙', label: 'Dinner' },
  ]

  return (
    <div style={pageWrap}>

      {/* ── Back Header ── */}
      <div style={backHeader}>
        <button onClick={() => navigate(-1)} style={backBtn}>
          <ChevronLeft size={20} color="var(--text-primary)" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '1.1rem', fontWeight: 600,
            color: 'var(--text-primary)', letterSpacing: '-0.2px'
          }}>
            Nutrition Detail
          </p>
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-secondary)',
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {new Date(date).toLocaleDateString('en-IN',
              { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ width: '38px' }} />
      </div>

      {/* ── Slot Tabs ── */}
      <div style={slotTabs}>
        {slots.map(({ key, icon, label }) => (
          <button key={key}
            onClick={() => setActiveSlot(key)}
            style={{
              flex: 1, padding: '10px 4px',
              background: activeSlot === key ? 'var(--accent)' : 'var(--bg-surface)',
              border: '1px solid',
              borderColor: activeSlot === key ? 'var(--accent)' : 'var(--border)',
              borderRadius: '12px',
              fontSize: '0.8125rem', fontWeight: activeSlot === key ? 700 : 500,
              color: activeSlot === key ? '#0A0A0A' : 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', cursor: 'pointer',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px',
            }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{
            width: '300px', height: '300px', margin: '0 auto',
            background: 'var(--bg-surface-3)', borderRadius: '50%',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={shimmerStyle} />
          </div>
        </div>
      ) : currentMeal ? (
        <>
          {/* Meal name header */}
          <div style={card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '52px', height: '52px',
                background: 'var(--bg-surface-2)', borderRadius: '14px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.75rem', flexShrink: 0
              }}>
                {activeSlot === 'breakfast' ? '🌅' : activeSlot === 'lunch' ? '☀️' : '🌙'}
              </div>
              <div>
                <p style={{
                  fontSize: '0.7rem', fontWeight: 700,
                  color: 'var(--text-faint)', letterSpacing: '1px',
                  textTransform: 'uppercase', fontFamily: 'Satoshi, sans-serif'
                }}>
                  {activeSlot}
                </p>
                <h2 style={{
                  fontFamily: 'Clash Display, sans-serif',
                  fontSize: '1.25rem', fontWeight: 600,
                  color: 'var(--text-primary)', letterSpacing: '-0.3px',
                  lineHeight: 1.2
                }}>
                  {currentMeal.food_item?.name}
                </h2>
                {currentMeal.food_item?.serving_size && (
                  <p style={{
                    fontSize: '0.8rem', color: 'var(--text-secondary)',
                    fontFamily: 'Satoshi, sans-serif', marginTop: '2px'
                  }}>
                    {currentMeal.quantity} × {currentMeal.food_item.serving_size}
                    {currentMeal.food_item.serving_unit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🌸 Flower UI */}
          <div style={{ ...card, alignItems: 'center' }}>
            <p style={{ ...sectionLabel, marginBottom: '16px', textAlign: 'center' }}>
              Nutrient Breakdown 🌸
            </p>
            <FlowerUI meal={currentMeal} />
          </div>

          {/* Ingredients */}
          <IngredientsSection
            ingredients={currentMeal.food_item?.ingredients} />

          {/* Diet flags */}
          <div style={card}>
            <p style={sectionLabel}>Diet Info</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
              {currentMeal.food_item?.is_jain_friendly && (
                <span style={dietTag}>🌿 Jain Friendly</span>
              )}
              {currentMeal.food_item?.is_fasting_friendly && (
                <span style={dietTag}>🙏 Fasting Safe</span>
              )}
              {currentMeal.food_item?.diet_type && (
                <span style={dietTag}>
                  {currentMeal.food_item.diet_type === 'non_veg' ? '🍗' : '🥦'}{' '}
                  {currentMeal.food_item.diet_type.replace('_', ' ')}
                </span>
              )}
              {currentMeal.food_item?.category && (
                <span style={dietTag}>
                  📂 {currentMeal.food_item.category}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={emptyState}>
          <span style={{ fontSize: '3rem' }}>🌸</span>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)',
            fontFamily: 'Satoshi, sans-serif', textAlign: 'center'
          }}>
            No meal data for this slot
          </p>
        </div>
      )}

      <div style={{ height: '8px' }} />
      <style>{`
        @keyframes shimmer{
          0%{transform:translateX(-100%)}
          100%{transform:translateX(100%)}
        }
      `}</style>
    </div>
  )
}

const pageWrap = {
  display: 'flex', flexDirection: 'column',
  gap: '14px', padding: '12px 16px',
}
const backHeader = {
  display: 'flex', alignItems: 'center', gap: '8px',
}
const backBtn = {
  width: '38px', height: '38px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', flexShrink: 0,
}
const slotTabs = { display: 'flex', gap: '8px' }
const card = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '18px', padding: '18px 16px',
  display: 'flex', flexDirection: 'column',
}
const sectionLabel = {
  fontSize: '0.7rem', fontWeight: 700,
  color: 'var(--text-faint)', letterSpacing: '1px',
  textTransform: 'uppercase', fontFamily: 'Satoshi, sans-serif',
}
const dietTag = {
  fontSize: '0.8125rem', fontWeight: 600,
  color: 'var(--text-secondary)',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '999px', padding: '5px 12px',
  fontFamily: 'Satoshi, sans-serif',
}
const emptyState = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: '12px', padding: '48px 20px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '22px',
}
const shimmerStyle = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%)',
  animation: 'shimmer 1.5s ease-in-out infinite',
}

export default NutritionDetail