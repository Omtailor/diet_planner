import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Scale, Dumbbell, ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
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
  if (!bmi) return { label: 'Unknown', color: 'var(--text-faint)' }
  if (bmi < 18.5) return { label: 'Underweight', color: '#60B8FF' }
  if (bmi < 25)   return { label: 'Normal',      color: 'var(--success)' }
  if (bmi < 30)   return { label: 'Overweight',  color: 'var(--warning)' }
  return            { label: 'Obese',            color: 'var(--error)' }
}

function getBMIPosition(bmi) {
  const clamped = Math.min(Math.max(bmi || 22, 10), 40)
  return ((clamped - 10) / 30) * 100
}

// ─── Sub-components ────────────────────────────────────────────

function SkeletonBlock({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div style={{
      width, height,
      background: 'var(--bg-surface-3)',
      borderRadius: radius,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={skeletonShimmer} />
      <style>{`
        @keyframes shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}

const skeletonShimmer = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)',
  animation: 'shimmer 1.5s ease-in-out infinite',
}

function CalorieRing({ consumed = 0, target = 2000 }) {
  const pct   = Math.min(consumed / target, 1)
  const r     = 54
  const circ  = 2 * Math.PI * r
  const dash  = pct * circ

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={r}
          fill="none" stroke="var(--bg-surface-3)" strokeWidth="10" />
        <circle cx="70" cy="70" r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 800ms cubic-bezier(0.16,1,0.3,1)' }}
        />
        <text x="70" y="62" textAnchor="middle"
          fill="var(--text-primary)"
          fontSize="22" fontWeight="700"
          fontFamily="Satoshi, sans-serif">
          {consumed}
        </text>
        <text x="70" y="80" textAnchor="middle"
          fill="var(--text-faint)"
          fontSize="11"
          fontFamily="Satoshi, sans-serif">
          of {target} kcal
        </text>
        <text x="70" y="96" textAnchor="middle"
          fill="var(--text-secondary)"
          fontSize="10"
          fontFamily="Satoshi, sans-serif">
          consumed
        </text>
      </svg>
    </div>
  )
}

function MacroBar({ label, value, max, color }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
          fontFamily: 'Satoshi, sans-serif' }}>{label}</span>
        <span style={{ fontSize: '0.75rem', fontWeight: 600,
          color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif' }}>
          {value}g / {max}g
        </span>
      </div>
      <div style={{ height: '5px', background: 'var(--bg-surface-3)',
        borderRadius: '4px', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pct}%`,
          background: color, borderRadius: '4px',
          transition: 'width 600ms cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
    </div>
  )
}

function MealPreviewCard({ slot, meal, onTap }) {
  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }
  const icon  = icons[slot] || '🍽️'
  const label = slot.charAt(0).toUpperCase() + slot.slice(1)

  return (
    <button onClick={onTap} style={mealCardStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={mealIconBox}>{icon}</div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)',
            fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.5px',
            textTransform: 'uppercase', fontWeight: 600 }}>{label}</p>
          <p style={{ fontSize: '0.9rem', fontWeight: 600,
            color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif',
            marginTop: '2px', lineHeight: 1.3 }}>
            {meal?.food_item?.name || '—'}
          </p>
          {meal?.calories && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', marginTop: '2px' }}>
              ~{Math.round(meal.calories)} kcal
            </p>
          )}
        </div>
        <ChevronRight size={16} color="var(--text-faint)" />
      </div>
    </button>
  )
}

const mealCardStyle = {
  width: '100%', background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)', borderRadius: '14px',
  padding: '14px 16px', cursor: 'pointer',
  transition: 'transform 180ms ease, background 180ms ease',
}

const mealIconBox = {
  width: '40px', height: '40px',
  background: 'var(--bg-surface-3)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.25rem', flexShrink: 0,
}

