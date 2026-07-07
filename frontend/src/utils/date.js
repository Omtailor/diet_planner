// ─── Date Helpers ───────────────────────────────────────────────────

export function getDateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  // Use local date parts instead of toISOString
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function formatDisplayDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

export function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

export function getWeekDays(centerDate) {
  const center = new Date(centerDate)
  const days = []
  for (let i = -3; i <= 11; i++) {
    const d = new Date(center.getTime())
    d.setDate(d.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return days
}

/**
 * Returns a wide date range for the training page date strip.
 * Covers 15 days in the past and 28 days in the future from centerDate.
 */
export function getTrainingWeekDays(centerDate) {
  const center = new Date(centerDate)
  const days = []
  for (let i = -15; i < 29; i++) {
    const d = new Date(center)
    d.setDate(center.getDate() + i)
    const yyyy = d.getFullYear()
    const mm = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    days.push(`${yyyy}-${mm}-${dd}`)
  }
  return days
}
