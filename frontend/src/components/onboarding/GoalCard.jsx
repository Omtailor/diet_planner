import { Check } from 'lucide-react'
import s from '../../utils/onboarding/styles'

function GoalCard({ label, desc, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        ...s.goalCard,
        background: selected
          ? 'rgba(58,158,95,0.18)'
          : 'rgba(255,255,255,0.35)',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.55)'}`,
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      <span style={{
        fontSize: '0.9375rem', fontWeight: 600,
        color: selected ? 'var(--color-accent)' : 'var(--color-text)',
      }}>
        {label}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
        {desc}
      </span>
      {selected && (
        <div style={s.goalCheck}>
          <Check size={10} strokeWidth={3} color="#fff" />
        </div>
      )}
    </button>
  )
}

export default GoalCard
