import Field from './Field'
import OptionChip from './OptionChip'
import { ALL_DAYS } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function Step5({ data, update }) {
  // data.fasting_days is stored as comma-separated string e.g. "monday,thursday"
  const selectedDays = data.fasting_days
    ? data.fasting_days.split(',').map(d => d.trim().toLowerCase()).filter(Boolean)
    : []

  const toggleDay = (day) => {
    const lower = day.toLowerCase()
    const updated = selectedDays.includes(lower)
      ? selectedDays.filter(d => d !== lower)
      : [...selectedDays, lower]
    update('fasting_days', updated.join(','))
  }

  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Fasting & Gym</h2>
      <p style={s.stepSubtitle}>Helps us plan rest and fasting meals</p>
      <div style={s.fields}>
        <Field label="Do you fast?">
          <div style={s.optionRow}>
            {['yes', 'no'].map(v => (
              <OptionChip
                key={v}
                label={v === 'yes' ? 'Yes 🙏' : 'No'}
                selected={data.is_fasting === (v === 'yes')}
                onSelect={() => update('is_fasting', v === 'yes')}
              />
            ))}
          </div>
        </Field>

        {data.is_fasting && (
          <>
            <Field label="Fasting Days">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {ALL_DAYS.map(day => {
                  const isSelected = selectedDays.includes(day.toLowerCase())
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => toggleDay(day)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '999px',
                        fontSize: '0.875rem',
                        fontFamily: 'var(--font-body)',
                        fontWeight: isSelected ? 700 : 400,
                        cursor: 'pointer',
                        transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
                        background: isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
                        color: isSelected ? '#ffffff' : 'var(--color-text-muted)',
                        border: `1px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.55)'}`,
                        transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                      }}
                    >
                      {isSelected && <span style={{ marginRight: 4 }}>✓</span>}
                      {day}
                    </button>
                  )
                })}
              </div>
              {selectedDays.length > 0 && (
                <p style={{
                  fontSize: '0.75rem',
                  color: 'var(--color-accent)',
                  fontFamily: 'var(--font-body)',
                  fontWeight: 600,
                  marginTop: 8,
                }}>
                  {selectedDays.length} day{selectedDays.length > 1 ? 's' : ''} selected
                </p>
              )}
            </Field>
            <Field label="Fasting Type (e.g. Ekadashi, Navratri)">
              <input
                style={s.input}
                placeholder="Type of fast"
                value={data.fasting_type}
                onChange={e => update('fasting_type', e.target.value)}
                className="glass-input"
              />
            </Field>
          </>
        )}

        <Field label="Do you go to the gym?">
          <div style={s.optionRow}>
            {['yes', 'no'].map(v => (
              <OptionChip
                key={v}
                label={v === 'yes' ? 'Yes 🏋️' : 'No 🏠'}
                selected={data.has_gym === (v === 'yes')}
                onSelect={() => update('has_gym', v === 'yes')}
              />
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

export default Step5
