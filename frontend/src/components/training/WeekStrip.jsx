import { forwardRef } from 'react';
import { FONT, GLASS_WHITE } from '../../utils/training/constants';
import { getTrainingWeekDays, getDateStr } from '../../utils/date';

/**
 * Horizontally scrollable date strip for the training page.
 * Covers 15 days in the past and 28 days in the future.
 */
const WeekStrip = forwardRef(function WeekStrip({ selectedDate, onSelect }, ref) {
  const days = getTrainingWeekDays(getDateStr(0));
  const todayStr = getDateStr(0);

  return (
    <div
      ref={ref}
      style={{
        ...GLASS_WHITE,
        display: 'flex',
        borderRadius: 24,
        padding: 10,
        overflowX: 'auto',
        gap: 4,
        scrollbarWidth: 'none',
        msOverflowStyle: 'none',
        scrollSnapType: 'x mandatory',
      }}
      className="week-strip"
    >
      {days.map(d => {
        const isSelected = d === selectedDate;
        const isToday = d === todayStr;
        const dayLabel = new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });
        const dayNum = new Date(d).getDate();
        return (
          <button
            key={d}
            data-selected={isSelected}
            onClick={() => onSelect(d)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: 6, padding: '10px 8px', borderRadius: 16, border: 'none',
              cursor: 'pointer', minWidth: 44, flexShrink: 0, scrollSnapAlign: 'center',
              background: isSelected ? 'var(--color-accent)' : 'transparent',
              boxShadow: isSelected ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
              transition: 'all 200ms ease',
            }}
          >
            <span style={{
              fontSize: '0.65rem', fontWeight: 700, fontFamily: FONT,
              color: isSelected ? '#ffffff' : 'var(--color-text-faint)',
              textTransform: 'uppercase', letterSpacing: '0.5px',
            }}>
              {dayLabel}
            </span>
            <span style={{
              fontSize: '1rem', fontWeight: 800, fontFamily: FONT,
              color: isSelected ? '#ffffff' : isToday ? 'var(--color-accent)' : 'var(--color-text)',
            }}>
              {dayNum}
            </span>
            {isToday && !isSelected && (
              <div style={{
                width: 5, height: 5, marginTop: 2,
                background: 'var(--color-accent)', borderRadius: '50%',
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
});

export default WeekStrip;
