import Field from './Field'
import OptionChip from './OptionChip'
import { GENDER_OPTIONS } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function Step1({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Let's get to know you</h2>
      <p style={s.stepSubtitle}>Basic info to personalize your plan</p>
      <div style={s.fields}>
        <Field label="Full Name">
          <input
            style={s.input}
            placeholder="Your name"
            value={data.name}
            onChange={e => update('name', e.target.value)}
            className="glass-input"
          />
        </Field>
        <Field label="Age">
          <input
            style={s.input}
            type="number"
            placeholder="Years"
            value={data.age}
            onChange={e => update('age', e.target.value)}
            min="10"
            max="100"
            className="glass-input"
          />
        </Field>
        <Field label="City">
          <input
            style={s.input}
            placeholder="Your city"
            value={data.city}
            onChange={e => update('city', e.target.value)}
            className="glass-input"
          />
        </Field>
        <Field label="Gender">
          <div style={s.optionRow}>
            {GENDER_OPTIONS.map(g => (
              <OptionChip
                key={g}
                label={g.charAt(0).toUpperCase() + g.slice(1)}
                selected={data.gender === g}
                onSelect={() => update('gender', g)}
              />
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

export default Step1
