import Field from './Field'
import s from '../../utils/onboarding/styles'

function Step2({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Your body stats</h2>
      <p style={s.stepSubtitle}>Used to calculate your daily calorie target</p>
      <div style={s.fields}>
        <Field label="Height (cm)">
          <input
            style={s.input}
            type="number"
            placeholder="e.g. 175"
            value={data.height_cm}
            onChange={e => update('height_cm', e.target.value)}
            min="100"
            max="250"
            className="glass-input"
          />
        </Field>
        <Field label="Current Weight (kg)">
          <input
            style={s.input}
            type="number"
            placeholder="e.g. 70"
            value={data.weight_kg}
            onChange={e => update('weight_kg', e.target.value)}
            min="30"
            max="300"
            className="glass-input"
          />
        </Field>
        <Field label="Target Weight (kg)">
          <input
            style={s.input}
            type="number"
            placeholder="e.g. 65"
            value={data.target_weight_kg}
            onChange={e => update('target_weight_kg', e.target.value)}
            min="30"
            max="300"
            className="glass-input"
          />
        </Field>
        <Field label="Daily Health Time (minutes)">
          <input
            style={s.input}
            type="number"
            placeholder="e.g. 60"
            value={data.health_time_minutes}
            onChange={e => update('health_time_minutes', e.target.value)}
            min="0"
            max="300"
            className="glass-input"
          />
        </Field>
      </div>
    </div>
  )
}

export default Step2
