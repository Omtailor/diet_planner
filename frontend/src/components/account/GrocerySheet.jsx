import { S } from '../../utils/account/styles'

function formatRangeDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function GrocerySheet({
  grocery,
  loading,
  error,
  startDate,
  endDate,
  onClose,
  onChangeDates,
  onDone,
  onToggleItem,
}) {
  return (
    <div style={S.grocerySheetOverlay} onClick={onClose}>
      <div style={S.grocerySheetCard} onClick={(e) => e.stopPropagation()}>
        <div style={S.groceryHandle} />

        <div style={S.grocerySheetHeader}>
          <div>
            <p style={S.grocerySheetTitle}>🛒 Grocery List</p>
            {grocery && (
              <p style={S.grocerySheetSubtitle}>
                {grocery.checked_items}/{grocery.total_items} items checked ·{' '}
                <span style={{ color: 'var(--color-text-faint)' }}>
                  {formatRangeDate(startDate)}
                  {' – '}
                  {formatRangeDate(endDate)}
                </span>
              </p>
            )}
          </div>
          <button onClick={onClose} style={S.grocerySheetCloseBtn}>
            ✕
          </button>
        </div>

        {loading ? (
          <div style={S.groceryLoadingWrap}>
            <p style={S.groceryLoadingText}>Loading...</p>
          </div>
        ) : (
          <>
            {error && (
              <div style={{
                ...S.groceryErrorBox,
                background: error.type === 'no_plan'
                  ? 'rgba(255, 59, 48, 0.08)'
                  : 'rgba(255, 149, 0, 0.10)',
                border: `1px solid ${error.type === 'no_plan'
                  ? 'rgba(255, 59, 48, 0.2)'
                  : 'rgba(255, 149, 0, 0.25)'}`,
              }}>
                <span style={S.groceryErrorIcon}>
                  {error.type === 'no_plan' ? '🚫' : '📅'}
                </span>
                <p style={{
                  ...S.groceryErrorText,
                  color: error.type === 'no_plan' ? '#FF3B30' : '#FF9500',
                }}>
                  {error.message}
                </p>
              </div>
            )}

            {!grocery?.items?.length && !error ? (
              <p style={S.groceryEmptyText}>
                No grocery list found for this date range.
              </p>
            ) : (
              <div style={S.groceryList}>
                {grocery?.items?.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleItem(item)}
                    style={{
                      ...S.groceryItem,
                      background: item.is_checked ? 'rgba(52,199,89,0.08)' : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${item.is_checked ? 'rgba(52,199,89,0.3)' : 'rgba(0,0,0,0.05)'}`,
                    }}
                  >
                    <span style={{ fontSize: '1.2rem' }}>{item.is_checked ? '✅' : '◻️'}</span>
                    <div style={S.groceryItemTextWrap}>
                      <p style={{
                        ...S.groceryItemText,
                        color: item.is_checked ? 'var(--color-text-muted)' : 'var(--color-text)',
                        textDecoration: item.is_checked ? 'line-through' : 'none',
                      }}>
                        {item.ingredient_name}
                      </p>
                    </div>
                    <span style={S.groceryItemQty}>
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <div style={S.groceryFooter}>
          <button onClick={onChangeDates} style={{ ...S.modalSecondaryBtn, flex: 1 }}>
            Change Dates
          </button>
          <button onClick={onDone} style={{ ...S.modalPrimaryBtn, flex: 1 }}>
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
