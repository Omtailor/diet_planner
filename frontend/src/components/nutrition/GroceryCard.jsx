import { ChevronRight } from 'lucide-react'
import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

export default function GroceryCard({ onView }) {
  return (
    <button onClick={onView} style={{
      width: '100%',
      ...GLASS_WHITE,
      borderRadius: '20px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '14px',
      cursor: 'pointer', transition: 'all 180ms ease',
    }}>
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(52,199,89,0.15)', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0
      }}>
        🛒
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-text)', fontFamily: FONT
        }}>
          Grocery List
        </p>
        <p style={{
          fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
          fontFamily: FONT, marginTop: '2px'
        }}>
          View & check ingredients
        </p>
      </div>
      <ChevronRight size={20} color="var(--color-text-muted)" />
    </button>
  )
}
