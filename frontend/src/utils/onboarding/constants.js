import bg6 from '../../assets/images/bg-6.webp'
import bg7 from '../../assets/images/bg-7.webp'
import bg8 from '../../assets/images/bg-8.webp'
import bg9 from '../../assets/images/bg-9.webp'
import bg10 from '../../assets/images/bg-10.webp'
import bg11 from '../../assets/images/bg-11.webp'

export const STEP_IMAGES = [bg6, bg7, bg8, bg9, bg10, bg11]

export const TOTAL_STEPS = 6

export const LOADING_SENTENCES = [
  "Saving your profile...",
  "Storing your health details...",
  "Setting up your preferences...",
  "Configuring your dietary settings...",
  "Almost there...",
  "Finalizing your profile setup...",
]

export const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const GENDER_OPTIONS = ['male', 'female', 'other']

export const GOALS = [
  { key: 'muscle_building', label: '💪 Muscle Building', desc: 'Gain lean muscle mass' },
  { key: 'fat_loss',        label: '🔥 Fat Loss',        desc: 'Burn fat, stay energized' },
  { key: 'weight_loss',     label: '⚖️ Weight Loss',     desc: 'Reduce overall weight' },
  { key: 'maintenance',     label: '🎯 Maintenance',     desc: 'Maintain current body' },
]

export const DIET_OPTIONS = [
  { key: 'jain',    label: '🌿 Jain' },
  { key: 'veg',     label: '🥦 Veg' },
  { key: 'non_veg', label: '🍗 Non-Veg' },
]

export const BEVERAGE_OPTIONS = ['none', 'tea', 'coffee', 'both']

export const TEA_TYPES = [
  { key: 'milk',  label: 'Milk Tea' },
  { key: 'black', label: 'Black Tea' },
  { key: 'green', label: 'Green Tea' },
]

export const COFFEE_TYPES = [
  { key: 'milk',  label: 'Milk Coffee' },
  { key: 'black', label: 'Black Coffee' },
]
