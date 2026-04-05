import { useState, useEffect } from 'react';
import { Loader2, ChevronRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';
import bgImage from '../../assets/images/bg-12.webp';
import bgVideoRest from '../../assets/videos/bg-video-01.mp4';

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_META = {
  strength: { icon: '🏋️', color: '#34C759', glow: 'rgba(52,199,89,0.4)', bg: 'rgba(52,199,89,0.1)' },
  cardio: { icon: '🏃', color: '#FF9500', glow: 'rgba(255,149,0,0.4)', bg: 'rgba(255,149,0,0.1)' },
  flexibility: { icon: '🧘', color: '#AF52DE', glow: 'rgba(175,82,222,0.4)', bg: 'rgba(175,82,222,0.1)' },
  bodyweight: { icon: '💪', color: '#007AFF', glow: 'rgba(0,122,255,0.4)', bg: 'rgba(0,122,255,0.1)' },
};

// ─── Count-Up Hook ─────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ─── Needle Bar ────────────────────────────────────────────────
function NeedleBar({ value, max, color, glow }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min((value / (max || 1)) * 100, 100);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{
      height: '6px', background: 'rgba(0,0,0,0.06)',
      borderRadius: '6px', overflow: 'visible', marginTop: '8px',
    }}>
      <div style={{
        height: '100%', width: `${animated}%`,
        background: color, borderRadius: '6px',
        boxShadow: `0 0 8px ${glow}`,
        transition: 'width 800ms cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
      }}>
        {animated > 3 && (
          <div style={{
            position: 'absolute', right: '-2px', top: '50%',
            transform: 'translateY(-50%)',
            width: '4px', height: '12px',
            background: '#ffffff',
            borderRadius: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        )}
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────
export default function Training() {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedEx, setExpandedEx] = useState(null);
  const [regenPulse, setRegenPulse] = useState(false);

  const today = new Date();
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;

  useEffect(() => { fetchPlan(); }, []);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await API.get('/training/weekly/');
      setPlan(res.data);
      const todayDay = res.data.day_trainings?.find(d => d.day_of_week === todayDow);
      setSelectedDay(todayDay || res.data.day_trainings?.[0] || null);
    } catch (e) {
      if (e?.response?.status === 404) setPlan(null);
      else toast.error('Failed to load training plan');
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    setRegenPulse(true);
    setTimeout(() => setRegenPulse(false), 600);
    try {
      const res = await API.post('/training/generate/');
      setPlan(res.data);
      const todayDay = res.data.day_trainings?.find(d => d.day_of_week === todayDow);
      setSelectedDay(todayDay || res.data.day_trainings?.[0] || null);
      toast.success('Training plan generated! 💪');
      if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
    } catch {
      toast.error('Failed to generate training plan');
    } finally {
      setGenerating(false);
    }
  };

  const isRestDay = selectedDay?.is_rest_day ?? false;

  // ── Loading ────────────────────────────────────────────────
  if (loading) return (
    <div style={S.page}>
      <BgLayer isRestDay={false} bgImage={bgImage} bgVideoRest={bgVideoRest} />
      <div style={S.centeredContent}>
        <div style={S.spinnerRing} className="spin-ring" />
        <p style={S.loadingText}>Loading your training plan...</p>
      </div>
      <GlobalStyles />
    </div>
  );

  // ── No Plan ────────────────────────────────────────────────
  if (!plan) return (
    <div style={S.page}>
      <BgLayer isRestDay={false} bgImage={bgImage} bgVideoRest={bgVideoRest} />
      <div style={{ position: 'relative', zIndex: 2, padding: '24px 16px' }}>
        <div style={S.glassCard}>
          <span style={{ fontSize: '3.5rem' }}>🏋️</span>
          <p style={S.noPlanTitle}>No Training Plan Yet</p>
          <p style={S.noPlanSub}>
            Generate your personalized weekly workout plan based on your profile and goals.
          </p>
          <button
            onClick={generatePlan}
            disabled={generating}
            style={{ ...S.generateBtn, opacity: generating ? 0.8 : 1 }}
            className={regenPulse ? 'regen-pulse' : ''}
          >
            {generating
              ? <><Loader2 size={16} className="spin" style={{ marginRight: 6 }} /> Generating...</>
              : '⚡ Generate Training Plan'}
          </button>
        </div>
      </div>
      <GlobalStyles />
    </div>
  );

  const days = plan.day_trainings || [];
  const totalWorkoutDays = days.filter(d => !d.is_rest_day).length;
  const totalCalsBurned = days.reduce((s, d) => s + (d.total_calories_burned || 0), 0);
  const totalMinutes = days.reduce((s, d) => s + (d.total_duration || 0), 0);

  return (
    <div style={S.page}>
      {/* ── Backgrounds ── */}
      <BgLayer isRestDay={isRestDay} bgImage={bgImage} bgVideoRest={bgVideoRest} />

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* Hero Header (Clean Glass Top Bar) */}
        <div style={S.heroHeader}>
          <div style={S.heroOverlay}>
            <div style={{ flex: 1 }}>
              <p style={S.heroLabel}>THIS WEEK'S PLAN</p>
              <h1 style={S.heroTitle}>{totalWorkoutDays} Workout Days 💪</h1>
              <p style={S.heroSub}>
                {Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m total
              </p>
            </div>
            <button
              onClick={generatePlan}
              disabled={generating}
              style={S.regenBtn}
              className={regenPulse ? 'regen-pulse' : ''}
              title="Regenerate plan"
            >
              {generating
                ? <Loader2 size={18} className="spin" color="var(--color-text)" />
                : <RotateCcw size={18} color="var(--color-text)" />}
            </button>
          </div>
        </div>

        {/* Body */}
        <div style={S.body}>
          <StatsRow
            totalWorkoutDays={totalWorkoutDays}
            totalCalsBurned={totalCalsBurned}
            totalMinutes={totalMinutes}
          />
          <DayStrip
            days={days}
            selectedDay={selectedDay}
            todayDow={todayDow}
            onSelect={(day) => { setSelectedDay(day); setExpandedEx(null); }}
          />
          {selectedDay && (
            <DayDetail
              key={selectedDay.id}
              day={selectedDay}
              expandedEx={expandedEx}
              setExpandedEx={setExpandedEx}
            />
          )}
          <div style={{ height: '20px' }} />
        </div>

      </div>
      <GlobalStyles />
    </div>
  );
}

// ─── Background Layer ──────────────────────────────────────────
function BgLayer({ isRestDay, bgImage, bgVideoRest }) {
  return (
    <div style={S.bgBase}>
      <AnimatePresence mode="wait">
        {isRestDay ? (
          <motion.video
            key="rest-video"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            src={bgVideoRest}
            autoPlay muted loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <motion.div
            key="workout-image"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2 }}
            className="ken-burns"
            style={{
              width: '100%', height: '100%',
              backgroundImage: `url(${bgImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        )}
      </AnimatePresence>
      {/* Light frosted overlay to ensure text readability globally */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(180deg, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.8) 100%)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }} />
    </div>
  );
}

// ─── Stats Row ─────────────────────────────────────────────────
function StatsRow({ totalWorkoutDays, totalCalsBurned, totalMinutes }) {
  const animCals = useCountUp(totalCalsBurned);
  const animMins = useCountUp(totalMinutes);

  const stats = [
    { label: 'Workout Days', value: totalWorkoutDays, icon: '🗓️' },
    { label: 'Kcal Burned', value: animCals, icon: '🔥' },
    { label: 'Total Mins', value: animMins, icon: '⏱️' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
      {stats.map(({ label, value, icon }) => (
        <div key={label} style={S.statBox}>
          <span style={{ fontSize: '1.3rem' }}>{icon}</span>
          <span style={S.statVal}>{value}</span>
          <span style={S.statLabel}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Day Strip ─────────────────────────────────────────────────
function DayStrip({ days, selectedDay, todayDow, onSelect }) {
  return (
    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
      {days.map((day) => {
        const isToday = day.day_of_week === todayDow;
        const isSelected = selectedDay?.id === day.id;
        const isRest = day.is_rest_day;

        return (
          <motion.button
            key={day.id}
            onClick={() => onSelect(day)}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            style={{
              minWidth: '64px', height: '76px',
              borderRadius: '20px', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '6px', cursor: 'pointer', position: 'relative',
              background: isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.8)'}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isSelected ? '0 8px 24px rgba(52,199,89,0.4)' : '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: isSelected ? '#ffffff' : 'var(--color-text-faint)',
              fontFamily: "'General Sans', sans-serif",
              letterSpacing: '0.5px', textTransform: 'uppercase', zIndex: 1,
            }}>
              {DAY_NAMES[day.day_of_week]}
            </span>
            <span style={{ fontSize: '1.2rem', zIndex: 1 }}>
              {isRest ? '😴' : '💪'}
            </span>
            {isToday && !isSelected && (
              <div style={{
                position: 'absolute', bottom: '8px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--color-accent)',
                boxShadow: '0 0 8px rgba(52,199,89,0.8)',
                zIndex: 1,
              }} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Day Detail ────────────────────────────────────────────────
function DayDetail({ day, expandedEx, setExpandedEx }) {
  const dayDate = new Date(day.date);
  const dateStr = dayDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  // Rest Day
  if (day.is_rest_day) {
    const tips = [
      { emoji: '🧘', label: 'Light stretching & mobility' },
      { emoji: '💧', label: 'Stay hydrated (3L target)' },
      { emoji: '😴', label: '8h sleep for muscle recovery' },
    ];
    return (
      <motion.div
        style={S.glassCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <span style={{ fontSize: '3.5rem' }}>😴</span>
        <p style={S.restTitle}>Active Recovery</p>
        <p style={S.restSub}>Rest days are just as important as training days. Allow your body to rebuild.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', width: '100%' }}>
          {tips.map(({ emoji, label }, i) => (
            <motion.div
              key={label}
              style={S.restTip}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.1 }}
            >
              <span style={{ marginRight: '12px', fontSize: '1.3rem' }}>{emoji}</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Workout Day
  const exercises = day.exercises || [];
  const grouped = exercises.reduce((acc, ex) => {
    const cat = ex.category || 'bodyweight';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  const maxCals = Math.max(
    ...exercises.map(ex => Math.round((ex.calories_burned_per_min || 0) * (ex.duration_minutes || 0))),
    1
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="day-detail-enter">
      {/* Day Header */}
      <div style={S.dayHeaderCard}>
        <div>
          <p style={S.dayHeaderTitle}>{dateStr}</p>
          <p style={S.dayHeaderSub}>{day.total_duration} min &nbsp;•&nbsp; {day.total_calories_burned} kcal</p>
        </div>
        <div style={S.dayHeaderBadge}>{exercises.length} exercises</div>
      </div>

      {/* Exercise Groups */}
      {Object.entries(grouped).map(([cat, exList]) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.bodyweight;
        return (
          <div key={cat} style={S.exGroupCard}>
            <div style={S.exGroupHeader}>
              <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
              <span style={{
                fontFamily: "'General Sans', sans-serif",
                fontWeight: 700, fontSize: '0.8rem',
                color: meta.color, textTransform: 'uppercase', letterSpacing: '1px',
              }}>{cat}</span>
              <span style={{
                fontSize: '0.75rem', color: 'var(--color-text-faint)',
                fontFamily: "'General Sans', sans-serif", marginLeft: 'auto', fontWeight: 500
              }}>
                {exList.length} exercise{exList.length > 1 ? 's' : ''}
              </span>
            </div>

            <AnimatePresence>
              {exList.map((ex, i) => {
                const isExpanded = expandedEx === ex.id;
                const calsBurned = Math.round((ex.calories_burned_per_min || 0) * (ex.duration_minutes || 0));
                return (
                  <motion.button
                    key={ex.id}
                    onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.05 }}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'flex-start', gap: '16px',
                      padding: '16px',
                      background: isExpanded ? 'rgba(255,255,255,0.4)' : 'transparent',
                      border: 'none',
                      borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      cursor: 'pointer', transition: 'background 200ms ease',
                    }}
                  >
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: meta.color, flexShrink: 0, marginTop: '6px',
                      boxShadow: `0 0 8px ${meta.glow}`,
                    }} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={S.exName}>{ex.name}</p>
                      <p style={S.exMeta}>{ex.duration_minutes} min &nbsp;•&nbsp; ~{calsBurned} kcal</p>
                      <NeedleBar value={calsBurned} max={maxCals} color={meta.color} glow={meta.glow} />
                      <AnimatePresence>
                        {isExpanded && ex.instructions && (
                          <motion.div
                            key="instr"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <p style={S.exInstructions}>{ex.instructions}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    >
                      <ChevronRight size={18} color="var(--color-text-faint)" />
                    </motion.div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Global Styles ─────────────────────────────────────────────
function GlobalStyles() {
  return (
    <style>{`
      :root {
        --color-accent: #34C759;
        --color-text: #1C1C1E;
        --color-text-muted: #636366;
        --color-text-faint: #8E8E93;
      }
      body, #root { 
        background: #F2F2F7 !important; 
        color: var(--color-text);
        margin: 0;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes kenBurns {
        0%   { transform: scale(1.00) translate(0%, 0%); }
        25%  { transform: scale(1.06) translate(-1%, 1%); }
        50%  { transform: scale(1.03) translate(1%, -1%); }
        75%  { transform: scale(1.08) translate(-1%, 1%); }
        100% { transform: scale(1.00) translate(0%, 0%); }
      }
      @keyframes regenPulse {
        0%   { box-shadow: 0 0 0 0 rgba(52,199,89,0.6); }
        70%  { box-shadow: 0 0 0 16px rgba(52,199,89,0); }
        100% { box-shadow: 0 0 0 0 rgba(52,199,89,0); }
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(16px); }
        to   { opacity:1; transform:translateY(0); }
      }

      .spin       { animation: spin 0.8s linear infinite; }
      .spin-ring  { animation: spin 0.9s linear infinite; }
      .regen-pulse { animation: regenPulse 0.6s ease-out; }
      .ken-burns  { animation: kenBurns 24s ease-in-out infinite; transform-origin: center; }
      .day-detail-enter { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    `}</style>
  );
}

// ─── Style Tokens ──────────────────────────────────────────────
const FONT = "'General Sans', sans-serif";

// Apple Glass Morphism Theme
const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

const S = {
  page: {
    minHeight: '100dvh',
    position: 'relative',
    fontFamily: FONT,
  },

  // ── BG layers ──
  bgBase: {
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: -1, pointerEvents: 'none', overflow: 'hidden',
    background: '#F2F2F7',
  },

  // ── Loading ──
  centeredContent: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', gap: '16px',
  },
  spinnerRing: {
    width: '40px', height: '40px', borderRadius: '50%',
    border: '4px solid rgba(52,199,89,0.2)',
    borderTop: '4px solid var(--color-accent)',
  },
  loadingText: {
    fontFamily: FONT, fontSize: '1rem', fontWeight: 500,
    color: 'var(--color-text-muted)',
  },

  // ── Reusable Glass Card ──
  glassCard: {
    ...GLASS_WHITE,
    borderRadius: '24px', padding: '40px 24px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px', textAlign: 'center',
  },

  // ── No Plan ──
  noPlanTitle: {
    fontFamily: FONT, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)',
  },
  noPlanSub: {
    fontSize: '0.95rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, maxWidth: '28ch', lineHeight: 1.5,
  },
  generateBtn: {
    marginTop: '12px', padding: '16px 32px',
    background: 'var(--color-accent)', border: 'none',
    borderRadius: '16px', color: '#ffffff',
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
    transition: 'transform 150ms ease',
  },

  // ── Hero Top Bar ──
  heroHeader: {
    position: 'relative', width: '100%',
    padding: '16px', paddingTop: '80px', // padding to clear navbar
  },
  heroOverlay: {
    ...GLASS_WHITE,
    borderRadius: '20px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', gap: '16px',
    padding: '24px',
  },
  heroLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--color-accent)',
    letterSpacing: '1.5px', textTransform: 'uppercase',
    fontFamily: FONT, marginBottom: '6px',
  },
  heroTitle: {
    fontFamily: FONT, fontSize: '1.6rem', fontWeight: 800,
    color: 'var(--color-text)', lineHeight: 1.2,
  },
  heroSub: {
    fontSize: '0.9rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, marginTop: '6px', fontWeight: 500,
  },
  regenBtn: {
    width: '48px', height: '48px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '16px', flexShrink: 0,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    transition: 'all 200ms ease',
  },

  // ── Body ──
  body: {
    padding: '0 16px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },

  // ── Stats ──
  statBox: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '16px 8px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '6px',
  },
  statVal: {
    fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)',
  },
  statLabel: {
    fontSize: '0.65rem', fontWeight: 700,
    color: 'var(--color-text-muted)', fontFamily: FONT,
    textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center',
  },

  // ── Day Header Card ──
  dayHeaderCard: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  dayHeaderTitle: {
    fontFamily: FONT, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)',
  },
  dayHeaderSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '4px',
  },
  dayHeaderBadge: {
    background: 'rgba(52,199,89,0.15)',
    borderRadius: '999px', padding: '6px 14px',
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)',
    fontFamily: FONT,
  },

  // ── Exercise Group ──
  exGroupCard: {
    ...GLASS_WHITE,
    borderRadius: '20px', overflow: 'hidden',
  },
  exGroupHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    background: 'rgba(255,255,255,0.4)',
  },
  exName: {
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)',
  },
  exMeta: {
    fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: '4px',
  },
  exInstructions: {
    fontSize: '0.9rem', color: 'var(--color-text)', fontFamily: FONT,
    marginTop: '12px', lineHeight: 1.6,
    padding: '14px',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '12px', textAlign: 'left',
  },

  // ── Rest Day Tips ──
  restTitle: {
    fontFamily: FONT, fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)',
  },
  restSub: {
    fontSize: '0.95rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, maxWidth: '30ch', lineHeight: 1.5,
  },
  restTip: {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px', padding: '16px',
    fontSize: '0.95rem',
    fontFamily: FONT,
    display: 'flex', alignItems: 'center', width: '100%',
    cursor: 'default',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
  },
};