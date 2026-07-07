import { Loader2, ChevronRight } from 'lucide-react';
import { FONT, GLASS_WHITE } from '../../utils/training/constants';

/**
 * Card that lets the user generate the next 3-day training block.
 * Shows a "ready" state when nextPlanExists is true.
 */
export default function GenerateNextPlanCard({
  nextPlanExists,
  latestPlanEndDate,
  generatingNextPlan,
  onGenerate,
}) {
  if (nextPlanExists) {
    return (
      <div style={{
        ...GLASS_WHITE,
        borderRadius: '20px', padding: '14px 16px',
        display: 'flex', alignItems: 'center', gap: '12px',
        border: '1px solid rgba(52,199,89,0.2)',
      }}>
        <span style={{ fontSize: '1.2rem' }}>✅</span>
        <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: FONT }}>
          Next training plan is ready
        </p>
      </div>
    );
  }

  const getDateRangeLabel = () => {
    const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    if (!latestPlanEndDate) {
      const start = new Date();
      const end = new Date();
      end.setDate(end.getDate() + 2);
      return `${fmt(start)} – ${fmt(end)} · 3 day plan`;
    }
    const start = new Date(latestPlanEndDate);
    start.setDate(start.getDate() + 1);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const displayStart = start < today ? today : start;
    const displayEnd = new Date(displayStart);
    displayEnd.setDate(displayStart.getDate() + 2);
    return `${fmt(displayStart)} – ${fmt(displayEnd)} · 3 day plan`;
  };

  return (
    <button
      onClick={onGenerate}
      disabled={generatingNextPlan}
      style={{
        width: '100%', ...GLASS_WHITE,
        borderRadius: '20px', padding: '16px',
        display: 'flex', alignItems: 'center', gap: '14px',
        cursor: generatingNextPlan ? 'not-allowed' : 'pointer',
        border: '1px solid rgba(52,199,89,0.25)',
        transition: 'all 180ms ease',
      }}
    >
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(52,199,89,0.15)', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0,
      }}>🗓️</div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: FONT }}>
          Generate Next 3 Days Plan
        </p>
        <p style={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: FONT, marginTop: '2px', color: 'var(--color-text-muted)' }}>
          {getDateRangeLabel()}
        </p>
      </div>
      {generatingNextPlan
        ? <Loader2 size={20} color="var(--color-accent)" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
        : <ChevronRight size={20} color="var(--color-accent)" style={{ flexShrink: 0 }} />
      }
    </button>
  );
}
