import {
  glassCard, sectionLabel, accentBtn,
  weightRow, weightIcon, weightLabel, weightVal, noteText,
} from '../../utils/dashboard/styles'

/**
 * Displays current weight, target weight with a mini progress ring,
 * and an Update button that opens the weight modal.
 */
export default function WeightCard({ profile, onUpdate }) {
  const current    = profile?.weight_kg
  const target     = profile?.target_weight_kg
  const diff       = current && target ? Math.abs(current - target) : 0
  const totalToLose = current && target ? Math.abs(current - target) + 1 : 1
  const progressPct = current && target
    ? Math.min(((totalToLose - diff) / totalToLose) * 100, 100) : 0

  const r2    = 18
  const circ2 = 2 * Math.PI * r2
  const dash2 = (progressPct / 100) * circ2

  return (
    <div style={glassCard}>
      <p style={sectionLabel}>Weight Tracker</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '12px' }}>

        {/* Target weight row */}
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

        {/* Current weight row */}
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
