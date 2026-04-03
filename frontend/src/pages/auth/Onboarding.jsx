import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'

const TOTAL_STEPS = 6

// ─── Step Components ───────────────────────────────────────────

function Step1({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Let's get to know you</h2>
      <p style={s.stepSubtitle}>Basic info to personalize your plan</p>
      <div style={s.fields}>
        <Field label="Full Name">
          <input style={s.input} placeholder="Your name" value={data.name}
            onChange={e => update('name', e.target.value)} />
        </Field>
        <Field label="Age">
          <input style={s.input} type="number" placeholder="Years" value={data.age}
            onChange={e => update('age', e.target.value)} min="10" max="100" />
        </Field>
        <Field label="City">
          <input style={s.input} placeholder="Your city" value={data.city}
            onChange={e => update('city', e.target.value)} />
        </Field>
        <Field label="Gender">
          <div style={s.optionRow}>
            {['male', 'female', 'other'].map(g => (
              <OptionChip key={g} label={g.charAt(0).toUpperCase() + g.slice(1)}
                selected={data.gender === g} onSelect={() => update('gender', g)} />
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

function Step2({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Your body stats</h2>
      <p style={s.stepSubtitle}>Used to calculate your daily calorie target</p>
      <div style={s.fields}>
        <Field label="Height (cm)">
          <input style={s.input} type="number" placeholder="e.g. 175" value={data.height_cm}
            onChange={e => update('height_cm', e.target.value)} min="100" max="250" />
        </Field>
        <Field label="Current Weight (kg)">
          <input style={s.input} type="number" placeholder="e.g. 70" value={data.weight_kg}
            onChange={e => update('weight_kg', e.target.value)} min="30" max="300" />
        </Field>
        <Field label="Target Weight (kg)">
          <input style={s.input} type="number" placeholder="e.g. 65" value={data.target_weight_kg}
            onChange={e => update('target_weight_kg', e.target.value)} min="30" max="300" />
        </Field>
        <Field label="Daily Health Time (minutes)">
          <input style={s.input} type="number" placeholder="e.g. 60" value={data.health_time_minutes}
            onChange={e => update('health_time_minutes', e.target.value)} min="0" max="300" />
        </Field>
      </div>
    </div>
  )
}

function Step3({ data, update }) {
  const goals = [
    { key: 'muscle_building', label: '💪 Muscle Building', desc: 'Gain lean muscle mass' },
    { key: 'fat_loss',        label: '🔥 Fat Loss',        desc: 'Burn fat, stay energized' },
    { key: 'weight_loss',     label: '⚖️ Weight Loss',     desc: 'Reduce overall weight' },
    { key: 'maintenance',     label: '🎯 Maintenance',     desc: 'Maintain current body' },
  ]
  const diets = [
    { key: 'jain',    label: '🌿 Jain',    desc: 'No root vegetables' },
    { key: 'veg',     label: '🥦 Veg',     desc: 'Vegetarian' },
    { key: 'non_veg', label: '🍗 Non-Veg', desc: 'All foods included' },
  ]
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Your goals & diet</h2>
      <p style={s.stepSubtitle}>We'll build your plan around this</p>
      <div style={s.fields}>
        <Field label="Fitness Goal">
          <div style={s.cardGrid}>
            {goals.map(g => (
              <GoalCard key={g.key} label={g.label} desc={g.desc}
                selected={data.goal === g.key} onSelect={() => update('goal', g.key)} />
            ))}
          </div>
        </Field>
        <Field label="Diet Preference">
          <div style={s.optionRow}>
            {diets.map(d => (
              <OptionChip key={d.key} label={d.label}
                selected={data.diet_preference === d.key}
                onSelect={() => update('diet_preference', d.key)} />
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

function Step4({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Beverage habits</h2>
      <p style={s.stepSubtitle}>We include these in your calorie budget</p>
      <div style={s.fields}>
        <Field label="Do you drink tea or coffee?">
          <div style={s.optionRow}>
            {['none','tea','coffee','both'].map(b => (
              <OptionChip key={b} label={b.charAt(0).toUpperCase() + b.slice(1)}
                selected={data.beverage_habit === b}
                onSelect={() => {
                  update('beverage_habit', b)
                  update('tea_type', '')
                  update('coffee_type', '')
                  update('morning_beverage', '')
                  update('evening_beverage', '')
                }} />
            ))}
          </div>
        </Field>

        {(data.beverage_habit === 'tea') && (
          <Field label="Tea Type">
            <div style={s.optionRow}>
              {[
                { key: 'milk',  label: 'Milk Tea'   },
                { key: 'black', label: 'Black Tea'  },
                { key: 'green', label: 'Green Tea'  },
              ].map(t => (
                <OptionChip key={t.key} label={t.label}
                  selected={data.tea_type === t.key}
                  onSelect={() => update('tea_type', t.key)} />
              ))}
            </div>
          </Field>
        )}

        {(data.beverage_habit === 'coffee') && (
          <Field label="Coffee Type">
            <div style={s.optionRow}>
              {[
                { key: 'milk',  label: 'Milk Coffee'  },
                { key: 'black', label: 'Black Coffee' },
              ].map(c => (
                <OptionChip key={c.key} label={c.label}
                  selected={data.coffee_type === c.key}
                  onSelect={() => update('coffee_type', c.key)} />
              ))}
            </div>
          </Field>
        )}

        {(data.beverage_habit === 'both') && (
          <>
            <Field label="Morning Beverage">
              <div style={s.optionRow}>
                {['tea','coffee'].map(b => (
                  <OptionChip key={b} label={b.charAt(0).toUpperCase()+b.slice(1)}
                    selected={data.morning_beverage === b}
                    onSelect={() => update('morning_beverage', b)} />
                ))}
              </div>
            </Field>
            <Field label="Evening Beverage">
              <div style={s.optionRow}>
                {['tea','coffee'].map(b => (
                  <OptionChip key={b} label={b.charAt(0).toUpperCase()+b.slice(1)}
                    selected={data.evening_beverage === b}
                    onSelect={() => update('evening_beverage', b)} />
                ))}
              </div>
            </Field>
          </>
        )}
      </div>
    </div>
  )
}

function Step5({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Fasting & Gym</h2>
      <p style={s.stepSubtitle}>Helps us plan rest and fasting meals</p>
      <div style={s.fields}>
        <Field label="Do you fast?">
          <div style={s.optionRow}>
            {['yes','no'].map(v => (
              <OptionChip key={v} label={v === 'yes' ? 'Yes 🙏' : 'No'}
                selected={data.is_fasting === (v === 'yes')}
                onSelect={() => update('is_fasting', v === 'yes')} />
            ))}
          </div>
        </Field>

        {data.is_fasting && (
          <>
            <Field label="Fasting Days (e.g. monday, thursday)">
              <input style={s.input} placeholder="monday, thursday"
                value={data.fasting_days}
                onChange={e => update('fasting_days', e.target.value)} />
            </Field>
            <Field label="Fasting Type (e.g. Ekadashi, Navratri)">
              <input style={s.input} placeholder="Type of fast"
                value={data.fasting_type}
                onChange={e => update('fasting_type', e.target.value)} />
            </Field>
          </>
        )}

        <Field label="Do you go to the gym?">
          <div style={s.optionRow}>
            {['yes','no'].map(v => (
              <OptionChip key={v} label={v === 'yes' ? 'Yes 🏋️' : 'No 🏠'}
                selected={data.has_gym === (v === 'yes')}
                onSelect={() => update('has_gym', v === 'yes')} />
            ))}
          </div>
        </Field>
      </div>
    </div>
  )
}

function Step6({ data }) {
  const summaryItems = [
    { label: 'Name',       value: data.name },
    { label: 'Age',        value: `${data.age} years` },
    { label: 'Goal',       value: data.goal?.replace('_',' ') },
    { label: 'Diet',       value: data.diet_preference },
    { label: 'Height',     value: `${data.height_cm} cm` },
    { label: 'Weight',     value: `${data.weight_kg} kg` },
    { label: 'Target',     value: `${data.target_weight_kg} kg` },
    { label: 'Gym',        value: data.has_gym ? 'Yes' : 'No' },
    { label: 'Fasting',    value: data.is_fasting ? 'Yes' : 'No' },
    { label: 'Beverages',  value: data.beverage_habit },
  ]
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>All set! 🎉</h2>
      <p style={s.stepSubtitle}>Review your profile before we generate your plan</p>
      <div style={s.summaryCard}>
        {summaryItems.map(item => (
          <div key={item.label} style={s.summaryRow}>
            <span style={s.summaryLabel}>{item.label}</span>
            <span style={s.summaryValue}>{item.value || '—'}</span>
          </div>
        ))}
      </div>
      <div style={s.aiNote}>
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Our AI will generate your personalized 7-day Indian meal plan and training schedule instantly!
        </p>
      </div>
    </div>
  )
}

// ─── Reusable Sub-components ───────────────────────────────────

function Field({ label, children }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

function OptionChip({ label, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect} style={{
      ...s.chip,
      background: selected ? 'var(--accent)' : 'var(--bg-surface-2)',
      color: selected ? '#0A0A0A' : 'var(--text-secondary)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
      fontWeight: selected ? 700 : 400,
      transform: selected ? 'scale(1.03)' : 'scale(1)',
    }}>
      {label}
    </button>
  )
}

function GoalCard({ label, desc, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect} style={{
      ...s.goalCard,
      background: selected ? 'rgba(200,241,53,0.1)' : 'var(--bg-surface-2)',
      border: `1px solid ${selected ? 'var(--accent)' : 'var(--border)'}`,
    }}>
      <span style={{ fontSize: '0.9375rem', fontWeight: 600,
        color: selected ? 'var(--accent)' : 'var(--text-primary)' }}>
        {label}
      </span>
      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
        {desc}
      </span>
      {selected && (
        <div style={s.goalCheck}>
          <Check size={10} strokeWidth={3} color="#0A0A0A" />
        </div>
      )}
    </button>
  )
}

// ─── Main Onboarding Component ─────────────────────────────────

function Onboarding() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuth()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState({
    name: '', age: '', city: '', gender: '',
    height_cm: '', weight_kg: '', target_weight_kg: '', health_time_minutes: '',
    goal: '', diet_preference: '',
    beverage_habit: 'none', tea_type: '', coffee_type: '',
    morning_beverage: '', evening_beverage: '',
    is_fasting: false, fasting_days: '', fasting_type: '',
    has_gym: false,
  })

  const update = (key, value) => setData(prev => ({ ...prev, [key]: value }))

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.name.trim() && data.age && data.city.trim() && data.gender
      case 2:
        return data.height_cm && data.weight_kg && data.target_weight_kg && data.health_time_minutes
      case 3:
        return data.goal && data.diet_preference
      case 4:
        if (data.beverage_habit === 'tea')    return !!data.tea_type
        if (data.beverage_habit === 'coffee') return !!data.coffee_type
        if (data.beverage_habit === 'both')   return !!(data.morning_beverage && data.evening_beverage)
        return true
      case 5:
        if (data.is_fasting) return !!(data.fasting_days.trim() && data.fasting_type.trim())
        return data.has_gym !== undefined
      case 6:
        return true
      default:
        return false
    }
  }

  const stepValid = isStepValid()

  const validateStep = () => {
    switch (step) {
      case 1:
        if (!data.name || !data.age || !data.city || !data.gender) {
          toast.error('Please fill in all fields'); return false
        }
        break
      case 2:
        if (!data.height_cm || !data.weight_kg || !data.target_weight_kg || !data.health_time_minutes) {
          toast.error('Please fill in all fields'); return false
        }
        break
      case 3:
        if (!data.goal || !data.diet_preference) {
          toast.error('Please select your goal and diet'); return false
        }
        break
      case 4:
        if (data.beverage_habit === 'tea' && !data.tea_type) {
          toast.error('Please select tea type'); return false
        }
        if (data.beverage_habit === 'coffee' && !data.coffee_type) {
          toast.error('Please select coffee type'); return false
        }
        if (data.beverage_habit === 'both' && (!data.morning_beverage || !data.evening_beverage)) {
          toast.error('Please select morning & evening beverages'); return false
        }
        break
      default: break
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setStep(prev => Math.min(prev + 1, TOTAL_STEPS))
  }

  const handleBack = () => setStep(prev => Math.max(prev - 1, 1))

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const payload = {
        ...data,
        age: parseInt(data.age),
        height_cm: parseFloat(data.height_cm),
        weight_kg: parseFloat(data.weight_kg),
        target_weight_kg: parseFloat(data.target_weight_kg),
        health_time_minutes: parseInt(data.health_time_minutes),
      }
      await authService.onboarding(payload)
      await fetchProfile()
      toast.success('Profile saved! Generating your plan... 🚀')
      navigate('/')
    } catch (err) {
      const errData = err.response?.data
      const firstError = errData
        ? Object.values(errData)[0]?.[0] || 'Submission failed'
        : 'Submission failed'
      toast.error(firstError)
    } finally {
      setLoading(false)
    }
  }

  const steps = [Step1, Step2, Step3, Step4, Step5, Step6]
  const CurrentStep = steps[step - 1]
  const progress = (step / TOTAL_STEPS) * 100

  return (
    <div style={s.wrapper}>
      {/* Header */}
      <div style={s.header}>
        {step > 1 ? (
          <button onClick={handleBack} style={s.backBtn}>
            <ChevronLeft size={22} color="var(--text-primary)" />
          </button>
        ) : <div style={{ width: '40px' }} />}

        <span style={s.stepCounter}>Step {step} of {TOTAL_STEPS}</span>
        <div style={{ width: '40px' }} />
      </div>

      {/* Progress bar */}
      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progress}%` }} />
      </div>

      {/* Step content */}
      <div style={s.content}>
        <CurrentStep data={data} update={update} />
      </div>

      {/* Bottom button */}
      <div style={s.footer}>
        <button
          onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
          disabled={loading || !stepValid}
          style={{
            ...s.nextBtn,
            opacity: (!stepValid || loading) ? 0.4 : 1,
            cursor: (!stepValid || loading) ? 'not-allowed' : 'pointer',
            transform: 'none',
          }}
        >
          {loading ? (
            <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : step === TOTAL_STEPS ? (
            'Generate My Plan 🚀'
          ) : (
            'Continue →'
          )}
        </button>
        {!stepValid && (
          <p style={{
            textAlign: 'center',
            fontSize: '0.75rem',
            color: 'var(--text-faint)',
            fontFamily: 'Satoshi, sans-serif',
            marginTop: '8px',
          }}>
            Complete all fields to continue
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus {
          outline: none;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(200,241,53,0.15) !important;
        }
        input::placeholder { color: var(--text-faint); }
      `}</style>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────

const s = {
  wrapper: {
    minHeight: '100dvh',
    background: 'var(--bg-primary)',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: '480px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 8px',
  },
  backBtn: {
    width: '40px', height: '40px',
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
  },
  stepCounter: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif',
    letterSpacing: '0.3px',
  },
  progressTrack: {
    height: '3px',
    background: 'var(--bg-surface-3)',
    margin: '8px 20px 0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--accent)',
    borderRadius: '4px',
    transition: 'width 400ms cubic-bezier(0.16,1,0.3,1)',
  },
  content: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
  },
  stepContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stepTitle: {
    fontFamily: 'Clash Display, sans-serif',
    fontSize: '1.625rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    letterSpacing: '-0.4px',
    lineHeight: 1.2,
  },
  stepSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--text-secondary)',
    marginTop: '-16px',
    fontFamily: 'Satoshi, sans-serif',
  },
  fields: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 500,
    color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif',
    letterSpacing: '0.2px',
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontFamily: 'Satoshi, sans-serif',
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    padding: '8px 16px',
    borderRadius: '999px',
    fontSize: '0.875rem',
    fontFamily: 'Satoshi, sans-serif',
    cursor: 'pointer',
    transition: 'all 180ms ease',
    whiteSpace: 'nowrap',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  goalCard: {
    padding: '14px',
    borderRadius: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 180ms ease',
    textAlign: 'left',
  },
  goalCheck: {
    position: 'absolute',
    top: '10px', right: '10px',
    width: '18px', height: '18px',
    background: 'var(--accent)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '16px',
    overflow: 'hidden',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '1px solid var(--border)',
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif',
  },
  summaryValue: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    fontFamily: 'Satoshi, sans-serif',
    textTransform: 'capitalize',
  },
  aiNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'rgba(200,241,53,0.06)',
    border: '1px solid rgba(200,241,53,0.2)',
    borderRadius: '14px',
    padding: '14px',
  },
  footer: {
    padding: '16px 20px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
    background: 'var(--bg-primary)',
    borderTop: '1px solid var(--border)',
  },
  nextBtn: {
    width: '100%',
    padding: '15px',
    background: 'var(--accent)',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '14px',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'Satoshi, sans-serif',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 180ms ease, transform 180ms ease',
  },
}

export default Onboarding