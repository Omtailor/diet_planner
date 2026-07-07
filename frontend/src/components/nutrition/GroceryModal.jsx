import { Loader2, X, CheckSquare, Square } from 'lucide-react'
import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

export default function GroceryModal({ 
  show, 
  onClose, 
  grocery, 
  groceryLoading, 
  groceryError, 
  toggleItem 
}) {
  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'fadeUp 0.3s ease-out'
    }}
      onClick={onClose}>

      <div style={{
        width: '100%', maxHeight: '85dvh',
        ...GLASS_WHITE,
        background: 'rgba(255, 255, 255, 0.85)',
        borderRadius: '32px 32px 0 0',
        padding: '24px',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
      }}
        onClick={e => e.stopPropagation()}>

        {/* Handle bar */}
        <div style={{
          width: '48px', height: '5px', borderRadius: '3px',
          background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '20px',
        }}>
          <div>
            <p style={{
              fontFamily: FONT,
              fontSize: '1.4rem', fontWeight: 800,
              color: 'var(--color-text)',
            }}>🛒 Grocery List</p>
            {grocery && (
              <p style={{
                fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
                fontFamily: FONT, marginTop: '4px',
              }}>
                {grocery.checked_items}/{grocery.total_items} items checked
              </p>
            )}
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: 'none',
            borderRadius: '50%', width: '36px', height: '36px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}>
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        {/* Content */}
        {groceryLoading ? (
          <div style={{
            display: 'flex', justifyContent: 'center',
            padding: '60px 40px',
          }}>
            <Loader2 size={32} color="var(--color-accent)"
              style={{ animation: 'spin 0.8s linear infinite' }} />
          </div>
        ) : (
          <>
            {groceryError && (
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                padding: '12px 14px',
                borderRadius: 14,
                marginBottom: 16,
                background: groceryError.type === 'no_plan'
                  ? 'rgba(255, 59, 48, 0.08)'
                  : 'rgba(255, 149, 0, 0.10)',
                border: `1px solid ${groceryError.type === 'no_plan'
                  ? 'rgba(255, 59, 48, 0.2)'
                  : 'rgba(255, 149, 0, 0.25)'}`,
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0 }}>
                  {groceryError.type === 'no_plan' ? '🚫' : '📅'}
                </span>
                <p style={{
                  fontFamily: FONT,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: groceryError.type === 'no_plan' ? '#FF3B30' : '#FF9500',
                  lineHeight: 1.5,
                  margin: 0,
                }}>
                  {groceryError.message}
                </p>
              </div>
            )}

            {!grocery?.items?.length && !groceryError ? (
              <p style={{
                textAlign: 'center', padding: '60px 40px',
                color: 'var(--color-text-muted)', fontWeight: 500,
                fontFamily: FONT, fontSize: '1rem',
              }}>No grocery list found. Generate your meal plan first.</p>
            ) : (
              <div style={{
                overflowY: 'auto', flex: 1,
                display: 'flex', flexDirection: 'column', gap: '10px',
                paddingRight: '4px',
              }}>
                {grocery?.items?.map(item => (
                  <button key={item.id}
                    onClick={() => toggleItem(item.id, item.is_checked)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '16px',
                      background: item.is_checked
                        ? 'rgba(52,199,89,0.08)'
                        : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${item.is_checked
                        ? 'rgba(52,199,89,0.3)'
                        : 'rgba(0,0,0,0.05)'}`,
                      borderRadius: '16px', cursor: 'pointer',
                      transition: 'all 180ms ease', textAlign: 'left',
                    }}>
                    {item.is_checked
                      ? <CheckSquare size={22} color="var(--color-accent)" />
                      : <Square size={22} color="var(--color-text-faint)" />}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: FONT, fontWeight: 700,
                        fontSize: '1rem',
                        color: item.is_checked
                          ? 'var(--color-text-muted)' : 'var(--color-text)',
                        textTransform: 'capitalize',
                        textDecoration: item.is_checked ? 'line-through' : 'none',
                      }}>{item.ingredient_name}</p>
                    </div>
                    <span style={{
                      fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600,
                      fontFamily: FONT, flexShrink: 0,
                    }}>
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* Done button */}
        <button onClick={onClose} style={{
          marginTop: '20px', padding: '16px',
          background: 'var(--color-accent)', border: 'none',
          borderRadius: '16px', color: '#ffffff',
          fontFamily: FONT, fontWeight: 800,
          fontSize: '1rem', cursor: 'pointer', flexShrink: 0,
          boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
        }}>
          Done
        </button>
      </div>
    </div>
  )
}
