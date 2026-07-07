import Field from './Field'
import OptionChip from './OptionChip'
import { BEVERAGE_OPTIONS, TEA_TYPES, COFFEE_TYPES } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function Step4({ data, update }) {
  const handleBeverageChange = (b) => {
    update('beverage_habit', b)
    update('tea_type', '')
    update('coffee_type', '')
    update('morning_beverage', '')
    update('evening_beverage', '')
  }

  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Beverage habits</h2>
      <p style={s.stepSubtitle}>We include these in your calorie budget</p>
      <div style={s.fields}>
        <Field label="Do you drink tea or coffee?">
          <div style={s.optionRow}>
            {BEVERAGE_OPTIONS.map(b => (
              <OptionChip
                key={b}
                label={b.charAt(0).toUpperCase() + b.slice(1)}
                selected={data.beverage_habit === b}
                onSelect={() => handleBeverageChange(b)}
              />
            ))}
          </div>
        </Field>

        {data.beverage_habit === 'tea' && (
          <Field label="Tea Type">
            <div style={s.optionRow}>
              {TEA_TYPES.map(t => (
                <OptionChip
                  key={t.key}
                  label={t.label}
                  selected={data.tea_type === t.key}
                  onSelect={() => update('tea_type', t.key)}
                />
              ))}
            </div>
          </Field>
        )}

        {data.beverage_habit === 'coffee' && (
          <Field label="Coffee Type">
            <div style={s.optionRow}>
              {COFFEE_TYPES.map(c => (
                <OptionChip
                  key={c.key}
                  label={c.label}
                  selected={data.coffee_type === c.key}
                  onSelect={() => update('coffee_type', c.key)}
                />
              ))}
            </div>
          </Field>
        )}

        {data.beverage_habit === 'both' && (
          <>
            <Field label="Morning Beverage">
              <div style={s.optionRow}>
                {['tea', 'coffee'].map(b => (
                  <OptionChip
                    key={b}
                    label={b.charAt(0).toUpperCase() + b.slice(1)}
                    selected={data.morning_beverage === b}
                    onSelect={() => update('morning_beverage', b)}
                  />
                ))}
              </div>
            </Field>
            <Field label="Evening Beverage">
              <div style={s.optionRow}>
                {['tea', 'coffee'].map(b => (
                  <OptionChip
                    key={b}
                    label={b.charAt(0).toUpperCase() + b.slice(1)}
                    selected={data.evening_beverage === b}
                    onSelect={() => update('evening_beverage', b)}
                  />
                ))}
              </div>
            </Field>
          </>
        )}
      </div>
    </div>
  )
}

export default Step4
