// ─── Dashboard Constants ────────────────────────────────────────

export const FONT = "'General Sans', sans-serif"

export const QUOTES = [
  "Your body can do it. It's your mind you need to convince. 💪",
  "Small steps every day lead to big results. 🌱",
  "Discipline is choosing between what you want now and what you want most. 🎯",
  "Don't stop when you're tired. Stop when you're done. 🔥",
  "The only bad workout is the one that didn't happen. ⚡",
  "You don't have to be extreme, just consistent. 📈",
  "Eat well, move daily, sleep deeply. Repeat. 🔄",
  "Your future self is watching you right now. 👁️",
  "Progress, not perfection. 🏆",
  "Every rep, every meal, every step counts. ✅",
  "Fuel your body like the champion you are. 🥗",
  "Consistency beats intensity every single time. ⏱️",
  "One healthy choice leads to another. 🍎",
  "You are one workout away from a good mood. 😊",
  "The pain of discipline is far less than the pain of regret. 🧠",
  "Strong is the new healthy. 💚",
  "Make your health your hobby. 🏃",
  "Today's effort is tomorrow's result. 🌅",
  "Don't wish for a good body. Work for it. 🏋️",
  "What you eat in private, you wear in public. 👀",
  "Your health is an investment, not an expense. 💰",
  "A little progress each day adds up to big results. 📊",
  "Be stronger than your excuses. 🚫",
  "Success starts with self-discipline. 🔑",
  "Hydrate. Nourish. Move. Rest. Repeat. 💧",
  "You didn't come this far to only come this far. 🚀",
  "Take care of your body. It's the only place you have to live. 🏡",
  "Rome wasn't built in a day, but they were consistent. 🏛️",
  "Sweat now, shine later. ✨",
  "Your only competition is who you were yesterday. 🪞",
]

// ─── BMI Ranges ─────────────────────────────────────────────────

export const BMI_LABELS = [
  { label: 'Underweight', color: '#60B8FF' },
  { label: 'Normal',      color: '#4CAF50' },
  { label: 'Overweight',  color: '#e09a2e' },
  { label: 'Obese',       color: '#e05252' },
]

export const BMI_TICKS = 28

// ─── Meal Slot Config ────────────────────────────────────────────

export const MEAL_SLOT_CONFIG = {
  breakfast: { emoji: '🌅', label: 'Breakfast' },
  lunch:     { emoji: '☀️', label: 'Lunch' },
  dinner:    { emoji: '🌙', label: 'Dinner' },
}

/** Time-of-day cutoffs (in minutes since midnight) for calorie/macro counting */
export const MEAL_TIMES = {
  breakfast: 8  * 60,          // 8:00 AM → 480
  lunch:     13 * 60,          // 1:00 PM → 780
  dinner:    20 * 60 + 30,     // 8:30 PM → 1230
}

// ─── Macro Colors ────────────────────────────────────────────────

export const MACRO_CONFIG = [
  { key: 'protein', label: 'Protein', trackColor: '#60B8FF', glowColor: 'rgba(96,184,255,0.45)' },
  { key: 'carbs',   label: 'Carbs',   trackColor: '#e09a2e', glowColor: 'rgba(224,154,46,0.45)' },
  { key: 'fats',    label: 'Fats',    trackColor: '#e05252', glowColor: 'rgba(224,82,82,0.45)'  },
]

// ─── Calorie Macro Split Ratios ──────────────────────────────────

export const MACRO_RATIOS = {
  protein: { ratio: 0.30, kcalPerGram: 4 },
  carbs:   { ratio: 0.45, kcalPerGram: 4 },
  fats:    { ratio: 0.25, kcalPerGram: 9 },
}

// ─── Status Config ───────────────────────────────────────────────

export const STATUS_CONFIG = {
  on_track:    { label: 'On Track ✅',  color: 'var(--color-accent)' },
  adjusted:    { label: 'Adjusted ⚠️',  color: '#e09a2e' },
  regenerated: { label: 'Updated 🔄',   color: 'var(--color-accent)' },
}

// ─── Dashboard Cache ─────────────────────────────────────────────

export const DASH_MEAL_TTL       = 60  * 1000   // 60 s
export const REFETCH_COOLDOWN    = 30  * 1000   // 30 s

// ─── Onboarding Blocker Checklist ────────────────────────────────

export const ONBOARDING_CHECKLIST = [
  { emoji: '👤', text: 'Basic info — age, gender, city' },
  { emoji: '⚖️', text: 'Body stats — height & weight' },
  { emoji: '🎯', text: 'Your goal — fat loss, muscle gain...' },
  { emoji: '🥗', text: 'Diet preference — veg, non-veg, jain' },
]
