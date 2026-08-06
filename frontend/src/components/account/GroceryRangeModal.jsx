import { S } from '../../utils/account/styles'

export default function GroceryRangeModal({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onClose,
  onConfirm,
}) {
  const isInvalidRange = !!startDate && !!endDate && startDate > endDate

  return (
    <div style={S.groceryRangeOverlay} onClick={onClose}>
      <div style={S.groceryRangeCard} onClick={(e) => e.stopPropagation()}>
        <div style={S.groceryHandle} />

        <div style={S.groceryRangeHeader}>
          <div>
            <p style={S.groceryRangeTitle}>Grocery List</p>
            <p style={S.groceryRangeSubtitle}>Choose the date range to view ingredients</p>
          </div>
          <button onClick={onClose} style={S.groceryRangeCloseBtn}>
            ✕
          </button>
        </div>

        <div style={S.groceryRangeFields}>
          <div>
            <p style={S.groceryLabelSmall}>Start Date</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              style={S.groceryDateInput}
            />
          </div>
          <div>
            <p style={S.groceryLabelSmall}>End Date</p>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              style={S.groceryDateInput}
            />
          </div>
        </div>

        {startDate && endDate && startDate <= endDate && (
          <div style={S.groceryDaysPillWrap}>
            <span style={S.groceryDaysPill}>
              {Math.round((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24) + 1)} days selected
            </span>
          </div>
        )}

        <button onClick={onConfirm} disabled={isInvalidRange || !startDate || !endDate} style={{
          ...S.groceryViewBtn,
          background: isInvalidRange ? 'rgba(0,0,0,0.1)' : 'var(--color-accent)',
          color: isInvalidRange ? 'var(--color-text-muted)' : '#ffffff',
          cursor: isInvalidRange ? 'not-allowed' : 'pointer',
          boxShadow: isInvalidRange ? 'none' : '0 8px 24px rgba(52,199,89,0.3)',
        }}>
          🛒 View Grocery List
        </button>
      </div>
    </div>
  )
}
