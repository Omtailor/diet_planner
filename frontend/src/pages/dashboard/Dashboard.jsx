import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ChevronRight, RefreshCw, Loader2,
  UtensilsCrossed, Dumbbell, Scale
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { mealService } from '../../services/mealService'
import { authService } from '../../services/authService'

// ─── Helpers ───────────────────────────────────────────────────

const QUOTES = [
  "Your body can do it. It's your mind you need to convince. 💪",
  "Small steps every day lead to big results. 🌱",
  "Discipline is choosing between what you want now and what you want most. 🎯",
  "Don't stop when you're tired. Stop when you're done. 🔥",
  "The only bad workout is the one that didn't happen. ⚡",
  "You don't have to be extreme, just consistent. 📈",
  "Eat well, move daily, sleep deeply. Repeat. 🔄",
  "Your future self is watching you right now. 👁️",
  "Progress, not perfection. 🏆",
  "Every rep, every meal, every step counts. ✅",
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0]
}

function getBMICategory(bmi) {
  if (!bmi) return { label: 'Unknown', color: 'var(--color-text-faint)' }
  if (bmi < 18.5) return { label: 'Underweight', color: '#60B8FF' }
  if (bmi < 25)   return { label: 'Normal',       color: 'var(--color-accent)' }
  if (bmi < 30)   return { label: 'Overweight',   color: '#e09a2e' }
  return               { label: 'Obese',          color: '#e05252' }
}

function getBMIPosition(bmi) {
  const clamped = Math.min(Math.max(bmi || 22, 10), 40)
  return ((clamped - 10) / 30) * 100
}

// ─── Count-Up Hook ─────────────────────────────────────────────

function useCountUp(target, duration = 1500) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!target) return
    let startTime = null
    const step = (timestamp) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [target])
  return value
}

// ─── Skeleton ──────────────────────────────────────────────────

function SkeletonBlock({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div style={{
      width, height,
      background: 'rgba(160,210,170,0.25)',
      borderRadius: radius,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }} />
    </div>
  )
}

// ─── Calorie Ring ──────────────────────────────────────────────

function CalorieRing({ consumed = 0, target = 2000 }) {
  const animated = useCountUp(consumed)
  const pct  = Math.min(consumed / target, 1)
  const r    = 54
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="148" height="148" viewBox="0 0 148 148"
        style={{ filter: 'drop-shadow(0 0 8px rgba(76,175,80,0.4))' }}>
        <defs>
          <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#4CAF50" />
            <stop offset="100%" stopColor="#1a7a42" />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="74" cy="74" r={r}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth="10" />
        {/* Progress */}
        <circle cx="74" cy="74" r={r}
          fill="none"
          stroke="url(#calorieGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)' }}
        />
        <text x="74" y="68" textAnchor="middle"
          fill="var(--color-text)" fontSize="22" fontWeight="700"
          fontFamily="'General Sans', sans-serif">
          {animated}
        </text>
        <text x="74" y="84" textAnchor="middle"
          fill="var(--color-text-faint)" fontSize="11"
          fontFamily="'General Sans', sans-serif">
          of {target} kcal
        </text>
        <text x="74" y="99" textAnchor="middle"
          fill="var(--color-text-muted)" fontSize="10"
          fontFamily="'General Sans', sans-serif">
          consumed
        </text>
      </svg>
    </div>
  )
}

// ─── Macro Bar ─────────────────────────────────────────────────

