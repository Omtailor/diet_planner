import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronRight, Dumbbell, Wind, Zap, RotateCcw } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../../services/api'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const FULL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const CATEGORY_META = {
  strength:    { icon: '🏋️', color: '#4f98a3', bg: 'rgba(79,152,163,0.12)'  },
  cardio:      { icon: '🏃', color: '#fdab43', bg: 'rgba(253,171,67,0.12)'  },
  flexibility: { icon: '🧘', color: '#a86fdf', bg: 'rgba(168,111,223,0.12)' },
  bodyweight:  { icon: '💪', color: '#6daa45', bg: 'rgba(109,170,69,0.12)'  },
}

export default function Training() {
  const navigate        = useNavigate()
  const [plan, setPlan]           = useState(null)
  const [loading, setLoading]     = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)  // DayTraining object
  const [expandedEx, setExpandedEx]   = useState(null)  // exercise id

  const today     = new Date()
  const todayDow  = today.getDay() === 0 ? 6 : today.getDay() - 1  // 0=Mon…6=Sun

  useEffect(() => { fetchPlan() }, [])

  const fetchPlan = async () => {
    setLoading(true)
    try {
      const res = await API.get('/training/weekly/')
      setPlan(res.data)
      // Auto-select today's day
      const todayDay = res.data.day_trainings?.find(d => d.day_of_week === todayDow)
      setSelectedDay(todayDay || res.data.day_trainings?.[0] || null)
    } catch (e) {
      if (e?.response?.status === 404) setPlan(null)
      else toast.error('Failed to load training plan')
    } finally {
      setLoading(false)
    }
  }

  const generatePlan = async () => {
    setGenerating(true)
    try {
      const res = await API.post('/training/generate/')
      setPlan(res.data)
      const todayDay = res.data.day_trainings?.find(d => d.day_of_week === todayDow)
      setSelectedDay(todayDay || res.data.day_trainings?.[0] || null)
      toast.success('Training plan generated! 💪')
    } catch {
      toast.error('Failed to generate training plan')
    } finally {
      setGenerating(false)
    }
  }

  // ── Loading ──────────────────────────────────────────────────
  if (loading) return (
    <div style={s.centered}>
      <Loader2 size={32} color="var(--accent)"
        style={{ animation: 'spin 0.8s linear infinite' }} />
      <p style={s.loadingText}>Loading your training plan...</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  // ── No plan ──────────────────────────────────────────────────
  if (!plan) return (
    <div style={s.page}>
      <div style={s.heroCard}>
        <span style={{ fontSize: '3.5rem' }}>🏋️</span>
        <p style={s.heroTitle}>No Training Plan Yet</p>
        <p style={s.heroSub}>
          Generate your personalized weekly workout plan based on your profile and goals.
        </p>
        <button onClick={generatePlan} disabled={generating} style={s.generateBtn}>
          {generating
            ? <><Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} /> Generating...</>
            : '⚡ Generate Training Plan'}
        </button>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const days = plan.day_trainings || []

  // ── Week summary stats ───────────────────────────────────────
  const totalWorkoutDays = days.filter(d => !d.is_rest_day).length
  const totalCalsBurned  = days.reduce((s, d) => s + (d.total_calories_burned || 0), 0)
  const totalMinutes     = days.reduce((s, d) => s + (d.total_duration || 0), 0)

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div>
          <p style={s.greeting}>This Week's Plan 💪</p>
          <p style={s.subGreeting}>
            {totalWorkoutDays} workout days • {Math.round(totalMinutes / 60)}h {totalMinutes % 60}m total
          </p>
        </div>
        <button onClick={generatePlan} disabled={generating} style={s.regenBtn}
          title="Regenerate plan">
          {generating
            ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <RotateCcw size={16} color="var(--text-secondary)" />}
        </button>
      </div>

      {/* Weekly stats */}
      <div style={s.statsRow}>
        {[
          { label: 'Workout Days', value: totalWorkoutDays, icon: '🗓️' },
          { label: 'Kcal Burned',  value: totalCalsBurned,  icon: '🔥' },
          { label: 'Total Mins',   value: totalMinutes,     icon: '⏱️' },
        ].map(({ label, value, icon }) => (
          <div key={label} style={s.statBox}>
            <span style={{ fontSize: '1.4rem' }}>{icon}</span>
            <span style={s.statVal}>{value}</span>
            <span style={s.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Day selector strip */}
      <div style={s.dayStrip}>
        {days.map((day) => {
          const isToday    = day.day_of_week === todayDow
          const isSelected = selectedDay?.id === day.id
          const isRest     = day.is_rest_day
          return (
            <button key={day.id}
              onClick={() => { setSelectedDay(day); setExpandedEx(null) }}
              style={{
                ...s.dayBtn,
                background: isSelected
                  ? 'var(--accent)'
                  : isToday
                    ? 'rgba(200,241,53,0.1)'
                    : 'var(--bg-surface)',
                border: `1px solid ${isSelected
                  ? 'var(--accent)'
                  : isToday
                    ? 'rgba(200,241,53,0.4)'
                    : 'var(--border)'}`,
              }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: isSelected ? '#0A0A0A' : 'var(--text-faint)',
                fontFamily: 'Satoshi, sans-serif',
                letterSpacing: '0.3px',
              }}>
                {DAY_NAMES[day.day_of_week]}
              </span>
              <span style={{ fontSize: '1rem' }}>
                {isRest ? '😴' : '💪'}
              </span>
              {isToday && !isSelected && (
                <div style={s.todayDot} />
              )}
            </button>
          )
        })}
      </div>

      {/* Day detail */}
      {selectedDay && (
        <DayDetail
          day={selectedDay}
          expandedEx={expandedEx}
          setExpandedEx={setExpandedEx}
        />
      )}

      <div style={{ height: '8px' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Day Detail Component ─────────────────────────────────────────────────────
function DayDetail({ day, expandedEx, setExpandedEx }) {
  const dayDate = new Date(day.date)
  const dateStr = dayDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short'
  })

  if (day.is_rest_day) return (
    <div style={s.restCard}>
      <span style={{ fontSize: '3rem' }}>😴</span>
      <p style={s.restTitle}>Rest Day</p>
      <p style={s.restSub}>
        Recovery is part of the plan. Stretch, hydrate, sleep well.
      </p>
      <div style={s.restTips}>
        {['🧘 Light stretching', '💧 Stay hydrated', '😴 8h sleep target'].map(tip => (
          <span key={tip} style={s.restTip}>{tip}</span>
        ))}
      </div>
    </div>
  )

  const exercises = day.exercises || []

  // Group by category
  const grouped = exercises.reduce((acc, ex) => {
    const cat = ex.category || 'bodyweight'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(ex)
    return acc
  }, {})

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

      {/* Day header */}
      <div style={s.dayHeader}>
        <div>
          <p style={s.dayHeaderTitle}>{dateStr}</p>
          <p style={s.dayHeaderSub}>
            {day.total_duration}min • {day.total_calories_burned} kcal
          </p>
        </div>
        <div style={s.dayHeaderBadge}>
          {exercises.length} exercises
        </div>
      </div>

      {/* Exercise groups */}
      {Object.entries(grouped).map(([cat, exList]) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.bodyweight
        return (
          <div key={cat} style={s.exGroup}>
            {/* Group header */}
            <div style={s.exGroupHeader}>
              <span style={{ fontSize: '1.1rem' }}>{meta.icon}</span>
              <span style={{
                fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
                fontSize: '0.8rem', color: meta.color,
                textTransform: 'uppercase', letterSpacing: '0.5px',
              }}>
                {cat}
              </span>
              <span style={{
                fontSize: '0.7rem', color: 'var(--text-faint)',
                fontFamily: 'Satoshi, sans-serif', marginLeft: 'auto',
              }}>
                {exList.length} exercise{exList.length > 1 ? 's' : ''}
              </span>
            </div>

            {/* Exercises */}
            {exList.map((ex, i) => {
              const isExpanded = expandedEx === ex.id
              const calsBurned = Math.round(ex.calories_burned_per_min * ex.duration_minutes)
              return (
                <button key={ex.id}
                  onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                  style={{
                    ...s.exRow,
                    borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    background: isExpanded
                      ? `${meta.bg}` : 'none',
                  }}>
                  {/* Left: dot + name */}
                  <div style={{
                    width: '8px', height: '8px', borderRadius: '50%',
                    background: meta.color, flexShrink: 0, marginTop: '2px',
                  }} />
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={s.exName}>{ex.name}</p>
                    <p style={s.exMeta}>
                      {ex.duration_minutes} min • ~{calsBurned} kcal
                    </p>
                    {/* Instructions expand */}
                    {isExpanded && ex.instructions && (
                      <p style={s.exInstructions}>{ex.instructions}</p>
                    )}
                  </div>
                  <ChevronRight size={16} color="var(--text-faint)"
                    style={{
                      transition: 'transform 180ms ease',
                      transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                      flexShrink: 0,
                    }} />
                </button>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────────────────
const s = {
  page:    { display: 'flex', flexDirection: 'column', gap: '14px', padding: '16px' },
  centered:{ display: 'flex', flexDirection: 'column', alignItems: 'center',
             justifyContent: 'center', minHeight: '60dvh', gap: '16px', padding: '20px' },
  loadingText: { fontFamily: 'Satoshi, sans-serif', color: 'var(--text-secondary)',
                 fontSize: '0.9rem' },

  // No plan hero
  heroCard:  { background: 'var(--bg-surface)', border: '1px solid var(--border)',
               borderRadius: '20px', padding: '40px 24px',
               display: 'flex', flexDirection: 'column',
               alignItems: 'center', gap: '14px', textAlign: 'center' },
  heroTitle: { fontFamily: 'Clash Display, sans-serif', fontSize: '1.4rem',
               fontWeight: 700, color: 'var(--text-primary)' },
  heroSub:   { fontSize: '0.875rem', color: 'var(--text-secondary)',
               fontFamily: 'Satoshi, sans-serif', maxWidth: '28ch', lineHeight: 1.5 },
  generateBtn: { marginTop: '8px', padding: '14px 28px',
                 background: 'var(--accent)', border: 'none',
                 borderRadius: '14px', color: '#0A0A0A',
                 fontFamily: 'Satoshi, sans-serif', fontWeight: 800,
                 fontSize: '0.9375rem', cursor: 'pointer',
                 display: 'flex', alignItems: 'center', gap: '8px' },

  // Header
  header:   { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  greeting: { fontFamily: 'Clash Display, sans-serif', fontSize: '1.3rem',
               fontWeight: 700, color: 'var(--text-primary)' },
  subGreeting: { fontSize: '0.8rem', color: 'var(--text-secondary)',
                  fontFamily: 'Satoshi, sans-serif', marginTop: '3px' },
  regenBtn: { width: '40px', height: '40px', background: 'var(--bg-surface)',
              border: '1px solid var(--border)', borderRadius: '12px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer' },

  // Stats
  statsRow: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' },
  statBox:  { background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '14px', padding: '14px 8px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '4px' },
  statVal:  { fontFamily: 'Clash Display, sans-serif', fontSize: '1.25rem',
              fontWeight: 700, color: 'var(--accent)' },
  statLabel:{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-faint)',
              fontFamily: 'Satoshi, sans-serif', textTransform: 'uppercase',
              letterSpacing: '0.4px', textAlign: 'center' },

  // Day strip
  dayStrip: { display: 'flex', gap: '6px', overflowX: 'auto',
              paddingBottom: '4px',
              scrollbarWidth: 'none' },
  dayBtn:   { minWidth: '44px', height: '64px', borderRadius: '14px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '4px', cursor: 'pointer', position: 'relative',
              flexShrink: 0, transition: 'all 180ms ease' },
  todayDot: { position: 'absolute', bottom: '6px',
              width: '4px', height: '4px', borderRadius: '50%',
              background: 'var(--accent)' },

  // Day header
  dayHeader:     { background: 'var(--bg-surface)', border: '1px solid var(--border)',
                   borderRadius: '16px', padding: '16px',
                   display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  dayHeaderTitle:{ fontFamily: 'Clash Display, sans-serif', fontSize: '1rem',
                   fontWeight: 600, color: 'var(--text-primary)' },
  dayHeaderSub:  { fontSize: '0.78rem', color: 'var(--text-secondary)',
                   fontFamily: 'Satoshi, sans-serif', marginTop: '3px' },
  dayHeaderBadge:{ background: 'rgba(200,241,53,0.1)', border: '1px solid rgba(200,241,53,0.3)',
                   borderRadius: '999px', padding: '4px 12px',
                   fontSize: '0.75rem', fontWeight: 700,
                   color: 'var(--accent)', fontFamily: 'Satoshi, sans-serif' },

  // Exercise group
  exGroup:      { background: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '16px', overflow: 'hidden' },
  exGroupHeader:{ display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                  background: 'var(--bg-surface-2)' },
  exRow:        { width: '100%', display: 'flex', alignItems: 'flex-start',
                  gap: '12px', padding: '14px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  transition: 'background 180ms ease' },
  exName:       { fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
                  fontSize: '0.9rem', color: 'var(--text-primary)' },
  exMeta:       { fontSize: '0.75rem', color: 'var(--text-faint)',
                  fontFamily: 'Satoshi, sans-serif', marginTop: '3px' },
  exInstructions:{ fontSize: '0.82rem', color: 'var(--text-secondary)',
                   fontFamily: 'Satoshi, sans-serif', marginTop: '8px',
                   lineHeight: 1.6, textAlign: 'left',
                   padding: '10px', background: 'var(--bg-surface-2)',
                   borderRadius: '8px' },

  // Rest day
  restCard: { background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: '20px', padding: '36px 20px',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '12px', textAlign: 'center' },
  restTitle:{ fontFamily: 'Clash Display, sans-serif', fontSize: '1.3rem',
              fontWeight: 700, color: 'var(--text-primary)' },
  restSub:  { fontSize: '0.875rem', color: 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', maxWidth: '28ch', lineHeight: 1.5 },
  restTips: { display: 'flex', flexDirection: 'column', gap: '8px',
              marginTop: '8px', width: '100%' },
  restTip:  { background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
              borderRadius: '10px', padding: '10px 16px',
              fontSize: '0.85rem', color: 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', display: 'block' },
}