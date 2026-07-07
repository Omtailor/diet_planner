import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

export default function CheatMealButton({ onLog }) {
  return (
    <button onClick={onLog} style={{
      width: '100%',
      ...GLASS_WHITE,
      borderRadius: '20px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '14px',
      cursor: 'pointer', transition: 'all 180ms ease',
    }}>
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(255,59,48,0.15)', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0
      }}>
        🍔
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-text)', fontFamily: FONT
        }}>
          Log Cheat Meal
        </p>
        <p style={{
          fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
          fontFamily: FONT, marginTop: '2px'
        }}>
          AI detects food & adjusts plan
        </p>
      </div>
      <span style={{
        fontSize: '0.8rem', fontWeight: 700,
        color: '#FF3B30', background: 'rgba(255,59,48,0.1)',
        borderRadius: '999px', padding: '4px 12px',
        fontFamily: FONT
      }}>+ Log</span>
    </button>
  )
}
