import { FONT } from './constants'

// ─── Shared Style Tokens ────────────────────────────────────────

export const glassCard = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
  borderRadius: '24px',
  padding: '20px 18px',
  transition: 'all 300ms ease',
}

export const sectionLabel = {
  fontSize: '0.75rem', fontWeight: 700,
  color: 'var(--color-text-faint)',
  letterSpacing: '1px', textTransform: 'uppercase',
  fontFamily: FONT,
}

export const accentBtn = {
  fontSize: '0.9rem', fontWeight: 700,
  color: '#ffffff', background: 'var(--color-accent)',
  border: 'none', borderRadius: '16px',
  padding: '14px 20px', cursor: 'pointer',
  fontFamily: FONT,
  transition: 'opacity 180ms ease, transform 150ms ease',
  boxShadow: '0 8px 24px rgba(52,199,89,0.30)',
}

// ─── Weight Card ────────────────────────────────────────────────

export const weightRow = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.80)',
  borderRadius: '16px', padding: '14px 16px',
}

export const weightIcon = {
  width: '36px', height: '36px', borderRadius: '9px',
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
}

export const weightLabel = {
  fontSize: '0.8rem', color: 'var(--color-text-muted)',
  fontFamily: FONT, letterSpacing: '0.3px',
}

export const weightVal = {
  fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)',
  fontFamily: FONT,
}

export const noteText = {
  fontSize: '0.85rem', color: 'var(--color-text-muted)',
  fontFamily: FONT, marginTop: '12px',
  background: 'rgba(255,255,255,0.50)',
  borderRadius: '10px', padding: '10px 12px', lineHeight: 1.5,
}

// ─── Modal ──────────────────────────────────────────────────────

export const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(15,31,18,0.35)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 200,
  display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
}

export const modalSheet = {
  width: '100%', maxWidth: '480px',
  background: 'rgba(255,255,255,0.85)',
  backdropFilter: 'blur(30px) saturate(200%)',
  WebkitBackdropFilter: 'blur(30px) saturate(200%)',
  border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: '24px 24px 0 0',
  padding: '12px 24px 32px',
  boxShadow: '0 -8px 40px rgba(0,0,0,0.08)',
}

export const modalHandle = {
  width: '40px', height: '4px',
  background: 'rgba(0,0,0,0.10)',
  borderRadius: '4px', margin: '0 auto 20px',
}

export const inputStyle = {
  flex: 1, padding: '13px 16px',
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255,255,255,0.70)',
  borderRadius: '12px',
  color: 'var(--color-text)', fontSize: '1rem',
  fontFamily: FONT,
  transition: 'border-color 180ms ease, box-shadow 180ms ease',
}

// ─── Meal Card ──────────────────────────────────────────────────

export const mealCardStyle = {
  width: '100%',
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.80)',
  borderRadius: '20px',
  padding: '16px',
  cursor: 'pointer',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  boxShadow: '0 4px 16px rgba(0,0,0,0.03)',
  animation: 'mealSlideIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
}

export const mealThumb = {
  width: '48px', height: '48px',
  background: 'rgba(255,255,255,0.70)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: '14px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
}

export const quoteCardStyle = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
  borderRadius: '24px',
  padding: '20px 18px',
  cursor: 'pointer',
  transition: 'all 300ms cubic-bezier(0.4,0,0.2,1)',
}

// ─── Page-level ─────────────────────────────────────────────────

export const pageWrapper = {
  display: 'flex', flexDirection: 'column',
  gap: '16px', padding: '0 16px 100px',
  paddingBottom: '100px',
  position: 'relative',
  fontFamily: FONT,
  minHeight: '100dvh', background: '#F2F2F7',
}

export const ambientBg = {
  display: 'none',
}

export const greetingSection = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0',
}

export const greetingTime = {
  fontSize: '0.85rem', color: 'var(--color-text-faint)',
  fontFamily: FONT, marginBottom: '4px',
}

export const greetingName = {
  fontFamily: FONT,
  fontSize: '1.5rem', fontWeight: 800,
  color: 'var(--color-text)', letterSpacing: '-0.3px', lineHeight: 1.2,
}

export const avatarCircle = {
  width: '44px', height: '44px',
  background: 'var(--color-accent)',
  borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.125rem', fontWeight: 700,
  color: '#ffffff', fontFamily: FONT,
  flexShrink: 0,
  boxShadow: '0 0 20px rgba(76,175,80,0.35)',
}

export const statusBannerExtra = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
}

export const regenBtn = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: 'rgba(255,255,255,0.65)',
  border: '1px solid rgba(255,255,255,0.75)',
  borderRadius: '8px', padding: '6px 10px',
  color: 'var(--color-text-muted)', cursor: 'pointer',
  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  transition: 'all 200ms ease',
}

export const quickGrid = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
  alignItems: 'stretch',
}

export const quickBtn = {
  background: 'rgba(255,255,255,0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255,255,255,0.80)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
  borderRadius: '20px', padding: '20px 8px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: '10px', cursor: 'pointer', width: '100%',
  minHeight: '110px',
  transition: 'all 250ms cubic-bezier(0.16,1,0.3,1)',
}

export const quickIconWrap = {
  width: '50px', height: '50px',
  borderRadius: '12px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'transform 200ms ease',
}

export const ghostBtn = {
  background: 'none', border: 'none', cursor: 'pointer',
  fontSize: '0.875rem', color: 'var(--color-accent)',
  fontFamily: "'Satoshi', sans-serif",
  fontWeight: 600, padding: '0 0 2px 0',
}

export const emptyState = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '8px', padding: '24px 0',
}
