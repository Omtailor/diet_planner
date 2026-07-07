import { BMI_LABELS } from './constants'

// ─── BMI Helpers ────────────────────────────────────────────────

export function getBMICategory(bmi) {
  if (!bmi) return { label: 'Unknown', color: 'var(--color-text-faint)' }
  if (bmi < 18.5) return BMI_LABELS[0]   // Underweight
  if (bmi < 25)   return BMI_LABELS[1]   // Normal
  if (bmi < 30)   return BMI_LABELS[2]   // Overweight
  return BMI_LABELS[3]                    // Obese
}

/** Maps a BMI value to a 0–100 percentage position on the scale bar. */
export function getBMIPosition(bmi) {
  const clamped = Math.min(Math.max(bmi || 22, 10), 40)
  return ((clamped - 10) / 30) * 100
}

/** Returns the colour for each tick based on its proportional position. */
export function getTickColor(index, total) {
  const pct = index / (total - 1)
  if (pct < 0.25) return '#60B8FF'  // underweight – blue
  if (pct < 0.50) return '#4CAF50'  // normal – green
  if (pct < 0.75) return '#e09a2e'  // overweight – amber
  return '#e05252'                   // obese – red
}
