import { useState, useEffect } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { mealService } from '../../services/mealService'

// ─── Style Tokens ──────────────────────────────────────────────
const FONT = "'General Sans', sans-serif";

const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

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
      pct: Math.round((protein / total) * 100), color: '#C8F135' // Lime Green
    },
    {
      label: 'Carbs', value: carbs, unit: 'g',
      pct: Math.round((carbs / total) * 100), color: '#60B8FF' // Sky Blue
    },
    {
      label: 'Fats', value: fats, unit: 'g',
      pct: Math.round((fats / total) * 100), color: '#FF4D4D' // Coral Red
    },
    {
      label: 'Fiber', value: fiber, unit: 'g',
      pct: Math.round((fiber / total) * 100), color: '#FFA726' // Orange
    },
    {
      label: 'Calories', value: cal, unit: 'kcal',
      pct: null, color: '#AF52DE' // Purple
    },
  ]

  // 5 Petals spaced evenly around the circle
  const petalAngles = [-90, -18, 54, 126, 198]
  
  // SVG Canvas Settings
  const SVG_SIZE = 380
  const CENTER = SVG_SIZE / 2
  const PETAL_DIST = 100  // Distance of petal center from flower center
  const LABEL_DIST = 100 // Distance of text labels from flower center

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '32px' }}>
      
      {/* 🌸 SVG Flower Canvas */}
      <div style={{ position: 'relative', width: `${SVG_SIZE}px`, height: `${SVG_SIZE}px` }}>
        
        <svg width={SVG_SIZE} height={SVG_SIZE} viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`} style={{ position: 'absolute', inset: 0 }}>
          <defs>
            <filter id="petalBlur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="10" result="blur" />
            </filter>
            {items.map((item, i) => {
              const angleRad = (petalAngles[i] * Math.PI) / 180
              const pcx = CENTER + Math.cos(angleRad) * PETAL_DIST
              const pcy = CENTER + Math.sin(angleRad) * PETAL_DIST
              return (
                <radialGradient key={`grad-${i}`} id={`petalGrad-${i}`}
                  gradientUnits="userSpaceOnUse" cx={pcx} cy={pcy} r={100}>
                  <stop offset="0%"   stopColor={item.color} stopOpacity="0.95" />
                  <stop offset="60%"  stopColor={item.color} stopOpacity="0.55" />
                  <stop offset="100%" stopColor={item.color} stopOpacity="0" />
                </radialGradient>
              )
            })}
          </defs>

          {items.map((item, i) => {
            const angleDeg = petalAngles[i]
            const angleRad = (angleDeg * Math.PI) / 180
            const cx = CENTER + Math.cos(angleRad) * PETAL_DIST
            const cy = CENTER + Math.sin(angleRad) * PETAL_DIST
            return (
              <ellipse
                key={`petal-${i}`}
                cx={cx} cy={cy}
                rx={78} ry={72}
                fill={`url(#petalGrad-${i})`}
                transform={`rotate(${angleDeg + 90}, ${cx}, ${cy})`}
                style={{ transition: 'all 0.5s ease' }}
              />
            )
          })}
        </svg>

        {/* Floating Labels over the petals */}
        {items.map((item, i) => {
          const angleDeg = petalAngles[i]
          const angleRad = (angleDeg * Math.PI) / 180
          
          // Calculate exact X/Y for the text using trigonometry
          const lx = CENTER + Math.cos(angleRad) * LABEL_DIST
          const ly = CENTER + Math.sin(angleRad) * LABEL_DIST

          // Convert to percentage for absolute CSS positioning
          const leftPct = (lx / SVG_SIZE) * 100
          const topPct = (ly / SVG_SIZE) * 100

          return (
            <div key={`label-${i}`} style={{
              position: 'absolute',
              left: `${leftPct}%`,
              top: `${topPct}%`,
              transform: 'translate(-50%, -50%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '2px',
              pointerEvents: 'none', zIndex: 2,
            }}>
              {item.pct !== null ? (
                <span style={{
                  fontSize: '1.25rem', fontWeight: 800,
                  color: '#1C1C1E', fontFamily: FONT,
                  lineHeight: 1, textShadow: '0 2px 8px #ffffff, 0 0 4px #ffffff',
                }}>
                  {item.pct}%
                </span>
              ) : (
                <span style={{
                   fontSize: '1.25rem', fontWeight: 800, color: '#1C1C1E', 
                   fontFamily: FONT, lineHeight: 1, textShadow: '0 2px 8px #ffffff'
                }}>
                  {item.value}
                </span>
              )}
              <span style={{
                fontSize: '0.85rem', fontWeight: 700,
                color: '#636366', fontFamily: FONT, 
                letterSpacing: '0.5px', textShadow: '0 1px 4px #ffffff',
              }}>
                {item.label}
              </span>
            </div>
          )
        })}

        {/* Center Salad Bowl */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '90px', height: '90px',
          borderRadius: '50%',
          border: '4px solid #ffffff',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15), inset 0 2px 8px rgba(0,0,0,0.2)',
          background: '#ffffff',
          overflow: 'hidden', zIndex: 10,
        }}>
          <img 
            src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=200&q=80" 
            alt="Salad Bowl" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>
        
        {/* Little Green Leaf Overlay */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, 28px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.3rem', zIndex: 11,
          filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
        }}>
          🌿
        </div>
      </div>

      {/* Macro Detail List */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {items.map(({ label, value, unit, color }) => (
          <div key={label} style={{
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            background: 'rgba(255,255,255,0.6)',
            border: '1px solid rgba(0,0,0,0.04)',
            borderRadius: '16px', padding: '14px 16px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '12px', height: '12px',
                background: color, borderRadius: '50%', flexShrink: 0,
                boxShadow: `0 2px 8px ${color}60`,
              }} />
              <span style={{
                fontSize: '0.95rem', color: 'var(--color-text-muted)',
                fontFamily: FONT, fontWeight: 600
              }}>{label}</span>
            </div>
            <span style={{
              fontSize: '1rem', fontWeight: 800,
              color: 'var(--color-text)', fontFamily: FONT
            }}>
              {value} <span style={{fontSize: '0.8rem', color: 'var(--color-text-faint)'}}>{unit}</span>
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
    <div style={S.card}>
      <p style={S.sectionLabel}>Ingredients</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
        {ingredients.map((ing, i) => {
          const name = typeof ing === 'object' ? ing.name : ing
          const qty = typeof ing === 'object' ? `${ing.quantity || ''}${ing.unit || ''}` : ''
          return (
            <div key={i} style={S.ingChip}>
              <span style={{
                fontSize: '0.9rem', fontWeight: 700,
                color: 'var(--color-text)', fontFamily: FONT
              }}>
                {name}
              </span>
              {qty && (
                <span style={{
                  fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 500,
                  fontFamily: FONT, marginTop: '2px'
                }}>{qty}</span>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main NutritionDetail ──────────────────────────────────────

export default function NutritionDetail() {
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
    <div style={S.pageWrap}>

      {/* ── Back Header ── */}
      <div style={S.backHeader}>
        <button onClick={() => navigate(-1)} style={S.backBtn}>
          <ChevronLeft size={22} color="var(--color-text)" />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <p style={{
            fontFamily: FONT,
            fontSize: '1.2rem', fontWeight: 800,
            color: 'var(--color-text)', letterSpacing: '-0.2px'
          }}>
            Nutrition Detail
          </p>
          <p style={{
            fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
            fontFamily: FONT, marginTop: '2px'
          }}>
            {new Date(date).toLocaleDateString('en-IN',
              { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div style={{ width: '44px' }} /> {/* Balance width for center text */}
      </div>

      {/* ── Slot Tabs ── */}
      <div style={S.slotTabs}>
        {slots.map(({ key, icon, label }) => (
          <button key={key}
            onClick={() => setActiveSlot(key)}
            style={{
              flex: 1, padding: '12px 6px',
              background: activeSlot === key ? 'var(--color-accent)' : 'rgba(255,255,255,0.4)',
              border: '1px solid',
              borderColor: activeSlot === key ? 'var(--color-accent)' : 'rgba(0,0,0,0.04)',
              borderRadius: '16px',
              fontSize: '0.85rem', fontWeight: activeSlot === key ? 800 : 600,
              color: activeSlot === key ? '#ffffff' : 'var(--color-text-muted)',
              fontFamily: FONT, cursor: 'pointer',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              boxShadow: activeSlot === key ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
            }}>
            {icon} {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '20px' }}>
          <div style={{
            width: '320px', height: '320px', margin: '0 auto',
            background: 'rgba(0,0,0,0.05)', borderRadius: '50%',
            overflow: 'hidden', position: 'relative'
          }}>
            <div style={S.shimmerStyle} />
          </div>
        </div>
      ) : currentMeal ? (
        <>
          {/* Meal name header */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{
                width: '60px', height: '60px',
                background: 'rgba(255,255,255,0.6)', borderRadius: '18px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.8rem', flexShrink: 0,
                boxShadow: '0 4px 12px rgba(0,0,0,0.04)'
              }}>
                {activeSlot === 'breakfast' ? '🌅' : activeSlot === 'lunch' ? '☀️' : '🌙'}
              </div>
              <div>
                <p style={{
                  fontSize: '0.75rem', fontWeight: 800,
                  color: 'var(--color-accent)', letterSpacing: '1px',
                  textTransform: 'uppercase', fontFamily: FONT
                }}>
                  {activeSlot}
                </p>
                <h2 style={{
                  fontFamily: FONT,
                  fontSize: '1.4rem', fontWeight: 800,
                  color: 'var(--color-text)', letterSpacing: '-0.3px',
                  lineHeight: 1.2, marginTop: '2px'
                }}>
                  {currentMeal.food_item?.name}
                </h2>
                {currentMeal.food_item?.serving_size && (
                  <p style={{
                    fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500,
                    fontFamily: FONT, marginTop: '4px'
                  }}>
                    {currentMeal.quantity} × {currentMeal.food_item.serving_size}
                    {currentMeal.food_item.serving_unit}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 🌸 Flower UI */}
          <div style={{ ...S.card, alignItems: 'center', padding: '32px 16px' }}>
            <p style={{ ...S.sectionLabel, marginBottom: '24px', textAlign: 'center' }}>
              Nutrient Breakdown 🌸
            </p>
            <FlowerUI meal={currentMeal} />
          </div>

          {/* Ingredients */}
          <IngredientsSection
            ingredients={currentMeal.food_item?.ingredients} />

          {/* Diet flags */}
          <div style={S.card}>
            <p style={S.sectionLabel}>Diet Info</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' }}>
              {currentMeal.food_item?.is_jain_friendly && (
                <span style={S.dietTag}>🌿 Jain Friendly</span>
              )}
              {currentMeal.food_item?.is_fasting_friendly && (
                <span style={S.dietTag}>🙏 Fasting Safe</span>
              )}
              {currentMeal.food_item?.diet_type && (
                <span style={S.dietTag}>
                  {currentMeal.food_item.diet_type === 'non_veg' ? '🍗 ' : '🥦 '}
                  {currentMeal.food_item.diet_type.replace('_', ' ')}
                </span>
              )}
              {currentMeal.food_item?.category && (
                <span style={S.dietTag}>
                  📂 {currentMeal.food_item.category}
                </span>
              )}
            </div>
          </div>
        </>
      ) : (
        <div style={S.emptyState}>
          <span style={{ fontSize: '3.5rem' }}>🌸</span>
          <p style={{
            fontSize: '1.2rem', color: 'var(--color-text)', fontWeight: 800,
            fontFamily: FONT, textAlign: 'center', marginTop: '8px'
          }}>
            No meal data for this slot
          </p>
        </div>
      )}

      <div style={{ height: '16px' }} />
      
      {/* Global CSS mapped to Theme */}
      <style>{`
        :root {
          --color-accent: #34C759;
          --color-text: #1C1C1E;
          --color-text-muted: #636366;
          --color-text-faint: #8E8E93;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
      `}</style>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────
const S = {
  pageWrap: {
    display: 'flex', flexDirection: 'column',
    gap: '16px', padding: '16px',
  },
  backHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
  },
  backBtn: {
    width: '44px', height: '44px',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', flexShrink: 0,
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  slotTabs: { 
    ...GLASS_WHITE, padding: '8px', borderRadius: '24px',
    display: 'flex', gap: '8px' 
  },
  card: {
    ...GLASS_WHITE,
    borderRadius: '24px', padding: '24px',
    display: 'flex', flexDirection: 'column',
  },
  sectionLabel: {
    fontSize: '0.8rem', fontWeight: 800,
    color: 'var(--color-text-muted)', letterSpacing: '1px',
    textTransform: 'uppercase', fontFamily: FONT,
  },
  ingChip: {
    display: 'flex', flexDirection: 'column',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '16px', padding: '12px 16px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  dietTag: {
    fontSize: '0.9rem', fontWeight: 700,
    color: 'var(--color-text-muted)',
    background: 'rgba(0,0,0,0.03)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '999px', padding: '6px 14px',
    fontFamily: FONT, textTransform: 'capitalize'
  },
  emptyState: {
    ...GLASS_WHITE,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '12px', padding: '60px 20px',
    borderRadius: '24px', marginTop: '20px'
  },
  shimmerStyle: {
    position: 'absolute', inset: 0,
    background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.6) 50%,transparent 100%)',
    animation: 'shimmer 1.5s ease-in-out infinite',
  }
}