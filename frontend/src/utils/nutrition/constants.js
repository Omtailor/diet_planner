// ─── Nutrition Constants ───────────────────────────────────────────────────

export const STEPS = [
  { emoji: '📊', text: 'Calculating your TDEE & macros' },
  { emoji: '🥗', text: 'Designing Day 1 meals' },
  { emoji: '🍱', text: 'Planning Day 2 meals' },
  { emoji: '🌙', text: 'Building Day 3 meals' },
  { emoji: '✅', text: 'Validating macros & variety' },
];

export const FONT = "'General Sans', sans-serif";

export const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

export const DIET_POOLS = {
  veg: ['🌾', '🥦', '🥕', '🧅', '🫘', '🧀', '🌽', '🥒', '🍅', '🥑', '🥛', '🫑', '🌿', '🍋', '🥜', '🧆', '🫚', '🥗'],
  jain: ['🌾', '🫘', '🧀', '🌽', '🥒', '🍅', '🥑', '🥛', '🫑', '🌿', '🍋', '🥜', '🧆', '🫚', '🥗', '🌾', '🫘', '🧀'],
  'non-veg': ['🌾', '🥦', '🥕', '🧅', '🥚', '🍗', '🥩', '🐟', '🦐', '🧀', '🌽', '🫘', '🍅', '🥑', '🫑', '🌿', '🥜', '🧆'],
};