function WeightCard({ profile, onUpdate }) {
  const current = profile?.weight_kg
  const target  = profile?.target_weight_kg
  const pct     = target && current
    ? Math.min(Math.round(((current - target) / (current - target + 1)) * 100 + 80), 99)
    : 0

  return (
    <div style={card}>
      <p style={sectionLabel}>Weight Tracker</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>
        {/* Target */}
        <div style={weightRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ ...weightIcon, background: 'rgba(200,241,53,0.12)' }}>🎯</div>
            <div>
              <p style={weightLabel}>Target Weight</p>
              <p style={weightVal}>{target ? `${target} kg` : '—'}</p>
            </div>
          </div>
          <div style={weightBadge}>{pct}%</div>
        </div>
        {/* Current */}
        <div style={weightRow}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ ...weightIcon, background: 'rgba(255,255,255,0.06)' }}>⚖️</div>
            <div>
              <p style={weightLabel}>Current Weight</p>
              <p style={weightVal}>{current ? `${current} kg` : '—'}</p>
            </div>
          </div>
          <button onClick={onUpdate} style={updateBtn}>Update</button>
        </div>
      </div>
      <p style={weightNote}>
        Remember to update this at least once a week so we can adjust your plan 📊
      </p>
    </div>
  )
}

const card = {
  background: 'var(--bg-surface)', border: '1px solid var(--border)',
  borderRadius: '18px', padding: '18px 16px',
}
const sectionLabel = {
  fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-faint)',
  letterSpacing: '1px', textTransform: 'uppercase', fontFamily: 'Satoshi, sans-serif',
}
const weightRow = {
  display: 'flex', justifyContent: 'space-between',
  alignItems: 'center', background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)', borderRadius: '12px', padding: '12px 14px',
}
const weightIcon = {
  width: '36px', height: '36px', borderRadius: '9px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
}
const weightLabel = {
  fontSize: '0.7rem', color: 'var(--text-faint)',
  fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.3px',
}
const weightVal = {
  fontSize: '1rem', fontWeight: 700,
  color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif',
}
const weightBadge = {
  fontSize: '0.8125rem', fontWeight: 700,
  color: 'var(--accent)', background: 'rgba(200,241,53,0.1)',
  padding: '4px 10px', borderRadius: '999px', fontFamily: 'Satoshi, sans-serif',
}
const updateBtn = {
  fontSize: '0.8125rem', fontWeight: 600,
  color: '#0A0A0A', background: 'var(--accent)',
  border: 'none', borderRadius: '8px',
  padding: '6px 14px', cursor: 'pointer',
  fontFamily: 'Satoshi, sans-serif',
}
const weightNote = {
  fontSize: '0.75rem', color: 'var(--text-secondary)',
  fontFamily: 'Satoshi, sans-serif', marginTop: '12px',
  background: 'rgba(255,255,255,0.03)', borderRadius: '10px',
  padding: '10px 12px', lineHeight: 1.5,
}

