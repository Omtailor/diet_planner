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

const FONT = 'General Sans, sans-serif'

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
  "Fuel your body like the champion you are. 🥗",
  "Consistency beats intensity every single time. ⏱️",
  "One healthy choice leads to another. 🍎",
  "You are one workout away from a good mood. 😊",
  "The pain of discipline is far less than the pain of regret. 🧠",
  "Strong is the new healthy. 💚",
  "Make your health your hobby. 🏃",
  "Today's effort is tomorrow's result. 🌅",
  "Don't wish for a good body. Work for it. 🏋️",
  "What you eat in private, you wear in public. 👀",
  "Your health is an investment, not an expense. 💰",
  "A little progress each day adds up to big results. 📊",
  "Be stronger than your excuses. 🚫",
  "Success starts with self-discipline. 🔑",
  "Hydrate. Nourish. Move. Rest. Repeat. 💧",
  "You didn't come this far to only come this far. 🚀",
  "Take care of your body. It's the only place you have to live. 🏡",
  "Rome wasn't built in a day, but they were consistent. 🏛️",
  "Sweat now, shine later. ✨",
  "Your only competition is who you were yesterday. 🪞",
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

/** Profile payload has no `name` on UserProfile; API adds username & email. */
function profileGreetingName(profile) {
  if (!profile) return 'there'
  const fullName = (profile.name || '').trim()
  if (fullName) return fullName.split(/\s+/)[0]
  const first = (profile.first_name || '').trim()
  if (first) return first.split(/\s+/)[0]
  const u = (profile.username || '').trim()
  if (u) return u
  const email = (profile.email || '').trim()
  const local = email.split('@')[0]
  if (local) return local
  return 'there'
}

function profileAvatarInitial(profile) {
  const token = profileGreetingName(profile)
  if (token === 'there') return 'U'
  return token[0].toUpperCase()
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
  if (bmi < 25) return { label: 'Normal', color: 'var(--color-accent)' }
  if (bmi < 30) return { label: 'Overweight', color: '#e09a2e' }
  return { label: 'Obese', color: '#e05252' }
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
  const pct = Math.min(consumed / target, 1)
  const r = 54
  const circ = 2 * Math.PI * r
  const dash = pct * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="148" height="148" viewBox="0 0 148 148"
        style={{ filter: 'drop-shadow(0 0 8px rgba(76,175,80,0.4))' }}>
        <defs>
          <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4CAF50" />
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
          fill="var(--color-text)" fontSize="26" fontWeight="700"
          fontFamily="'General Sans', sans-serif">
          {animated}
        </text>
        <text x="74" y="84" textAnchor="middle"
          fill="var(--color-text-faint)" fontSize="13"
          fontFamily="'General Sans', sans-serif">
          of {target} kcal
        </text>
        <text x="74" y="99" textAnchor="middle"
          fill="var(--color-text-muted)" fontSize="12"
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
          fontSize: '0.8rem', color: 'var(--color-text-muted)',
          fontFamily: FONT, fontWeight: 600,
          textTransform: 'uppercase', letterSpacing: '0.6px',
        }}>{label}</span>
        <span style={{
          fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)',
          fontFamily: FONT,
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
    lunch: { emoji: '☀️', label: 'Lunch' },
    dinner: { emoji: '🌙', label: 'Dinner' },
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

const mealCardStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.80)',
  borderRadius: '20px',
  padding: '16px',
  cursor: 'pointer',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
  animation: 'mealSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
}

