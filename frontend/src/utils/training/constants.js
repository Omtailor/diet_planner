// ─── Training Constants ────────────────────────────────────────

export const FONT = "'General Sans', sans-serif";

export const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

export const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const CATEGORY_META = {
  strength:    { icon: '🏋️‍♂️', color: '#34C759', glow: 'rgba(52,199,89,0.4)',   bg: 'rgba(52,199,89,0.1)' },
  cardio:      { icon: '🏃',     color: '#FF9500', glow: 'rgba(255,149,0,0.4)',  bg: 'rgba(255,149,0,0.1)' },
  flexibility: { icon: '🤸‍♂️', color: '#AF52DE', glow: 'rgba(175,82,222,0.4)', bg: 'rgba(175,82,222,0.1)' },
  bodyweight:  { icon: '💪',     color: '#007AFF', glow: 'rgba(0,122,255,0.4)', bg: 'rgba(0,122,255,0.1)' },
};

// Style token sheet shared across training components
export const S = {
  page: {
    minHeight: '100dvh',
    position: 'relative',
    fontFamily: FONT,
    background: '#F2F2F7',
  },

  // ── Loading ──
  centeredContent: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', gap: '16px',
  },
  spinnerRing: {
    width: '40px', height: '40px', borderRadius: '50%',
    border: '4px solid rgba(52,199,89,0.2)',
    borderTop: '4px solid var(--color-accent)',
  },
  loadingText: {
    fontFamily: FONT, fontSize: '1rem', fontWeight: 500,
    color: 'var(--color-text-muted)',
  },

  // ── Reusable Glass Card ──
  glassCard: {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    borderRadius: '24px', padding: '40px 24px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px', textAlign: 'center',
  },

  // ── No Plan ──
  noPlanTitle: {
    fontFamily: FONT, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)',
  },
  noPlanSub: {
    fontSize: '0.95rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, maxWidth: '28ch', lineHeight: 1.5,
  },
  generateBtn: {
    marginTop: '12px', padding: '16px 32px',
    background: 'var(--color-accent)', border: 'none',
    borderRadius: '16px', color: '#ffffff',
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
    transition: 'transform 150ms ease',
  },

  // ── Body ──
  body: {
    padding: '0 16px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },

  // ── Day Header Card ──
  dayHeaderCard: {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    borderRadius: '20px', padding: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  dayHeaderTitle: {
    fontFamily: FONT, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)',
  },
  dayHeaderSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '4px',
  },
  dayHeaderBadge: {
    background: 'rgba(52,199,89,0.15)',
    borderRadius: '999px', padding: '6px 14px',
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)',
    fontFamily: FONT,
  },

  // ── Exercise Group ──
  exGroupCard: {
    background: 'rgba(255, 255, 255, 0.65)',
    backdropFilter: 'blur(24px) saturate(180%)',
    WebkitBackdropFilter: 'blur(24px) saturate(180%)',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    borderRadius: '20px', overflow: 'hidden',
  },
  exGroupHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    background: 'rgba(255,255,255,0.4)',
  },
  exName: {
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)',
  },
  exMeta: {
    fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: '4px',
  },
  exInstructions: {
    fontSize: '0.9rem', color: 'var(--color-text)', fontFamily: FONT,
    marginTop: '12px', lineHeight: 1.6,
    padding: '14px',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '12px', textAlign: 'left',
  },

  // ── Rest Day Tips ──
  restTitle: {
    fontFamily: FONT, fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)',
  },
  restSub: {
    fontSize: '0.95rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, maxWidth: '30ch', lineHeight: 1.5,
  },
  restTip: {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px', padding: '16px',
    fontSize: '0.95rem',
    fontFamily: FONT,
    display: 'flex', alignItems: 'center', width: '100%',
    cursor: 'default',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
  },

  navBtn: {
    width: 44, height: 44,
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
};
