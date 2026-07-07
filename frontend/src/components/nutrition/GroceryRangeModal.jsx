import { X } from 'lucide-react'
import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

export default function GroceryRangeModal({ 
  show, 
  onClose, 
  groceryStartDate, 
  setGroceryStartDate, 
  groceryEndDate, 
  setGroceryEndDate, 
  onConfirm 
}) {
  if (!show) return null

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 999,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex', alignItems: 'flex-end',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        animation: 'fadeUp 0.3s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%', maxHeight: '90dvh', overflowY: 'auto',
          ...GLASS_WHITE,
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '32px 32px 0 0',
          padding: '24px',
          boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
        }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px' }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Weekly Grocery List
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4 }}>
              Choose the date range to view ingredients
            </p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              Start Date
            </p>
            <input
              type="date"
              value={groceryStartDate}
              onChange={e => setGroceryStartDate(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none' }}
            />
          </div>
          <div>
            <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              End Date
            </p>
            <input
              type="date"
              value={groceryEndDate}
              min={groceryStartDate}
              onChange={e => setGroceryEndDate(e.target.value)}
              style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none' }}
            />
          </div>
        </div>
        {groceryStartDate && groceryEndDate && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{ display: 'inline-block', background: 'rgba(52,199,89,0.12)', color: 'var(--color-accent)', fontFamily: FONT, fontWeight: 700, fontSize: '0.85rem', borderRadius: 999, padding: '6px 16px' }}>
              {Math.max(0, Math.round((new Date(groceryEndDate) - new Date(groceryStartDate)) / (1000 * 60 * 60 * 24) + 1))} days selected
            </span>
          </div>
        )}
        <button
          onClick={onConfirm}
          disabled={!groceryStartDate || !groceryEndDate || groceryStartDate > groceryEndDate}
          style={{
            width: '100%', padding: '16px',
            background: groceryStartDate > groceryEndDate ? 'rgba(0,0,0,0.1)' : 'var(--color-accent)',
            border: 'none', borderRadius: 16,
            color: groceryStartDate > groceryEndDate ? 'var(--color-text-muted)' : '#ffffff',
            fontFamily: FONT, fontWeight: 800, fontSize: '1rem',
            cursor: groceryStartDate > groceryEndDate ? 'not-allowed' : 'pointer',
            boxShadow: groceryStartDate > groceryEndDate ? 'none' : '0 8px 24px rgba(52,199,89,0.3)',
            transition: 'all 180ms ease',
          }}
        >
          🛒 View Grocery List
        </button>
      </div>
    </div>
  )
}
