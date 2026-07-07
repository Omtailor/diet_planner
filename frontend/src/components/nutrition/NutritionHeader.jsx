import { ChevronLeft, ChevronRight } from 'lucide-react'
import { FONT } from '../../utils/nutrition/constants'
import { formatDisplayDate, formatFullDate } from '../../utils/date'

export default function NutritionHeader({ selectedDate, handleDateChange }) {
  return (
    <div style={dateHeaderStyle}>
      <button onClick={() => handleDateChange(-1)} style={navBtnStyle}>
        <ChevronLeft size={20} color="var(--color-text)" />
      </button>
      <div style={{ textAlign: 'center' }}>
        <p style={{
          fontFamily: FONT,
          fontSize: '1.2rem', fontWeight: 800,
          color: 'var(--color-text)', letterSpacing: '-0.2px'
        }}>
          {formatDisplayDate(selectedDate)}
        </p>
        <p style={{
          fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
          fontFamily: FONT, marginTop: '2px'
        }}>
          {formatFullDate(selectedDate)}
        </p>
      </div>
      <button onClick={() => handleDateChange(1)} style={navBtnStyle}>
        <ChevronRight size={20} color="var(--color-text)" />
      </button>
    </div>
  )
}

const dateHeaderStyle = {
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', padding: '4px 8px',
}

const navBtnStyle = {
  width: '44px', height: '44px',
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(0,0,0,0.04)',
  borderRadius: '14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
}
