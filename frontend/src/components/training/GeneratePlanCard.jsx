import { Loader2 } from 'lucide-react';
import { S, FONT } from '../../utils/training/constants';

/**
 * Card shown on the "no plan" screen that lets the user generate
 * their first training plan.
 */
export default function GeneratePlanCard({ onGenerate, generating, regenPulse }) {
  return (
    <div style={S.glassCard}>
      <span style={{ fontSize: '3.5rem' }}>🏋️</span>
      <p style={S.noPlanTitle}>No Training Plan Yet</p>
      <p style={S.noPlanSub}>
        Generate your personalized weekly workout plan based on your profile and goals.
      </p>
      <button
        onClick={onGenerate}
        disabled={generating}
        style={{ ...S.generateBtn, opacity: generating ? 0.8 : 1 }}
        className={regenPulse ? 'regen-pulse' : ''}
      >
        {generating ? (
          <><Loader2 size={16} className="spin" style={{ marginRight: 6 }} />Generating...</>
        ) : (
          'Generate Training Plan'
        )}
      </button>
    </div>
  );
}
