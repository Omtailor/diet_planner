import { Loader2, ChevronRight } from 'lucide-react';
import { FONT, GLASS_WHITE } from '../../utils/training/constants';

/**
 * Renders either:
 *  - A tappable banner to open the editor (when showEditor is false)
 *  - The inline time picker UI (when showEditor is true)
 *
 * Used when the user's health_time_minutes is 0 and they need to set it
 * before a training plan can be generated.
 */
export default function HealthTimeEditor({
  showEditor,
  onOpen,
  onClose,
  newHealthTime,
  setNewHealthTime,
  onSave,
  saving,
  // Optional style tweaks for banner vs. in-plan context
  bannerSize = 'large',
}) {
  if (!showEditor) {
    // Banner button
    const isLarge = bannerSize === 'large';
    return (
      <button
        onClick={onOpen}
        style={{
          width: '100%', ...GLASS_WHITE, borderRadius: 20,
          padding: isLarge ? '18px 18px' : '16px 18px',
          display: 'flex', alignItems: 'center', gap: 14,
          border: '1.5px solid rgba(255,149,0,0.35)',
          background: 'rgba(255,149,0,0.06)', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <div style={{
          width: isLarge ? 50 : 46,
          height: isLarge ? 50 : 46,
          borderRadius: 14, background: 'rgba(255,149,0,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: isLarge ? '1.5rem' : '1.4rem', flexShrink: 0,
        }}>⏱️</div>
        <div style={{ flex: 1 }}>
          {isLarge ? (
            <>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                Your daily health time is set to 0
              </p>
              <p style={{ fontFamily: FONT, fontSize: '0.82rem', color: 'rgba(255,149,0,0.95)', fontWeight: 600, marginTop: 4 }}>
                Tap here to set it and unlock your training plan ✨
              </p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                You set health time to 0 minutes
              </p>
              <p style={{ fontFamily: FONT, fontSize: '0.8rem', color: 'rgba(255,149,0,0.9)', fontWeight: 600, marginTop: 3 }}>
                Tap here to update it and unlock training plans ✨
              </p>
            </>
          )}
        </div>
        <ChevronRight size={20} color="rgba(255,149,0,0.8)" style={{ flexShrink: 0 }} />
      </button>
    );
  }

  // Inline editor
  return (
    <div style={{
      ...GLASS_WHITE, borderRadius: 20, padding: '20px 18px',
      border: '1.5px solid rgba(255,149,0,0.3)', background: 'rgba(255,149,0,0.05)',
      display: 'flex', flexDirection: 'column', gap: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: '1.3rem' }}>⏱️</span>
        <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
          How many minutes can you spare daily?
        </p>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        {[20, 30, 45, 60].map(t => (
          <button
            key={t}
            onClick={() => setNewHealthTime(String(t))}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 12,
              border: `1.5px solid ${newHealthTime === String(t) ? 'var(--color-accent)' : 'rgba(0,0,0,0.08)'}`,
              background: newHealthTime === String(t) ? 'rgba(52,199,89,0.12)' : 'rgba(255,255,255,0.7)',
              fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
              color: newHealthTime === String(t) ? 'var(--color-accent)' : 'var(--color-text-muted)',
              cursor: 'pointer',
            }}
          >
            {t}m
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="number"
          placeholder="Or type custom (1–300)"
          value={newHealthTime}
          onChange={e => setNewHealthTime(e.target.value)}
          min={1} max={300}
          style={{
            flex: 1, padding: '12px 14px', borderRadius: 12,
            border: '1px solid rgba(0,0,0,0.1)', fontFamily: FONT, fontSize: '1rem',
            background: 'rgba(255,255,255,0.8)', outline: 'none', color: 'var(--color-text)',
          }}
        />
        <button
          onClick={onSave}
          disabled={saving || !newHealthTime}
          style={{
            padding: '12px 20px', borderRadius: 12,
            background: !newHealthTime ? 'rgba(0,0,0,0.08)' : 'var(--color-accent)',
            border: 'none',
            color: !newHealthTime ? 'var(--color-text-muted)' : '#fff',
            fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
            cursor: !newHealthTime ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
          }}
        >
          {saving ? <Loader2 size={16} className="spin" /> : 'Save ✓'}
        </button>
      </div>

      <button
        onClick={onClose}
        style={{
          background: 'none', border: 'none', fontFamily: FONT, fontSize: '0.8rem',
          color: 'var(--color-text-faint)', cursor: 'pointer', textAlign: 'center',
        }}
      >
        Cancel
      </button>
    </div>
  );
}
