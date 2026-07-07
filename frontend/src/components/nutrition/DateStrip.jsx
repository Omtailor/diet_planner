import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'
import { getDateStr } from '../../utils/date'

export default function DateStrip({
  weekStripRef,
  weekDays,
  selectedDate,
  setSelectedDate,
  setDateOffset,
  switchSlot,
  prefetchDate,
}) {
  return (
    <div ref={weekStripRef} style={weekStripStyle} className="week-strip">
      {weekDays.map((d) => {
        const isSelected = d === selectedDate
        const isToday = d === getDateStr(0)
        const dayLabel = new Date(d).toLocaleDateString('en-IN', { weekday: 'short' })
        const dayNum = new Date(d).getDate()
        return (
          <button key={d}
            data-selected={isSelected}
            onClick={() => { setSelectedDate(d); setDateOffset(0); switchSlot(0); }}
            onMouseEnter={() => {
              prefetchDate(d)
            }}
            onTouchStart={() => {
              prefetchDate(d)
            }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '6px',
              padding: '10px 8px', borderRadius: '16px',
              border: 'none', cursor: 'pointer',
              minWidth: '44px', flexShrink: 0,
              scrollSnapAlign: 'center',
              background: isSelected ? 'var(--color-accent)' : 'transparent',
              boxShadow: isSelected ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
              transition: 'all 200ms ease',
            }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: isSelected ? '#ffffff' : 'var(--color-text-faint)',
              fontFamily: FONT,
              textTransform: 'uppercase', letterSpacing: '0.5px'
            }}>
              {dayLabel}
            </span>
            <span style={{
              fontSize: '1rem', fontWeight: 800,
              color: isSelected ? '#ffffff' : isToday ? 'var(--color-accent)' : 'var(--color-text)',
              fontFamily: FONT
            }}>
              {dayNum}
            </span>
            {isToday && !isSelected && (
              <div style={{
                width: '5px', height: '5px', marginTop: '2px',
                background: 'var(--color-accent)', borderRadius: '50%'
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}

const weekStripStyle = {
  ...GLASS_WHITE,
  display: 'flex',
  borderRadius: '24px', padding: '10px',
  overflowX: 'auto',
  overflowY: 'hidden',
  scrollSnapType: 'x mandatory',
  scrollbarWidth: 'none',
  msOverflowStyle: 'none',
  gap: '4px',
}