function MacroBar({ label, value, max, glowColor, trackColor }) {
  const pct = Math.min((value / max) * 100, 100)
  const [animated, setAnimated] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimated(pct), 100)
    return () => clearTimeout(timer)
  }, [pct])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{
          fontSize: '0.72rem', color: 'var(--color-text-muted)',
          fontFamily: "'General Sans', sans-serif", fontWeight: 500,
          textTransform: 'uppercase', letterSpacing: '0.6px',
        }}>{label}</span>
        <span style={{
          fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text)',
          fontFamily: "'General Sans', sans-serif",
        }}>
          {Math.round(value)}g{' '}
          <span style={{ color: 'var(--color-text-faint)', fontWeight: 400 }}>/ {max}g</span>
        </span>
      </div>
      <div style={{
        height: '4px', background: 'rgba(0,0,0,0.08)',
        borderRadius: '4px', position: 'relative', overflow: 'visible',
      }}>
        <div style={{
          height: '100%', width: `${animated}%`,
          background: trackColor, borderRadius: '4px',
          boxShadow: `0 0 8px ${glowColor}, 0 0 16px ${glowColor}`,
          transition: 'width 900ms cubic-bezier(0.34,1.56,0.64,1)',
          position: 'relative',
        }}>
          {animated > 2 && (
            <div style={{
              position: 'absolute', right: '-1px', top: '50%',
              transform: 'translateY(-50%)',
              width: '2px', height: '10px',
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '2px',
              boxShadow: '0 0 6px rgba(255,255,255,0.9)',
            }} />
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Meal Preview Card ─────────────────────────────────────────

function MealPreviewCard({ slot, meal, onTap, index = 0 }) {
  const config = {
    breakfast: { emoji: '🌅', label: 'Breakfast' },
    lunch:     { emoji: '☀️', label: 'Lunch' },
    dinner:    { emoji: '🌙', label: 'Dinner' },
  }
  const { emoji, label } = config[slot] || { emoji: '🍽️', label: slot }

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
            fontSize: '0.68rem', color: 'var(--color-text-faint)',
            fontFamily: "'General Sans', sans-serif",
            letterSpacing: '0.8px', textTransform: 'uppercase', fontWeight: 600,
          }}>{label}</p>
          <p style={{
            fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)',
            fontFamily: "'General Sans', sans-serif",
            marginTop: '2px', lineHeight: 1.3,
          }}>
            {meal?.food_item?.name || '—'}
          </p>
          {meal?.calories && (
            <p style={{
              fontSize: '0.73rem', color: 'var(--color-text-muted)',
              fontFamily: "'General Sans', sans-serif", marginTop: '2px',
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

const mealCardStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.60)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: '14px',
  padding: '13px 14px',
  cursor: 'pointer',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  animation: 'mealSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
}

const mealThumb = {
  width: '42px', height: '42px',
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.06)',
}

// ─── Weight Card ───────────────────────────────────────────────

function WeightCard({ profile, onUpdate }) {
  const current = profile?.weight_kg
  const target  = profile?.target_weight_kg
  const diff = current && target ? Math.abs(current - target) : 0
  const totalToLose = current && target ? Math.abs(current - target) + 1 : 1
  const progressPct = current && target
    ? Math.min(((totalToLose - diff) / totalToLose) * 100, 100) : 0
  const r2 = 18, circ2 = 2 * Math.PI * r2
  const dash2 = (progressPct / 100) * circ2

  return (
    <div style={glassCard}>
      <p style={sectionLabel}>Weight Tracker</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        <div style={weightRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ ...weightIcon, background: 'rgba(58,158,95,0.12)' }}>🎯</div>
            <div>
              <p style={weightLabel}>Target Weight</p>
              <p style={weightVal}>{target ? `${target} kg` : '—'}</p>
            </div>
          </div>
          {/* Mini ring with pulse on badge */}
          <svg width="48" height="48" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r={r2}
              fill="none" stroke="rgba(0,0,0,0.08)" strokeWidth="4" />
            <circle cx="24" cy="24" r={r2}
              fill="none" stroke="var(--color-accent)" strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${dash2} ${circ2}`}
              strokeDashoffset={circ2 / 4}
              style={{ transition: 'stroke-dasharray 800ms ease' }}
            />
            <text x="24" y="29" textAnchor="middle"
              fill="var(--color-accent)" fontSize="8" fontWeight="700"
              fontFamily="'General Sans', sans-serif"
              style={{ animation: 'badgePulse 2.5s ease-in-out infinite' }}>
              {Math.round(progressPct)}%
            </text>
          </svg>
        </div>

        <div style={weightRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ ...weightIcon, background: 'rgba(255,255,255,0.60)' }}>⚖️</div>
            <div>
              <p style={weightLabel}>Current Weight</p>
              <p style={weightVal}>{current ? `${current} kg` : '—'}</p>
            </div>
          </div>
          <button onClick={onUpdate} style={accentBtn}>Update</button>
        </div>
      </div>
      <p style={noteText}>Update weekly so we can keep adjusting your plan 📊</p>
    </div>
  )
}

// ─── BMI Card ──────────────────────────────────────────────────

function BMICard({ profile }) {
  const bmi = profile?.bmi ? parseFloat(profile.bmi).toFixed(1) : null
  const cat = getBMICategory(bmi)
  const pos = getBMIPosition(bmi)

  return (
    <div style={glassCard}>
      <p style={sectionLabel}>Your BMI</p>
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '2.5rem', fontWeight: 700,
            color: 'var(--color-text)', lineHeight: 1,
          }}>{bmi || '—'}</span>
          <span style={{
            fontSize: '0.875rem', fontWeight: 600, color: cat.color,
            fontFamily: "'General Sans', sans-serif",
          }}>{cat.label}</span>
        </div>

        <div style={{ position: 'relative' }}>
          <div style={{
            height: '10px', borderRadius: '6px',
            background: 'linear-gradient(to right, #60B8FF 0%, #4CAF50 33%, #e09a2e 66%, #e05252 100%)',
          }} />
          {bmi && (
            <div style={{
              position: 'absolute', top: '-5px',
              left: `calc(${pos}% - 6px)`,
              width: '12px', height: '20px',
              background: 'white', borderRadius: '4px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.25)',
              transition: 'left 700ms cubic-bezier(0.16,1,0.3,1)',
              animation: 'bmiBreath 2.5s ease-in-out infinite',
            }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['Underweight', 'Normal', 'Overweight', 'Obese'].map(l => (
            <span key={l} style={{
              fontSize: '0.6rem', color: 'var(--color-text-faint)',
              fontFamily: "'General Sans', sans-serif",
            }}>{l}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Quote Card ────────────────────────────────────────────────

function QuoteCard() {
  const [idx, setIdx]         = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)

  const nextQuote = () => {
    setVisible(false)
    setTimeout(() => { setIdx(i => (i + 1) % QUOTES.length); setVisible(true) }, 280)
  }

  useEffect(() => {
    const t = setInterval(nextQuote, 8000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={quoteCardStyle} onClick={nextQuote}>
      <p style={{ ...sectionLabel, color: 'var(--color-accent)', marginBottom: '10px' }}>
        Daily Motivation ✨
      </p>
      <p style={{
        fontSize: '0.9375rem', color: 'var(--color-text)',
        fontFamily: "'General Sans', sans-serif",
        lineHeight: 1.6, fontStyle: 'italic',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 280ms ease, transform 280ms ease',
      }}>
        "{QUOTES[idx]}"
      </p>
      <p style={{
        fontSize: '0.7rem', color: 'var(--color-text-faint)',
        fontFamily: "'General Sans', sans-serif", marginTop: '10px',
      }}>
        Tap for next quote →
      </p>
    </div>
  )
}

const quoteCardStyle = {
  background: 'linear-gradient(135deg, rgba(76,175,80,0.07), rgba(255,255,255,0.55))',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 8px 32px rgba(30,80,45,0.08)',
  borderRadius: '18px',
  padding: '18px 16px',
  cursor: 'pointer',
  transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
}

// ─── Weight Modal ──────────────────────────────────────────────

function WeightModal({ current, onClose, onSave }) {
  const [val, setVal]         = useState(current || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!val || isNaN(val)) { toast.error('Enter a valid weight'); return }
    setLoading(true)
    try {
      await authService.updateProfile({ weight_kg: parseFloat(val) })
      toast.success('Weight updated! 📊')
      onSave(); onClose()
    } catch { toast.error('Failed to update weight') }
    finally { setLoading(false) }
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e => e.stopPropagation()}>
        <div style={modalHandle} />
        <h3 style={{
          fontFamily: "'General Sans', sans-serif",
          fontSize: '1.25rem', fontWeight: 700,
          color: 'var(--color-text)', marginBottom: '6px',
        }}>Update Weight</h3>
        <p style={{
          fontSize: '0.875rem', color: 'var(--color-text-muted)',
          fontFamily: "'General Sans', sans-serif", marginBottom: '20px',
        }}>Keep your plan accurate 📈</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            type="number" value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            placeholder="e.g. 68.5"
            style={inputStyle}
            className="glass-input"
          />
          <span style={{
            fontSize: '1rem', fontWeight: 600,
            color: 'var(--color-text-muted)',
            fontFamily: "'General Sans', sans-serif",
          }}>kg</span>
        </div>
        <button onClick={handleSave} disabled={loading}
          style={{
            ...accentBtn, width: '100%', padding: '14px',
            borderRadius: '12px', fontSize: '1rem',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
          }}>
          {loading
            ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
            : 'Save Weight'}
        </button>
      </div>
    </div>
  )
}

// ─── Shared Tokens ─────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255,255,255,0.60)',
  backdropFilter: 'blur(25px) saturate(200%)',
  WebkitBackdropFilter: 'blur(25px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.04)',
  borderRadius: '18px',
  padding: '18px 16px',
  transition: 'all 300ms ease',
}

const sectionLabel = {
  fontSize: '0.68rem', fontWeight: 700,
  color: 'var(--color-text-faint)',
  letterSpacing: '1px', textTransform: 'uppercase',
  fontFamily: "'General Sans', sans-serif",
}

const weightRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'rgba(255,255,255,0.55)',
  border: '1px solid rgba(255,255,255,0.70)',
  borderRadius: '12px', padding: '12px 14px',
}

const weightIcon = {
  width: '36px', height: '36px', borderRadius: '9px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
}

const weightLabel = {
  fontSize: '0.7rem', color: 'var(--color-text-faint)',
  fontFamily: "'General Sans', sans-serif", letterSpacing: '0.3px',
}

const weightVal = {
  fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)',
  fontFamily: "'General Sans', sans-serif",
}

const noteText = {
  fontSize: '0.75rem', color: 'var(--color-text-muted)',
  fontFamily: "'General Sans', sans-serif", marginTop: '12px',
  background: 'rgba(255,255,255,0.50)',
  borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5,
}

const accentBtn = {
  fontSize: '0.8125rem', fontWeight: 600,
  color: '#ffffff', background: 'var(--color-accent)',
  border: 'none', borderRadius: '8px',
  padding: '6px 14px', cursor: 'pointer',
  fontFamily: "'General Sans', sans-serif",
  transition: 'background 200ms ease, transform 150ms ease',
  boxShadow: '0 2px 8px rgba(58,158,95,0.30)',
}

const inputStyle = {
  flex: 1, padding: '13px 16px',
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.70)',
  borderRadius: '12px',
  color: 'var(--color-text)', fontSize: '1rem',
  fontFamily: "'General Sans', sans-serif",
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
}

const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(15,31,18,0.35)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 200,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}

const modalSheet = {
  width: '100%', maxWidth: '480px',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(30px) saturate(200%)',
  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: '24px 24px 0 0',
  padding: '12px 24px 32px',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
}

const modalHandle = {
  width: '40px', height: '4px',
  background: 'rgba(0,0,0,0.10)',
  borderRadius: '4px', margin: '0 auto 20px',
}

// ─── Main Dashboard ────────────────────────────────────────────

function Dashboard() {
  const navigate = useNavigate()
  const { profile, fetchProfile } = useAuth()
  const [dayMeal, setDayMeal]             = useState(null)
  const [loadingMeal, setLoadingMeal]     = useState(true)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [regenerating, setRegenerating]   = useState(false)

  const today = getTodayStr()

  useEffect(() => { fetchTodayMeal() }, [])

  const fetchTodayMeal = async () => {
    setLoadingMeal(true)
    try {
      const res = await mealService.getDayMeal(today)
      setDayMeal(res.data)
    } catch { setDayMeal(null) }
    finally { setLoadingMeal(false) }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await mealService.regenerateDay(today)
      await fetchTodayMeal()
      toast.success("Today's meals refreshed! 🔄")
      if (navigator.vibrate) navigator.vibrate([30, 10, 30])
    } catch { toast.error('Failed to regenerate meals') }
    finally { setRegenerating(false) }
  }

  const getMealSlot = (slot) => dayMeal?.meal_slots?.find(m => m.slot === slot)
  const totalCals   = dayMeal?.meal_slots?.reduce((s, m) => s + (m.calories || 0), 0) || 0
  const targetCals  = profile?.target_calories || 2000

  const macros = dayMeal?.meal_slots?.reduce((acc, m) => ({
    protein: acc.protein + (m.protein_g || 0),
    carbs:   acc.carbs   + (m.carbs_g   || 0),
    fats:    acc.fats    + (m.fats_g    || 0),
  }), { protein: 0, carbs: 0, fats: 0 }) || { protein: 0, carbs: 0, fats: 0 }

  const status = dayMeal?.status || 'on_track'
  const statusConfig = {
    on_track:    { label: 'On Track ✅',  color: 'var(--color-accent)' },
    adjusted:    { label: 'Adjusted ⚠️', color: '#e09a2e' },
    regenerated: { label: 'Updated 🔄',  color: 'var(--color-accent)' },
  }
  const sc = statusConfig[status] || statusConfig.on_track

  const quickActions = [
    {
      icon: <UtensilsCrossed size={22} color="var(--color-accent)" />,
      glow: 'rgba(58,158,95,0.15)',
      label: 'View Meals',
      action: () => navigate('/nutrition'),
    },
    {
      icon: <Dumbbell size={22} color="#60B8FF" />,
      glow: 'rgba(96,184,255,0.15)',
      label: 'Training',
      action: () => navigate('/training'),
    },
    {
      icon: <Scale size={22} color="#e09a2e" />,
      glow: 'rgba(224,154,46,0.15)',
      label: 'Update Weight',
      action: () => setShowWeightModal(true),
    },
  ]

  return (
    <div style={pageWrapper}>

      {/* ── Ambient Background ── */}
      <div style={ambientBg}>
        <div style={glowTopRight} />
        <div style={glowBottomLeft} />
        <svg style={grainOverlay} width="100%" height="100%">
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.65"
              numOctaves="3" stitchTiles="stitch" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" opacity="0.4" />
        </svg>
      </div>

      {/* ── Greeting ── */}
      <div style={greetingSection} className="dash-fadeUp">
        <div>
          <p style={greetingTime}>{formatDate()}</p>
          <h1 style={greetingName}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--color-accent)' }}>
              {profile?.name?.split(' ')[0] || 'there'} 👋
            </span>
          </h1>
        </div>
        <div style={avatarCircle}>
          {profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div style={{ ...glassCard, ...statusBannerExtra }} className="dash-fadeUp dash-delay-1">
        <div>
          <p style={sectionLabel}>Today's Target</p>
          <p style={{
            fontFamily: "'General Sans', sans-serif",
            fontSize: '1.75rem', fontWeight: 700,
            color: 'var(--color-text)', lineHeight: 1, marginTop: '4px',
          }}>
            {targetCals}
            <span style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--color-text-muted)', marginLeft: '4px',
            }}>kcal</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={sectionLabel}>Status</p>
          <p style={{
            fontSize: '0.875rem', fontWeight: 700, color: sc.color,
            fontFamily: "'General Sans', sans-serif", marginTop: '4px',
          }}>{sc.label}</p>
        </div>
      </div>

      {/* ── Calorie Ring + Macros ── */}
      <div style={glassCard} className="dash-fadeUp dash-delay-2">
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '16px',
        }}>
          <p style={sectionLabel}>Today's Calories</p>
          <button onClick={handleRegenerate} disabled={regenerating} style={regenBtn}>
            {regenerating
              ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <RefreshCw size={13} />}
            <span style={{
              fontSize: '0.72rem',
              fontFamily: "'General Sans', sans-serif", fontWeight: 500,
            }}>Regenerate</span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <CalorieRing consumed={totalCals} target={targetCals} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <MacroBar label="Protein" value={macros.protein}
              max={Math.round(targetCals * 0.30 / 4)}
              trackColor="#60B8FF" glowColor="rgba(96,184,255,0.45)" />
            <MacroBar label="Carbs" value={macros.carbs}
              max={Math.round(targetCals * 0.45 / 4)}
              trackColor="#e09a2e" glowColor="rgba(224,154,46,0.45)" />
            <MacroBar label="Fats" value={macros.fats}
              max={Math.round(targetCals * 0.25 / 9)}
              trackColor="#e05252" glowColor="rgba(224,82,82,0.45)" />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={quickGrid} className="dash-fadeUp dash-delay-3">
        {quickActions.map(({ icon, glow, label, action }) => (
          <button key={label} onClick={action}
            style={quickBtn} className="quick-tile">
            <div style={{ ...quickIconWrap, background: glow }}>
              {icon}
            </div>
            <span style={{
              fontSize: '0.65rem', fontWeight: 500,
              color: 'var(--color-text-muted)',
              fontFamily: "'General Sans', sans-serif",
              textAlign: 'center', lineHeight: 1.3,
              textTransform: 'uppercase', letterSpacing: '0.8px',
            }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Today's Meals ── */}
      <div style={glassCard}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '14px',
        }}>
          <p style={sectionLabel}>Today's Meals</p>
          <button onClick={() => navigate('/nutrition')}
            style={ghostBtn} className="see-all-btn">
            See All <span className="see-all-arrow">→</span>
          </button>
        </div>

        {loadingMeal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => <SkeletonBlock key={i} height="64px" radius="14px" />)}
          </div>
        ) : dayMeal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['breakfast', 'lunch', 'dinner'].map((slot, i) => (
              <MealPreviewCard key={slot} slot={slot} index={i}
                meal={getMealSlot(slot)}
                onTap={() => navigate(`/nutrition/${today}`)} />
            ))}
          </div>
        ) : (
          <div style={emptyState}>
            <span style={{ fontSize: '2rem' }}>🍽️</span>
            <p style={{
              fontSize: '0.9rem', color: 'var(--color-text-muted)',
              fontFamily: "'General Sans', sans-serif", textAlign: 'center',
            }}>No meal plan yet</p>
            <button
              onClick={() => mealService.generatePlan().then(fetchTodayMeal)}
              style={{ ...accentBtn, marginTop: '4px' }}>
              Generate Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Weight Tracker ── */}
      <WeightCard profile={profile} onUpdate={() => setShowWeightModal(true)} />

      {/* ── BMI ── */}
      <BMICard profile={profile} />

      {/* ── Quote ── */}
      <QuoteCard />

      <div style={{ height: '8px' }} />

      {showWeightModal && (
        <WeightModal
          current={profile?.weight_kg}
          onClose={() => setShowWeightModal(false)}
          onSave={fetchProfile}
        />
      )}

      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }

        @keyframes bmiBreath {
          0%,100% { transform: scaleY(1.0); box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
          50%     { transform: scaleY(1.1); box-shadow: 0 4px 16px rgba(255,255,255,0.5); }
        }

        @keyframes badgePulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.6; }
        }

        @keyframes dashFadeUp {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }

        @keyframes mealSlideIn {
          from { opacity:0; transform:translateX(-12px); }
          to   { opacity:1; transform:translateX(0); }
        }

        .dash-fadeUp  { animation: dashFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both; }
        .dash-delay-1 { animation-delay: 0.08s; }
        .dash-delay-2 { animation-delay: 0.16s; }
        .dash-delay-3 { animation-delay: 0.24s; }

        .meal-card:hover  {
          background: rgba(255,255,255,0.80) !important;
          transform: translateX(3px);
        }
        .meal-card:active { transform: scale(0.98); }

        .quick-tile:hover {
          transform: translateY(-5px) scale(1.02);
          box-shadow: 0 12px 28px rgba(0,0,0,0.08);
          background: rgba(255,255,255,0.80) !important;
        }
        .quick-tile:active { transform: scale(0.97); }

        .see-all-btn { position: relative; display: inline-flex; align-items: center; gap: 4px; }
        .see-all-btn::after {
          content: '';
          position: absolute; bottom: -1px; left: 0; right: 100%;
          height: 1px; background: var(--color-accent);
          transition: right 250ms ease;
        }
        .see-all-btn:hover::after { right: 0; }
        .see-all-btn:hover .see-all-arrow {
          animation: arrowBounce 0.5s ease infinite alternate;
        }

        @keyframes arrowBounce {
          from { transform: translateX(0); }
          to   { transform: translateX(4px); }
        }

        .glass-input:focus {
          outline: none;
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 3px rgba(58,158,95,0.15) !important;
        }
        .glass-input::placeholder { color: var(--color-text-faint); }
      `}</style>
    </div>
  )
}

