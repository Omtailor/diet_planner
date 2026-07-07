import toast from 'react-hot-toast'

/**
 * Returns true if all required fields for the given step are filled.
 * Used to control the disabled state of the Continue button.
 */
export function isStepValid(step, data) {
  switch (step) {
    case 1: return !!(data.name.trim() && data.age && data.city.trim() && data.gender)
    case 2: return !!(data.height_cm && data.weight_kg && data.target_weight_kg && data.health_time_minutes)
    case 3: return !!(data.goal && data.diet_preference)
    case 4:
      if (data.beverage_habit === 'tea')    return !!data.tea_type
      if (data.beverage_habit === 'coffee') return !!data.coffee_type
      if (data.beverage_habit === 'both')   return !!(data.morning_beverage && data.evening_beverage)
      return true
    case 5:
      if (data.is_fasting) return !!(data.fasting_days.trim() && data.fasting_type.trim())
      return data.has_gym !== undefined
    case 6: return true
    default: return false
  }
}

/**
 * Shows a toast error and returns false if the current step has missing
 * required fields. Returns true when validation passes.
 */
export function validateStep(step, data) {
  switch (step) {
    case 1:
      if (!data.name || !data.age || !data.city || !data.gender) {
        toast.error('Please fill in all fields'); return false
      }
      break
    case 2:
      if (!data.height_cm || !data.weight_kg || !data.target_weight_kg || !data.health_time_minutes) {
        toast.error('Please fill in all fields'); return false
      }
      break
    case 3:
      if (!data.goal || !data.diet_preference) {
        toast.error('Please select your goal and diet'); return false
      }
      break
    case 4:
      if (data.beverage_habit === 'tea' && !data.tea_type) {
        toast.error('Please select tea type'); return false
      }
      if (data.beverage_habit === 'coffee' && !data.coffee_type) {
        toast.error('Please select coffee type'); return false
      }
      if (data.beverage_habit === 'both' && (!data.morning_beverage || !data.evening_beverage)) {
        toast.error('Please select morning & evening beverages'); return false
      }
      break
    default: break
  }
  return true
}
