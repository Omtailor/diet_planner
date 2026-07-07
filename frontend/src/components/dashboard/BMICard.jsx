import { FONT, BMI_LABELS, BMI_TICKS } from '../../utils/dashboard/constants'
import { glassCard, sectionLabel } from '../../utils/dashboard/styles'
import { getBMICategory, getBMIPosition, getTickColor } from '../../utils/dashboard/bmi'

/**
 * Shows the user's BMI value with a colour-coded tick-bar scale and needle.
 */
export default function BMICard({ profile }) {
  const bmi = profile?.bmi ? parseFloat(profile.bmi).toFixed(1) : null
  const cat = getBMICategory(bmi)
  const pos = getBMIPosition(bmi)

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
          {Array.from({ length: BMI_TICKS }).map((_, i) => {
            const tickPct     = i / (BMI_TICKS - 1)
            const isNearNeedle = bmi && Math.abs(tickPct * 100 - pos) < 4
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: isNearNeedle ? '28px' : (i % 4 === 0 ? '20px' : '14px'),
                  background: getTickColor(i, BMI_TICKS),
                  borderRadius: '2px',
                  opacity: isNearNeedle ? 1 : 0.75,
                  transition: 'height 600ms ease',
                }}
              />
            )
          })}
        </div>
      </div>

      {/* Zone labels */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', marginTop: '8px',
      }}>
        {BMI_LABELS.map(({ label, color }) => (
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