// ─── Page Styles ───────────────────────────────────────────────

const pageWrapper = {
  display: 'flex', flexDirection: 'column',
  gap: '14px', padding: '16px',
  paddingBottom: '100px',
  position: 'relative',
  fontFamily: "'General Sans', sans-serif",
}

const ambientBg = {
  position: 'fixed', inset: 0,
  zIndex: -1, pointerEvents: 'none', overflow: 'hidden',
  background: 'linear-gradient(160deg, #eef7f0 0%, #f5faf6 50%, #e8f4eb 100%)',
}

const glowTopRight = {
  position: 'absolute', top: '-15%', right: '-10%',
  width: '500px', height: '500px', borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(76,175,80,0.14) 0%, transparent 70%)',
  filter: 'blur(60px)',
}

const glowBottomLeft = {
  position: 'absolute', bottom: '-15%', left: '-10%',
  width: '450px', height: '450px', borderRadius: '50%',
  background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, transparent 70%)',
  filter: 'blur(60px)',
}

const grainOverlay = {
  position: 'absolute', inset: 0, opacity: 0.03, pointerEvents: 'none',
}

const greetingSection = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}

const greetingTime = {
  fontSize: '0.8rem', color: 'var(--color-text-faint)',
  fontFamily: "'General Sans', sans-serif", marginBottom: '4px',
}