const mealThumb = {
  width: '48px', height: '48px',
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: '14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}

// ─── Weight Card ───────────────────────────────────────────────

function WeightCard({ profile, onUpdate }) {
  const current = profile?.weight_kg
  const target = profile?.target_weight_kg
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

  // 28 ticks total, color zones matching the gradient
  const TICKS = 28
  const getTickColor = (i) => {
    const pct = i / (TICKS - 1)
    if (pct < 0.25) return '#60B8FF'   // underweight - blue
    if (pct < 0.50) return '#4CAF50'   // normal - green
    if (pct < 0.75) return '#e09a2e'   // overweight - amber
    return '#e05252'                     // obese - red
  }

  return (
    <div style={glassCard}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p style={sectionLabel}>Your Weight is</p>
        <span style={{
          fontSize: '0.75rem', fontWeight: 600,
          color: cat.color,
          background: `${cat.color}18`,
          border: `1px solid ${cat.color}40`,
          borderRadius: '20px',
          padding: '3px 10px',
          fontFamily: FONT,
        }}>{cat.label}</span>
      </div>

      {/* BMI value */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px', margin: '8px 0 16px' }}>
        <span style={{
          fontFamily: FONT,
          fontSize: '2.75rem', fontWeight: 700,
          color: 'var(--color-text)', lineHeight: 1,
        }}>{bmi || '—'}</span>
        <span style={{
          fontSize: '0.9rem', fontWeight: 500,
          color: 'var(--color-text-muted)',
          fontFamily: FONT,
        }}>BMI</span>
      </div>

      {/* Tick bar with needle */}
      <div style={{ position: 'relative', paddingTop: '14px' }}>
        {/* Needle marker */}
        {bmi && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: `calc(${pos}% - 1px)`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            transition: 'left 700ms cubic-bezier(0.16,1,0.3,1)',
            zIndex: 2,
          }}>
            {/* Triangle needle */}
            <div style={{
              width: 0, height: 0,
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '8px solid var(--color-text)',
            }} />
          </div>
        )}

        {/* Tick marks */}
        <div style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '3px',
          height: '28px',
        }}>
          {Array.from({ length: TICKS }).map((_, i) => {
            const tickPct = i / (TICKS - 1)
            const isNearNeedle = bmi && Math.abs(tickPct * 100 - pos) < 4
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: isNearNeedle ? '28px' : (i % 4 === 0 ? '20px' : '14px'),
                  background: getTickColor(i),
                  borderRadius: '2px',
                  opacity: isNearNeedle ? 1 : 0.75,
                  transition: 'height 600ms ease',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '8px',
      }}>
        {[
          { label: 'Underweight', color: '#60B8FF' },
          { label: 'Normal', color: '#4CAF50' },
          { label: 'Overweight', color: '#e09a2e' },
          { label: 'Obese', color: '#e05252' },
        ].map(({ label, color }) => (
          <span key={label} style={{
            fontSize: '0.72rem',
            color: cat.label === label ? color : 'var(--color-text-faint)',
            fontFamily: FONT,
            fontWeight: cat.label === label ? 700 : 400,
          }}>{label}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Quote Card ────────────────────────────────────────────────

function QuoteCard() {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)

  const nextQuote = () => {
    setVisible(false)
    setTimeout(() => { setIdx(i => (i + 1) % QUOTES.length); setVisible(true) }, 280)
  }

  useEffect(() => {
    const t = setInterval(nextQuote, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={quoteCardStyle} onClick={nextQuote}>
      <p style={{ ...sectionLabel, color: 'var(--color-accent)', marginBottom: '10px' }}>
        Daily Motivation ✨
      </p>
      <p style={{
        fontSize: '1.05rem', color: 'var(--color-text)',
        fontFamily: FONT,
        lineHeight: 1.6, fontStyle: 'italic',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 280ms ease, transform 280ms ease',
      }}>
        "{QUOTES[idx]}"
      </p>
      <p style={{
        fontSize: '0.78rem', color: 'var(--color-text-faint)',
        fontFamily: FONT, marginTop: '10px',
      }}>
        Tap for next quote →
      </p>
    </div>
  )
}

const quoteCardStyle = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
  borderRadius: '24px',
  padding: '20px 18px',
  cursor: 'pointer',
  transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
}

// ─── Weight Modal ──────────────────────────────────────────────

function WeightModal({ current, onClose, onSave }) {
  const [val, setVal] = useState(current || '')
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
          fontFamily: FONT,
          fontSize: '1.3rem', fontWeight: 700,
          color: 'var(--color-text)', marginBottom: '6px',
        }}>Update Weight</h3>
        <p style={{
          fontSize: '0.875rem', color: 'var(--color-text-muted)',
          fontFamily: FONT, marginBottom: '20px',
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
            fontFamily: FONT,
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
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
  borderRadius: '24px',
  padding: '20px 18px',
  transition: 'all 300ms ease',
}

const sectionLabel = {
  fontSize: '0.75rem', fontWeight: 700,
  color: 'var(--color-text-faint)',
  letterSpacing: '1px', textTransform: 'uppercase',
  fontFamily: FONT,
}

const weightRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.80)',
  borderRadius: '16px', padding: '14px 16px',
}

const weightIcon = {
  width: '36px', height: '36px', borderRadius: '9px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
}

const weightLabel = {
  fontSize: '0.8rem', color: 'var(--color-text-muted)',
  fontFamily: FONT, letterSpacing: '0.3px',
}

const weightVal = {
  fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)',
  fontFamily: FONT,
}

const noteText = {
  fontSize: '0.85rem', color: 'var(--color-text-muted)',
  fontFamily: FONT, marginTop: '12px',
  background: 'rgba(255,255,255,0.50)',
  borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5,
}

const accentBtn = {
  fontSize: '0.9rem', fontWeight: 700,
  color: '#ffffff', background: 'var(--color-accent)',
  border: 'none', borderRadius: '16px',
  padding: '14px 20px', cursor: 'pointer',
  fontFamily: FONT,
  transition: 'opacity 180ms ease, transform 150ms ease',
  boxShadow: '0 8px 24px rgba(52,199,89,0.30)',
}

const inputStyle = {
  flex: 1, padding: '13px 16px',
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.70)',
  borderRadius: '12px',
  color: 'var(--color-text)', fontSize: '1rem',
  fontFamily: FONT,
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
  const { profile, fetchProfile, user } = useAuth()
  const [dayMeal, setDayMeal] = useState(null)
  const [loadingMeal, setLoadingMeal] = useState(true)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

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

  // AFTER
  const handleRegenerate = async () => {
    // Guard: no plan exists yet
    if (!dayMeal) {
      toast("Generate a plan first!", {
        icon: "🍽️",
      });
      return;
    }

    setRegenerating(true);
    try {
      await mealService.regenerateDay(today);
      await fetchTodayMeal();
      toast.success("Today's meals refreshed!");
      if (navigator.vibrate) navigator.vibrate([30, 10, 30]);
    } catch {
      toast.error("Failed to regenerate meals");
    } finally {
      setRegenerating(false);
    }
  };

  const getMealSlot = (slot) => dayMeal?.meal_slots?.find(m => m.slot === slot)
  const totalCals = dayMeal?.meal_slots?.reduce((s, m) => s + (m.calories || 0), 0) || 0
  const targetCals = profile?.target_calories || 2000

  const macros = dayMeal?.meal_slots?.reduce((acc, m) => ({
    protein: acc.protein + (m.protein_g || 0),
    carbs: acc.carbs + (m.carbs_g || 0),
    fats: acc.fats + (m.fats_g || 0),
  }), { protein: 0, carbs: 0, fats: 0 }) || { protein: 0, carbs: 0, fats: 0 }

  const status = dayMeal?.status || 'on_track'
  const statusConfig = {
    on_track: { label: 'On Track ✅', color: 'var(--color-accent)' },
    adjusted: { label: 'Adjusted ⚠️', color: '#e09a2e' },
    regenerated: { label: 'Updated 🔄', color: 'var(--color-accent)' },
  }
  const sc = statusConfig[status] || statusConfig.on_track

  const quickActions = [
    {
      icon: <UtensilsCrossed size={22} color="var(--color-accent)" />,
      glow: 'hsla(142, 46%, 42%, 0.15)',
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
      <div style={ambientBg} />

      {/* ── Greeting ── */}
      <div style={greetingSection} className="dash-fadeUp">
        <div>
          <p style={greetingTime}>{formatDate()}</p>
          <h1 style={greetingName}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--color-accent)' }}>
              {profileGreetingName(profile)} 👋
            </span>
          </h1>
        </div>
        <div style={avatarCircle}>
          {profileAvatarInitial(profile)}
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div style={{ ...glassCard, ...statusBannerExtra }} className="dash-fadeUp dash-delay-1">
        <div>
          <p style={sectionLabel}>Today's Target</p>
          <p style={{
            fontFamily: FONT,
            fontSize: '1.9rem', fontWeight: 800,
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
              fontSize: '0.78rem',
              fontFamily: "'Satoshi', sans-serif", fontWeight: 500,
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
              fontSize: '0.72rem', fontWeight: 600,
              color: 'var(--color-text-muted)',
              fontFamily: FONT,
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
          alignItems: 'center', marginBottom: '16px',
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
        :root {
          --color-accent: #34C759;
          --color-text: #1C1C1E;
          --color-text-muted: #636366;
          --color-text-faint: #8E8E93;
        }
        body, #root {
          background: #F2F2F7 !important;
        }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes shimmer { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
        @keyframes dashFadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
        @keyframes mealSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes badgePulse { 0%,100%{opacity:1} 50%{opacity:0.6} }
        .dash-fadeUp { animation: dashFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both }
        .dash-delay-1 { animation-delay: 0.08s }
        .dash-delay-2 { animation-delay: 0.16s }
        .dash-delay-3 { animation-delay: 0.24s }
        .meal-card:hover { background: rgba(255,255,255,0.85) !important; transform: translateX(3px) }
        .meal-card:active { transform: scale(0.98) }
        .quick-tile:hover { transform: translateY(-5px) scale(1.02); box-shadow: 0 12px 28px rgba(0,0,0,0.08); background: rgba(255,255,255,0.85) !important }
        .quick-tile:active { transform: scale(0.97) }
        .spin { animation: spin 0.8s linear infinite }
        .week-strip::-webkit-scrollbar { display: none }
        .glass-input:focus { outline: none; border-color: var(--color-accent) !important; box-shadow: 0 0 0 3px rgba(52,199,89,0.15) !important }
      `}</style>
    </div>
  )
}

// ─── Page Styles ───────────────────────────────────────────────

const pageWrapper = {
  display: 'flex', flexDirection: 'column',
  gap: '16px', padding: '0 16px 100px',
  paddingBottom: '100px',
  position: 'relative',
  fontFamily: FONT,
  minHeight: '100dvh', background: '#F2F2F7',
}

const ambientBg = {
  display: 'none',
}

const greetingSection = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0',
}

const greetingTime = {
  fontSize: '0.85rem', color: 'var(--color-text-faint)',
  fontFamily: FONT, marginBottom: '4px',
}

const greetingName = {
  fontFamily: FONT,
  fontSize: '1.5rem', fontWeight: 800,
  color: 'var(--color-text)', letterSpacing: '-0.3px', lineHeight: 1.2,
}

const avatarCircle = {
  width: '44px', height: '44px',
  background: 'var(--color-accent)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.125rem', fontWeight: 700,
  color: '#ffffff', fontFamily: FONT,
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
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
  alignItems: 'stretch',
}

const quickBtn = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
  borderRadius: '20px', padding: '20px 8px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: '10px', cursor: 'pointer', width: '100%',
  minHeight: '110px',
  transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)',
}

const quickIconWrap = {
  width: '50px', height: '50px',
  borderRadius: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'transform 200ms ease',
}

const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '0.875rem', color: 'var(--color-accent)',
  fontFamily: "'Satoshi', sans-serif",
  fontWeight: 600, padding: '0 0 2px 0',
}

const emptyState = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '8px', padding: '24px 0',
}

export default Dashboard