function BMICard({ profile }) {
  const bmi = profile?.bmi ? parseFloat(profile.bmi).toFixed(1) : null
  const cat = getBMICategory(bmi)
  const pos = getBMIPosition(bmi)

  return (
    <div style={card}>
      <p style={sectionLabel}>Your BMI</p>
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
          <span style={{ fontFamily: 'Clash Display, sans-serif',
            fontSize: '2.5rem', fontWeight: 700,
            color: 'var(--text-primary)', lineHeight: 1 }}>
            {bmi || '—'}
          </span>
          <span style={{ fontSize: '0.875rem', fontWeight: 600,
            color: cat.color, fontFamily: 'Satoshi, sans-serif' }}>
            {cat.label}
          </span>
        </div>

        {/* BMI Bar */}
        <div style={{ position: 'relative' }}>
          <div style={bmiTrack}>
            {['#60B8FF','#4CAF50','#FFA726','#FF4D4D'].map((c, i) => (
              <div key={i} style={{
                flex: 1, height: '100%',
                background: c, opacity: 0.85,
                borderRadius: i === 0 ? '6px 0 0 6px' : i === 3 ? '0 6px 6px 0' : '0',
              }} />
            ))}
          </div>
          {bmi && (
            <div style={{
              position: 'absolute', top: '-4px',
              left: `calc(${pos}% - 6px)`,
              width: '12px', height: '20px',
              background: 'white', borderRadius: '4px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              transition: 'left 600ms cubic-bezier(0.16,1,0.3,1)',
            }} />
          )}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {['Underweight','Normal','Overweight','Obese'].map(l => (
            <span key={l} style={{ fontSize: '0.625rem', color: 'var(--text-faint)',
              fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.2px' }}>
              {l}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

const bmiTrack = {
  height: '12px', borderRadius: '6px',
  display: 'flex', overflow: 'hidden',
}

function QuoteCard() {
  const [idx, setIdx]         = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)

  const nextQuote = () => {
    setVisible(false)
    setTimeout(() => {
      setIdx(i => (i + 1) % QUOTES.length)
      setVisible(true)
    }, 250)
  }

  useEffect(() => {
    const t = setInterval(nextQuote, 8000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ ...card, background: 'rgba(200,241,53,0.06)',
      border: '1px solid rgba(200,241,53,0.15)', cursor: 'pointer' }}
      onClick={nextQuote}>
      <p style={{ fontSize: '0.7rem', fontWeight: 700,
        color: 'var(--accent)', letterSpacing: '1px',
        textTransform: 'uppercase', fontFamily: 'Satoshi, sans-serif',
        marginBottom: '10px' }}>
        Daily Motivation ✨
      </p>
      <p style={{
        fontSize: '0.9375rem', color: 'var(--text-primary)',
        fontFamily: 'Satoshi, sans-serif', lineHeight: 1.6,
        fontStyle: 'italic',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(6px)',
        transition: 'opacity 250ms ease, transform 250ms ease',
      }}>
        "{QUOTES[idx]}"
      </p>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)',
        fontFamily: 'Satoshi, sans-serif', marginTop: '10px' }}>
        Tap for next quote →
      </p>
    </div>
  )
}

// ─── Weight Update Modal ───────────────────────────────────────

function WeightModal({ current, onClose, onSave }) {
  const [val, setVal] = useState(current || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!val || isNaN(val)) { toast.error('Enter a valid weight'); return }
    setLoading(true)
    try {
      await authService.updateProfile({ weight_kg: parseFloat(val) })
      toast.success('Weight updated! 📊')
      onSave()
      onClose()
    } catch {
      toast.error('Failed to update weight')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e => e.stopPropagation()}>
        <div style={modalHandle} />
        <h3 style={{ fontFamily: 'Clash Display, sans-serif',
          fontSize: '1.25rem', fontWeight: 600,
          color: 'var(--text-primary)', marginBottom: '6px' }}>
          Update Weight
        </h3>
        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)',
          fontFamily: 'Satoshi, sans-serif', marginBottom: '20px' }}>
          Keep your plan accurate 📈
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            type="number" value={val} autoFocus
            onChange={e => setVal(e.target.value)}
            placeholder="e.g. 68.5"
            style={{ ...s.input, flex: 1 }}
          />
          <span style={{ fontSize: '1rem', fontWeight: 600,
            color: 'var(--text-secondary)', fontFamily: 'Satoshi, sans-serif' }}>kg</span>
        </div>
        <button onClick={handleSave} disabled={loading}
          style={{ ...updateBtn, width: '100%', padding: '14px',
            borderRadius: '12px', fontSize: '1rem', opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {loading ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} /> : 'Save Weight'}
        </button>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(200,241,53,0.15) !important; }
        input::placeholder { color: var(--text-faint); }
      `}</style>
    </div>
  )
}

const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,0.6)',
  backdropFilter: 'blur(4px)',
  zIndex: 200,
  display: 'flex', alignItems: 'flex-end',
  justifyContent: 'center',
}
const modalSheet = {
  width: '100%', maxWidth: '480px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '24px 24px 0 0',
  padding: '12px 24px 32px',
}
const modalHandle = {
  width: '40px', height: '4px',
  background: 'var(--bg-surface-3)',
  borderRadius: '4px',
  margin: '0 auto 20px',
}
const s = {
  input: {
    padding: '13px 16px',
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontFamily: 'Satoshi, sans-serif',
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
  }
}

// ─── Main Dashboard ────────────────────────────────────────────

function Dashboard() {
  const navigate       = useNavigate()
  const { profile, fetchProfile } = useAuth()
  const [dayMeal, setDayMeal]     = useState(null)
  const [loadingMeal, setLoadingMeal] = useState(true)
  const [showWeightModal, setShowWeightModal] = useState(false)
  const [regenerating, setRegenerating]       = useState(false)

  const today = getTodayStr()

  useEffect(() => { fetchTodayMeal() }, [])

  const fetchTodayMeal = async () => {
    setLoadingMeal(true)
    try {
      const res = await mealService.getDayMeal(today)
      setDayMeal(res.data)
    } catch {
      setDayMeal(null)
    } finally {
      setLoadingMeal(false)
    }
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await mealService.regenerateDay(today)
      await fetchTodayMeal()
      toast.success("Today's meals refreshed! 🔄")
    } catch {
      toast.error('Failed to regenerate meals')
    } finally {
      setRegenerating(false)
    }
  }

  const getMealSlot = (slot) =>
    dayMeal?.meal_slots?.find(m => m.slot === slot)

  const totalCals = dayMeal?.meal_slots?.reduce((sum, m) =>
    sum + (m.calories || 0), 0) || 0

  const targetCals = profile?.target_calories || 2000

  // Macro totals
  const macros = dayMeal?.meal_slots?.reduce((acc, m) => ({
    protein: acc.protein + (m.protein_g || 0),
    carbs:   acc.carbs   + (m.carbs_g   || 0),
    fats:    acc.fats    + (m.fats_g    || 0),
  }), { protein: 0, carbs: 0, fats: 0 }) || { protein: 0, carbs: 0, fats: 0 }

  const status = dayMeal?.status || 'on_track'
  const statusConfig = {
    on_track:    { label: 'On Track ✅',  color: 'var(--success)' },
    adjusted:    { label: 'Adjusted ⚠️', color: 'var(--warning)' },
    regenerated: { label: 'Updated 🔄',  color: 'var(--accent)'  },
  }
  const sc = statusConfig[status] || statusConfig.on_track

  return (
    <div style={pageWrapper}>

      {/* ── Greeting ── */}
      <div style={greetingSection}>
        <div>
          <p style={greetingTime}>{formatDate()}</p>
          <h1 style={greetingName}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--accent)' }}>
              {profile?.name?.split(' ')[0] || 'there'} 👋
            </span>
          </h1>
        </div>
        <div style={avatarCircle}>
          {profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
      </div>

      {/* ── Today Status Banner ── */}
      <div style={statusBanner}>
        <div>
          <p style={bannerLabel}>Today's Target</p>
          <p style={bannerCals}>{targetCals} <span style={bannerUnit}>kcal</span></p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={bannerLabel}>Status</p>
          <p style={{ ...bannerStatus, color: sc.color }}>{sc.label}</p>
        </div>
      </div>

      {/* ── Calorie Ring + Macros ── */}
      <div style={card}>
        <div style={{ display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '16px' }}>
          <p style={sectionLabel}>Today's Calories</p>
          <button onClick={handleRegenerate} disabled={regenerating}
            style={regenBtn}>
            {regenerating
              ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <RefreshCw size={14} />}
            <span style={{ fontSize: '0.75rem', fontFamily: 'Satoshi, sans-serif' }}>
              Regenerate
            </span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <CalorieRing consumed={totalCals} target={targetCals} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <MacroBar label="Protein" value={macros.protein}
              max={Math.round(targetCals * 0.3 / 4)} color="#60B8FF" />
            <MacroBar label="Carbs"   value={macros.carbs}
              max={Math.round(targetCals * 0.45 / 4)} color="var(--warning)" />
            <MacroBar label="Fats"    value={macros.fats}
              max={Math.round(targetCals * 0.25 / 9)} color="var(--error)" />
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <div style={quickGrid}>
        {[
          { icon: '🥗', label: 'View Meals',    action: () => navigate('/nutrition') },
          { icon: '💪', label: 'Training',       action: () => navigate('/training')  },
          { icon: '⚖️', label: 'Update Weight',  action: () => setShowWeightModal(true) },
        ].map(({ icon, label, action }) => (
          <button key={label} onClick={action} style={quickBtn}>
            <span style={{ fontSize: '1.5rem' }}>{icon}</span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600,
              color: 'var(--text-secondary)', fontFamily: 'Satoshi, sans-serif',
              textAlign: 'center', lineHeight: 1.3 }}>{label}</span>
          </button>
        ))}
      </div>

      {/* ── Today's Meals ── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '14px' }}>
          <p style={sectionLabel}>Today's Meals</p>
          <button onClick={() => navigate('/nutrition')}
            style={{ background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.8rem', color: 'var(--accent)',
              fontFamily: 'Satoshi, sans-serif', fontWeight: 600 }}>
            See All →
          </button>
        </div>

        {loadingMeal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1,2,3].map(i => <SkeletonBlock key={i} height="64px" radius="14px" />)}
          </div>
        ) : dayMeal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {['breakfast','lunch','dinner'].map(slot => (
              <MealPreviewCard key={slot} slot={slot}
                meal={getMealSlot(slot)}
                onTap={() => navigate(`/nutrition/${today}`)} />
            ))}
          </div>
        ) : (
          <div style={emptyState}>
            <span style={{ fontSize: '2rem' }}>🍽️</span>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', textAlign: 'center' }}>
              No meal plan yet
            </p>
            <button onClick={() => mealService.generatePlan().then(fetchTodayMeal)}
              style={{ ...updateBtn, marginTop: '4px' }}>
              Generate Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Weight Card ── */}
      <WeightCard
        profile={profile}
        onUpdate={() => setShowWeightModal(true)} />

      {/* ── BMI Card ── */}
      <BMICard profile={profile} />

      {/* ── Motivation Quote ── */}
      <QuoteCard />

      {/* ── Bottom spacer ── */}
      <div style={{ height: '8px' }} />

      {/* ── Weight Modal ── */}
      {showWeightModal && (
        <WeightModal
          current={profile?.weight_kg}
          onClose={() => setShowWeightModal(false)}
          onSave={fetchProfile}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus { outline: none; border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(200,241,53,0.15) !important; }
        input::placeholder { color: var(--text-faint); }
      `}</style>
    </div>
  )
}

