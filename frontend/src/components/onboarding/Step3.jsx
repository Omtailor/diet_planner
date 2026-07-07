import Field from './Field'
import OptionChip from './OptionChip'
import GoalCard from './GoalCard'
import { GOALS, DIET_OPTIONS } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function Step3({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Your goals & diet</h2>
      <p style={s.stepSubtitle}>We'll build your plan around this</p>
      <div style={s.fields}>
        <Field label="Fitness Goal">
          <div style={s.cardGrid}>
            {GOALS.map(g => (
              <GoalCard
                key={g.key}
                label={g.label}
                desc={g.desc}
                selected={data.goal === g.key}
                onSelect={() => update('goal', g.key)}
              />
            ))}
          </div>
        </Field>
        <Field label="Diet Preference">
          <div style={s.optionRow}>
            {DIET_OPTIONS.map(d => (
              <OptionChip
                key={d.key}
                label={d.label}
                selected={data.diet_preference === d.key}
                onSelect={() => update('diet_preference', d.key)}
              />
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

export default Step3
