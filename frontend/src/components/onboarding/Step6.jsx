import s from '../../utils/onboarding/styles'

function Step6({ data }) {
  const summaryItems = [
    { label: 'Name',      value: data.name },
    { label: 'Age',       value: `${data.age} years` },
    { label: 'Goal',      value: data.goal?.replace('_', ' ') },
    { label: 'Diet',      value: data.diet_preference },
    { label: 'Height',    value: `${data.height_cm} cm` },
    { label: 'Weight',    value: `${data.weight_kg} kg` },
    { label: 'Target',    value: `${data.target_weight_kg} kg` },
    { label: 'Gym',       value: data.has_gym ? 'Yes' : 'No' },
    { label: 'Fasting',   value: data.is_fasting ? 'Yes' : 'No' },
    { label: 'Beverages', value: data.beverage_habit },
  ]

  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>All set! 🎉</h2>
      <p style={s.stepSubtitle}>Review your profile before we generate your plan</p>
      <div style={s.summaryCard}>
        {summaryItems.map((item, i) => (
          <div
            key={item.label}
            style={{
              ...s.summaryRow,
              borderBottom: i < summaryItems.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none',
            }}
          >
            <span style={s.summaryLabel}>{item.label}</span>
            <span style={s.summaryValue}>{item.value || '—'}</span>
          </div>
        ))}
      </div>
      <div style={s.aiNote}>
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
          Your profile is ready! Head to the dashboard to generate your personalized meal and training plan whenever you're ready.
        </p>
      </div>
    </div>
  )
}

export default Step6