// ─── Page-level Styles ─────────────────────────────────────────

const pageWrapper = {
  display: 'flex', flexDirection: 'column',
  gap: '14px', padding: '16px',
}
const greetingSection = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const greetingTime = {
  fontSize: '0.8rem', color: 'var(--text-faint)',
  fontFamily: 'Satoshi, sans-serif', marginBottom: '4px',
}
const greetingName = {
  fontFamily: 'Clash Display, sans-serif',
  fontSize: '1.5rem', fontWeight: 700,
  color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2,
}
const avatarCircle = {
  width: '44px', height: '44px',
  background: 'var(--accent)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.125rem', fontWeight: 700,
  color: '#0A0A0A', fontFamily: 'Clash Display, sans-serif',
  flexShrink: 0,
}
const statusBanner = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px', padding: '16px',
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}
const bannerLabel = {
  fontSize: '0.7rem', color: 'var(--text-faint)',
  fontFamily: 'Satoshi, sans-serif',
  letterSpacing: '0.5px', textTransform: 'uppercase',
  fontWeight: 600, marginBottom: '4px',
}
const bannerCals = {
  fontFamily: 'Clash Display, sans-serif',
  fontSize: '1.75rem', fontWeight: 700,
  color: 'var(--text-primary)', lineHeight: 1,
}
const bannerUnit = {
  fontSize: '0.875rem', fontWeight: 500,
  color: 'var(--text-secondary)',
}
const bannerStatus = {
  fontSize: '0.875rem', fontWeight: 700,
  fontFamily: 'Satoshi, sans-serif',
}
const regenBtn = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '6px 10px',
  color: 'var(--text-secondary)', cursor: 'pointer',
  transition: 'all 180ms ease',
}
const quickGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
}
const quickBtn = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px', padding: '16px 8px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '8px', cursor: 'pointer',
  transition: 'transform 180ms ease, background 180ms ease',
}
const emptyState = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '8px',
  padding: '24px 0',
}

export default Dashboard