const greetingName = {
  fontFamily: "'General Sans', sans-serif",
  fontSize: '1.5rem', fontWeight: 700,
  color: 'var(--color-text)', letterSpacing: '-0.3px', lineHeight: 1.2,
}

const avatarCircle = {
  width: '44px', height: '44px',
  background: 'var(--color-accent)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.125rem', fontWeight: 700,
  color: '#ffffff', fontFamily: "'General Sans', sans-serif",
  flexShrink: 0,
  boxShadow: '0 0 20px rgba(76,175,80,0.35)',
}

const statusBannerExtra = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}

const regenBtn = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: '8px', padding: '6px 10px',
  color: 'var(--color-text-muted)', cursor: 'pointer',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  transition: 'all 200ms ease',
}

const quickGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
}

const quickBtn = {
  background: 'rgba(255,255,255,0.60)',
  backdropFilter: 'blur(16px) saturate(180%)',
  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.70)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
  borderRadius: '16px', padding: '18px 8px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '10px', cursor: 'pointer',
  transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)',
}

const quickIconWrap = {
  width: '46px', height: '46px',
  borderRadius: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'transform 200ms ease',
}

const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '0.8rem', color: 'var(--color-accent)',
  fontFamily: "'General Sans', sans-serif",
  fontWeight: 600, padding: '0 0 2px 0',
}

const emptyState = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '8px', padding: '24px 0',
}

export default Dashboard