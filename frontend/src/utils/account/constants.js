export const FONT = "'General Sans', sans-serif"

export const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
}

export const ALL_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const MENU_ITEMS = [
  { icon: '👤', label: 'Personal Info', sub: 'Name, age, city', key: 'personal' },
  { icon: '📊', label: 'Body Stats', sub: 'Weight, height, BMI', key: 'body' },
  { icon: '🎯', label: 'Goals & Diet', sub: 'Goal, diet preference', key: 'goals' },
  {
    icon: '🏋️',
    label: 'Gym & Activity',
    key: 'gym',
    getSub: (profile) => profile?.health_time_minutes === 0
      ? '⚠️ Health time is 0 — tap to fix'
      : `${profile?.health_time_minutes ?? 60} min/day · ${profile?.has_gym ? 'Gym' : 'No gym'}`,
  },
  {
    icon: '🙏',
    label: 'Fasting',
    key: 'fasting',
    getSub: (profile) => profile?.is_fasting
      ? `Fasting · ${profile?.fasting_days ? profile.fasting_days.split(',').map((day) => day.trim().charAt(0).toUpperCase() + day.trim().slice(1)).join(', ') : 'No days set'}`
      : 'Not fasting',
  },
  { icon: '🍔', label: 'Cheat Meal History', sub: 'Past cheat meals', key: 'cheat' },
  { icon: '🛒', label: 'Grocery List', sub: 'Weekly ingredients', key: 'grocery' },
]

export const GOAL_OPTIONS = [
  { value: 'muscle_building', label: 'Muscle Building' },
  { value: 'fat_loss', label: 'Fat Loss' },
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'maintenance', label: 'Maintenance' },
]

export const DIET_OPTIONS = [
  { value: 'jain', label: 'Jain' },
  { value: 'veg', label: 'Vegetarian' },
  { value: 'non_veg', label: 'Non-Vegetarian' },
]
