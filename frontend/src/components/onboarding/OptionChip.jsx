import s from '../../utils/onboarding/styles'

function OptionChip({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        ...s.chip,
        background: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
        color: selected ? '#ffffff' : 'var(--color-text-muted)',
        border: `1px solid ${selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.55)'}`,
        fontWeight: selected ? 700 : 400,
        transform: selected ? 'scale(1.04)' : 'scale(1)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
      }}
    >
      {label}
    </button>
  )
}

export default OptionChip
