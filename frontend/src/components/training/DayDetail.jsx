import { ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { S, CATEGORY_META } from '../../utils/training/constants';
import NeedleBar from './NeedleBar';

/**
 * Renders the full detail view for a single training day.
 * Shows a rest-day card or a grouped list of exercises.
 */
export default function DayDetail({ day, expandedEx, setExpandedEx }) {
  const dayDate = new Date(day.date);
  const dateStr = dayDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  // ── Rest Day ──────────────────────────────────────────────────
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

  // ── Workout Day ───────────────────────────────────────────────
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
                fontFamily: "'General Sans', sans-serif", marginLeft: 'auto', fontWeight: 500,
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
