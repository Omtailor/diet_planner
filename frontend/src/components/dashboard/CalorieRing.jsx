import useCountUp from '../../hooks/useCountUp'

/**
 * Animated SVG ring that shows calories consumed vs. target.
 * When no target is provided it renders a simple counter ring.
 */
export default function CalorieRing({ consumed = 0, target = null }) {
  // Dashboard used duration=1500; match it exactly
  const animated  = useCountUp(consumed, 1500)
  const hasTarget = typeof target === 'number' && target > 0
  const isOver    = hasTarget && consumed >= target
  const pct       = hasTarget ? Math.min(consumed / target, 1) : 0
  const r         = 54
  const circ      = 2 * Math.PI * r
  const dash      = pct * circ

  if (!hasTarget) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <svg width="148" height="148" viewBox="0 0 148 148"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(0,0,0,0.04))',
            transition: 'filter 600ms ease',
          }}>
          <circle cx="74" cy="74" r={r}
            fill="none"
            stroke="rgba(0,0,0,0.06)"
            strokeWidth="10" />
          <text x="74" y="68" textAnchor="middle"
            fill="var(--color-text)"
            fontSize="26" fontWeight="700"
            fontFamily="'General Sans', sans-serif">
            {animated}
          </text>
          <text x="74" y="84" textAnchor="middle"
            fill="var(--color-text-faint)" fontSize="13"
            fontFamily="'General Sans', sans-serif">
            kcal consumed
          </text>
        </svg>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="148" height="148" viewBox="0 0 148 148"
        style={{
          filter: `drop-shadow(0 0 ${isOver ? '14px' : '8px'} rgba(76,175,80,${isOver ? '0.65' : '0.4'}))`,
          transition: 'filter 600ms ease',
        }}>
        <defs>
          <linearGradient id="calorieGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4CAF50" />
            <stop offset="100%" stopColor={isOver ? '#4CAF50' : '#1a7a42'} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx="74" cy="74" r={r}
          fill="none"
          stroke={isOver ? 'rgba(76,175,80,0.15)' : 'rgba(0,0,0,0.06)'}
          strokeWidth="10" />
        {/* Progress arc */}
        <circle cx="74" cy="74" r={r}
          fill="none"
          stroke={isOver ? '#4CAF50' : 'url(#calorieGrad)'}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${circ}`}
          strokeDashoffset={circ / 4}
          style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1), stroke 600ms ease' }}
        />
        <text x="74" y="68" textAnchor="middle"
          fill={isOver ? '#4CAF50' : 'var(--color-text)'}
          fontSize="26" fontWeight="700"
          fontFamily="'General Sans', sans-serif"
          style={{ transition: 'fill 400ms ease' }}>
          {animated}
        </text>
        <text x="74" y="84" textAnchor="middle"
          fill="var(--color-text-faint)" fontSize="13"
          fontFamily="'General Sans', sans-serif">
          of {target} kcal
        </text>
        <text x="74" y="99" textAnchor="middle"
          fill={isOver ? '#4CAF50' : 'var(--color-text-muted)'} fontSize="12"
          fontFamily="'General Sans', sans-serif"
          style={{ transition: 'fill 400ms ease' }}>
          {isOver ? '🎯 Goal hit!' : 'consumed'}
        </text>
      </svg>
    </div>
  )
}
