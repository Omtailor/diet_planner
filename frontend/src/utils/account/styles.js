import { FONT, GLASS_WHITE } from './constants'

export const S = {
  pageWrap: {
    display: 'flex', flexDirection: 'column',
    gap: '16px', padding: '16px',
  },
  profileHeader: {
    display: 'flex', alignItems: 'center', gap: '16px',
    ...GLASS_WHITE,
    borderRadius: '24px', padding: '24px 20px',
  },
  avatarLarge: {
    width: '64px', height: '64px',
    background: 'var(--color-accent)', borderRadius: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.8rem', fontWeight: 800,
    color: '#ffffff', fontFamily: FONT,
    flexShrink: 0, boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
  },
  profileName: {
    fontFamily: FONT,
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)', letterSpacing: '-0.3px',
  },
  profileGoal: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '4px',
    textTransform: 'capitalize',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
  },
  statBox: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '16px 10px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '6px',
  },
  statVal: {
    fontFamily: FONT,
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-accent)',
  },
  statLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--color-text-muted)', fontFamily: FONT,
    letterSpacing: '0.5px', textTransform: 'uppercase',
  },
  menuCard: {
    ...GLASS_WHITE,
    borderRadius: '24px', overflow: 'hidden',
  },
  menuItem: {
    width: '100%', display: 'flex',
    alignItems: 'center', gap: '14px',
    padding: '16px 20px', background: 'transparent',
    cursor: 'pointer', transition: 'background 180ms ease',
  },
  menuIcon: {
    width: '44px', height: '44px',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', flexShrink: 0,
  },
  menuLabel: {
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--color-text)', fontFamily: FONT,
  },
  menuSub: {
    fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '2px',
  },
  menuChevron: {
    color: 'var(--color-text-faint)', fontSize: '1.2rem',
  },
  infoCard: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
    alignItems: 'center',
  },
  infoText: {
    fontSize: '0.8rem', color: 'var(--color-text-faint)', fontWeight: 600,
    fontFamily: FONT,
  },
  logoutBtn: {
    width: '100%', padding: '18px',
    background: 'rgba(255, 59, 48, 0.08)',
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: '20px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '10px',
    cursor: 'pointer', transition: 'all 180ms ease',
  },
  modalOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, animation: 'fadeUp 0.2s ease-out',
  },
  modalCard: {
    width: '90%', maxWidth: '420px', maxHeight: '85dvh',
    ...GLASS_WHITE, background: 'rgba(255,255,255,0.85)',
    borderRadius: '28px', padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column',
  },
  modalTitle: {
    fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)', marginBottom: '8px',
  },
  modalDesc: {
    fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginBottom: '20px', lineHeight: 1.5,
  },
  modalInput: {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px',
    color: 'var(--color-text)', fontSize: '1rem', fontWeight: 500,
    fontFamily: FONT, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', outline: 'none',
  },
  modalSelect: {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px',
    color: 'var(--color-text)', fontSize: '1rem', fontWeight: 500,
    fontFamily: FONT, outline: 'none', appearance: 'none',
  },
  fieldLabel: {
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)',
    fontFamily: FONT, marginTop: '12px', marginBottom: '8px', display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.5px',
  },
  modalActions: {
    display: 'flex', gap: '12px', marginTop: '24px',
  },
  modalPrimaryBtn: {
    flex: 1, padding: '16px',
    background: 'var(--color-accent)', border: 'none', borderRadius: '16px',
    color: '#ffffff', fontWeight: 800, fontSize: '1rem',
    cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
  },
  modalSecondaryBtn: {
    flex: 1, padding: '16px',
    background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '16px',
    color: 'var(--color-text)', fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', fontFamily: FONT,
  },
  onboardingOverlay: {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(255,255,255,0.97)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    padding: '32px', gap: 0,
    animation: 'fadeUp 0.3s ease-out',
  },
  onboardingCard: {
    display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: 340,
  },
  onboardingIcon: {
    fontSize: '4rem', marginBottom: 16,
  },
  onboardingTitle: {
    fontFamily: FONT, fontSize: '1.5rem', fontWeight: 800,
    color: 'var(--color-text)', textAlign: 'center',
    letterSpacing: '-0.3px', marginBottom: 10,
  },
  onboardingDesc: {
    fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
    color: 'var(--color-text-muted)', textAlign: 'center',
    maxWidth: 260, lineHeight: 1.6, marginBottom: 32,
  },
  onboardingList: {
    width: '100%', maxWidth: 300,
    background: 'rgba(52,199,89,0.06)',
    border: '1px solid rgba(52,199,89,0.2)',
    borderRadius: 16, padding: '16px 20px',
    marginBottom: 28, display: 'flex',
    flexDirection: 'column', gap: 10,
  },
  onboardingRow: {
    display: 'flex', alignItems: 'center', gap: 12,
  },
  onboardingEmoji: {
    fontSize: '1.2rem',
  },
  onboardingText: {
    fontFamily: FONT, fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)',
  },
  onboardingPrimaryBtn: {
    width: '100%', maxWidth: 300, padding: 16,
    background: 'var(--color-accent)', border: 'none',
    borderRadius: 16, color: '#ffffff',
    fontFamily: FONT, fontWeight: 800, fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(52,199,89,0.35)',
    marginBottom: 12,
  },
  onboardingSecondaryBtn: {
    width: '100%', maxWidth: 300, padding: 12,
    background: 'transparent',
    border: '1px solid rgba(0,0,0,0.08)',
    borderRadius: 16, color: 'var(--color-text-muted)',
    fontFamily: FONT, fontWeight: 600, fontSize: '0.9rem',
    cursor: 'pointer',
  },
  groceryRangeOverlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'flex-end',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    animation: 'fadeUp 0.3s ease-out',
  },
  groceryRangeCard: {
    width: '100%', maxHeight: '90dvh', overflowY: 'auto',
    ...GLASS_WHITE, background: 'rgba(255,255,255,0.95)',
    borderRadius: '32px 32px 0 0', padding: '24px',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
  },
  groceryHandle: {
    width: 48, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px',
  },
  groceryRangeHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24,
  },
  groceryRangeTitle: {
    fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)',
  },
  groceryRangeSubtitle: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4,
  },
  groceryRangeCloseBtn: {
    background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  groceryRangeFields: {
    display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24,
  },
  groceryLabelSmall: {
    fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8,
  },
  groceryDateInput: {
    width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none', boxSizing: 'border-box',
  },
  groceryDaysPillWrap: {
    textAlign: 'center', marginBottom: 20,
  },
  groceryDaysPill: {
    display: 'inline-block', background: 'rgba(52,199,89,0.12)', color: 'var(--color-accent)', fontFamily: FONT, fontWeight: 700, fontSize: '0.85rem', borderRadius: 999, padding: '6px 16px',
  },
  groceryViewBtn: {
    width: '100%', padding: '16px',
    background: 'var(--color-accent)',
    border: 'none', borderRadius: 16,
    color: '#ffffff',
    fontFamily: FONT, fontWeight: 800, fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
    transition: 'all 180ms ease',
  },
  grocerySheetOverlay: {
    position: 'fixed', inset: 0, zIndex: 300,
    background: 'rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'flex-end',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    animation: 'fadeUp 0.3s ease-out',
  },
  grocerySheetCard: {
    width: '100%', maxHeight: '85dvh',
    ...GLASS_WHITE, background: 'rgba(255,255,255,0.92)',
    borderRadius: '32px 32px 0 0', padding: '24px',
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
  },
  grocerySheetHeader: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexShrink: 0,
  },
  grocerySheetTitle: {
    fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)',
  },
  grocerySheetSubtitle: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4,
  },
  grocerySheetCloseBtn: {
    background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
  },
  groceryLoadingWrap: {
    display: 'flex', justifyContent: 'center', padding: '60px 0', flex: 1,
  },
  groceryLoadingText: {
    fontFamily: FONT, color: 'var(--color-text-faint)', fontWeight: 600,
  },
  groceryErrorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 14,
    marginBottom: 16,
    flexShrink: 0,
  },
  groceryErrorIcon: {
    fontSize: '1.1rem', flexShrink: 0,
  },
  groceryErrorText: {
    fontFamily: FONT,
    fontSize: '0.85rem',
    fontWeight: 600,
    lineHeight: 1.5,
    margin: 0,
  },
  groceryEmptyText: {
    textAlign: 'center', padding: '60px 40px', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT,
  },
  groceryList: {
    overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4,
  },
  groceryItem: {
    display: 'flex', alignItems: 'center', gap: 14,
    padding: 16,
    borderRadius: 16, cursor: 'pointer',
    transition: 'all 180ms ease', textAlign: 'left',
  },
  groceryItemTextWrap: {
    flex: 1,
  },
  groceryItemText: {
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem', lineHeight: 1.3,
    textTransform: 'capitalize',
  },
  groceryItemQty: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600, fontFamily: FONT, flexShrink: 0,
  },
  groceryFooter: {
    display: 'flex', gap: 10, marginTop: 20, flexShrink: 0,
  },
  cheatHeader: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: '16px',
  },
  cheatHistoryTitle: {
    fontFamily: FONT, fontWeight: 800,
    color: 'var(--color-text)', fontSize: '1.4rem',
  },
  cheatLogBtn: {
    background: '#FF3B30', border: 'none',
    borderRadius: '12px', padding: '10px 16px',
    color: '#ffffff', fontSize: '0.85rem', fontWeight: 800,
    fontFamily: FONT, cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(255,59,48,0.3)',
  },
  cheatLoadingText: {
    fontFamily: FONT,
    color: 'var(--color-text-muted)',
  },
  cheatEmptyWrap: {
    textAlign: 'center', padding: '32px 0',
  },
  cheatEmptyEmoji: {
    fontSize: '2.5rem', marginBottom: '12px',
  },
  cheatList: {
    display: 'flex', flexDirection: 'column',
    gap: '12px', maxHeight: '380px', overflowY: 'auto',
    paddingRight: '4px',
  },
  cheatCard: {
    background: 'rgba(255,255,255,0.7)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '16px', padding: '16px',
  },
  cheatCardTop: {
    display: 'flex',
    justifyContent: 'space-between', alignItems: 'flex-start',
  },
  cheatCardLeft: {
    flex: 1,
  },
  cheatCardFood: {
    fontFamily: FONT, fontWeight: 800,
    color: 'var(--color-text)', fontSize: '1rem',
  },
  cheatCardMeta: {
    fontSize: '0.8rem', color: 'var(--color-text-faint)', fontWeight: 600,
    fontFamily: FONT, marginTop: '4px',
  },
  cheatCardCalories: {
    fontFamily: FONT,
    fontSize: '1.2rem', fontWeight: 800,
    color: '#FF3B30',
    textAlign: 'right', flexShrink: 0,
  },
  cheatCardConfidence: {
    fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600,
    fontFamily: FONT, marginTop: '2px',
  },
  cheatCardNotes: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT,
    marginTop: '10px', fontStyle: 'italic',
  },
}
