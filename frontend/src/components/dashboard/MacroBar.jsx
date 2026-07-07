import { useState, useEffect } from 'react'
import { FONT } from '../../utils/dashboard/constants'

/**
 * Animated progress bar for a single macro nutrient.
 */
export default function MacroBar({ label, value, max, glowColor, trackColor }) {
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
