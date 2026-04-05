import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'

import bg6 from '../../assets/images/bg-6.webp'
import bg7 from '../../assets/images/bg-7.webp'
import bg8 from '../../assets/images/bg-8.webp'
import bg9 from '../../assets/images/bg-9.webp'
import bg10 from '../../assets/images/bg-10.webp'
import bg11 from '../../assets/images/bg-11.webp'

const STEP_IMAGES = [bg6, bg7, bg8, bg9, bg10, bg11]
const TOTAL_STEPS = 6

const LOADING_SENTENCES = [
  "Initializing your Neural Health Profile...",
  "Mapping your unique metabolic fingerprint...",
  "Sculpting your 7-day nutrient architecture...",
  "Harmonizing Indian flavors with macro-precision...",
  "Optimizing fiber ratios for digestive efficiency...",
  "Calibrating your glycemic response window...",
  "Engineering a hypertrophy-focused training split...",
  "Syncing hydration cycles with your daily rhythm...",
  "Balancing micronutrients: Zinc, Iron, and Vitamin D...",
  "Simulating your 16:8 fasting metabolic curve...",
  "Drafting your bespoke, zero-waste grocery map...",
  "Finalizing your recovery and rest-day protocols...",
  "Stress-testing your plan for 100% adherence...",
  "Encoding your culinary preferences into the engine...",
  "Synthesizing your activity levels with caloric load...",
  "Cross-referencing allergies and dietary restrictions...",
  "Allocating micronutrient density for cellular repair...",
  "Constructing your high-performance training schedule...",
  "Plan finalized. Preparing your digital reveal...",
  "Welcome to the new you. Launching now... 🚀"
];

// ─── Step Components ───────────────────────────────────────────

function Step1({ data, update }) {
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>Let's get to know you</h2>
      <p style={s.stepSubtitle}>Basic info to personalize your plan</p>
      <div style={s.fields}>
        <Field label="Full Name">
          <input style={s.input} placeholder="Your name" value={data.name}
            onChange={e => update('name', e.target.value)}
            className="glass-input" />
        </Field>
        <Field label="Age">
          <input style={s.input} type="number" placeholder="Years" value={data.age}
            onChange={e => update('age', e.target.value)} min="10" max="100"
            className="glass-input" />
        </Field>
        <Field label="City">
          <input style={s.input} placeholder="Your city" value={data.city}
            onChange={e => update('city', e.target.value)}
            className="glass-input" />
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
            onChange={e => update('height_cm', e.target.value)} min="100" max="250"
            className="glass-input" />
        </Field>
        <Field label="Current Weight (kg)">
          <input style={s.input} type="number" placeholder="e.g. 70" value={data.weight_kg}
            onChange={e => update('weight_kg', e.target.value)} min="30" max="300"
            className="glass-input" />
        </Field>
        <Field label="Target Weight (kg)">
          <input style={s.input} type="number" placeholder="e.g. 65" value={data.target_weight_kg}
            onChange={e => update('target_weight_kg', e.target.value)} min="30" max="300"
            className="glass-input" />
        </Field>
        <Field label="Daily Health Time (minutes)">
          <input style={s.input} type="number" placeholder="e.g. 60" value={data.health_time_minutes}
            onChange={e => update('health_time_minutes', e.target.value)} min="0" max="300"
            className="glass-input" />
        </Field>
      </div>
    </div>
  )
}

function Step3({ data, update }) {
  const goals = [
    { key: 'muscle_building', label: '💪 Muscle Building', desc: 'Gain lean muscle mass' },
    { key: 'fat_loss', label: '🔥 Fat Loss', desc: 'Burn fat, stay energized' },
    { key: 'weight_loss', label: '⚖️ Weight Loss', desc: 'Reduce overall weight' },
    { key: 'maintenance', label: '🎯 Maintenance', desc: 'Maintain current body' },
  ]
  const diets = [
    { key: 'jain', label: '🌿 Jain' },
    { key: 'veg', label: '🥦 Veg' },
    { key: 'non_veg', label: '🍗 Non-Veg' },
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
            {['none', 'tea', 'coffee', 'both'].map(b => (
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
        {data.beverage_habit === 'tea' && (
          <Field label="Tea Type">
            <div style={s.optionRow}>
              {[{ key: 'milk', label: 'Milk Tea' }, { key: 'black', label: 'Black Tea' }, { key: 'green', label: 'Green Tea' }].map(t => (
                <OptionChip key={t.key} label={t.label}
                  selected={data.tea_type === t.key}
                  onSelect={() => update('tea_type', t.key)} />
              ))}
            </div>
          </Field>
        )}
        {data.beverage_habit === 'coffee' && (
          <Field label="Coffee Type">
            <div style={s.optionRow}>
              {[{ key: 'milk', label: 'Milk Coffee' }, { key: 'black', label: 'Black Coffee' }].map(c => (
                <OptionChip key={c.key} label={c.label}
                  selected={data.coffee_type === c.key}
                  onSelect={() => update('coffee_type', c.key)} />
              ))}
            </div>
          </Field>
        )}
        {data.beverage_habit === 'both' && (
          <>
            <Field label="Morning Beverage">
              <div style={s.optionRow}>
                {['tea', 'coffee'].map(b => (
                  <OptionChip key={b} label={b.charAt(0).toUpperCase() + b.slice(1)}
                    selected={data.morning_beverage === b}
                    onSelect={() => update('morning_beverage', b)} />
                ))}
              </div>
            </Field>
            <Field label="Evening Beverage">
              <div style={s.optionRow}>
                {['tea', 'coffee'].map(b => (
                  <OptionChip key={b} label={b.charAt(0).toUpperCase() + b.slice(1)}
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
            {['yes', 'no'].map(v => (
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
                onChange={e => update('fasting_days', e.target.value)}
                className="glass-input" />
            </Field>
            <Field label="Fasting Type (e.g. Ekadashi, Navratri)">
              <input style={s.input} placeholder="Type of fast"
                value={data.fasting_type}
                onChange={e => update('fasting_type', e.target.value)}
                className="glass-input" />
            </Field>
          </>
        )}
        <Field label="Do you go to the gym?">
          <div style={s.optionRow}>
            {['yes', 'no'].map(v => (
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
    { label: 'Name', value: data.name },
    { label: 'Age', value: `${data.age} years` },
    { label: 'Goal', value: data.goal?.replace('_', ' ') },
    { label: 'Diet', value: data.diet_preference },
    { label: 'Height', value: `${data.height_cm} cm` },
    { label: 'Weight', value: `${data.weight_kg} kg` },
    { label: 'Target', value: `${data.target_weight_kg} kg` },
    { label: 'Gym', value: data.has_gym ? 'Yes' : 'No' },
    { label: 'Fasting', value: data.is_fasting ? 'Yes' : 'No' },
    { label: 'Beverages', value: data.beverage_habit },
  ]
  return (
    <div style={s.stepContent}>
      <h2 style={s.stepTitle}>All set! 🎉</h2>
      <p style={s.stepSubtitle}>Review your profile before we generate your plan</p>
      <div style={s.summaryCard}>
        {summaryItems.map((item, i) => (
          <div key={item.label} style={{
            ...s.summaryRow,
            borderBottom: i < summaryItems.length - 1 ? '1px solid rgba(255,255,255,0.25)' : 'none',
          }}>
            <span style={s.summaryLabel}>{item.label}</span>
            <span style={s.summaryValue}>{item.value || '—'}</span>
          </div>
        ))}
      </div>
      <div style={s.aiNote}>
        <span style={{ fontSize: '1.25rem' }}>🤖</span>
        <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
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
      background: selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.35)',
      color: selected ? '#ffffff' : 'var(--color-text-muted)',
      border: `1px solid ${selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.55)'}`,
      fontWeight: selected ? 700 : 400,
      transform: selected ? 'scale(1.04)' : 'scale(1)',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
      {label}
    </button>
  )
}

function GoalCard({ label, desc, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect} style={{
      ...s.goalCard,
      background: selected
        ? 'rgba(58,158,95,0.18)'
        : 'rgba(255,255,255,0.35)',
      border: `1px solid ${selected ? 'var(--color-accent)' : 'rgba(255,255,255,0.55)'}`,
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
    }}>
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

// ─── Loading Overlay ───────────────────────────────────────────

function LoadingOverlay() {
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const cycle = () => {
      // Fade out
      setVisible(false)
      setTimeout(() => {
        setSentenceIdx(prev => (prev + 1) % LOADING_SENTENCES.length)
        setVisible(true)  // Fade in
      }, 400)
    }
    const id = setInterval(cycle, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={s.loadingOverlay}>
      <div style={s.loadingCard} className="glass-heavy">
        <Loader2
          size={44}
          color="var(--color-accent)"
          style={{ animation: 'spin 1s linear infinite', marginBottom: '24px' }}
        />
        <p style={{
          ...s.loadingSentence,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
        }}>
          {LOADING_SENTENCES[sentenceIdx]}
        </p>
        <p style={s.loadingHint}>This may take a few seconds</p>
      </div>
    </div>
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

  // Track step changes to restart Ken Burns
  const isStepValid = () => {
    switch (step) {
      case 1: return data.name.trim() && data.age && data.city.trim() && data.gender
      case 2: return data.height_cm && data.weight_kg && data.target_weight_kg && data.health_time_minutes
      case 3: return data.goal && data.diet_preference
      case 4:
        if (data.beverage_habit === 'tea') return !!data.tea_type
        if (data.beverage_habit === 'coffee') return !!data.coffee_type
        if (data.beverage_habit === 'both') return !!(data.morning_beverage && data.evening_beverage)
        return true
      case 5:
        if (data.is_fasting) return !!(data.fasting_days.trim() && data.fasting_type.trim())
        return data.has_gym !== undefined
      case 6: return true
      default: return false
    }
  }

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
  const stepValid = isStepValid()
  const currentBg = STEP_IMAGES[step - 1]

  return (
    <div style={s.wrapper}>

      {/* ── Ken Burns Background Image ── */}
      <img
        key={`bg-step-${step}`}
        src={currentBg}
        alt=""
        style={s.bgImage}
        className={`ken-burns-step-${step}`}
      />

      {/* ── Overlay ── */}
      <div style={s.overlay} />

      {/* ── Loading Overlay (full screen) ── */}
      {loading && <LoadingOverlay />}

      {/* ── Inner layout ── */}
      <div style={s.inner}>

        {/* Header */}
        <div style={s.header}>
          {step > 1 ? (
            <button onClick={handleBack} style={s.backBtn} className="glass">
              <ChevronLeft size={20} color="var(--color-text)" />
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

        {/* Footer */}
        <div style={s.footer} className="glass">
          <button
            onClick={step === TOTAL_STEPS ? handleSubmit : handleNext}
            disabled={loading || !stepValid}
            style={{
              ...s.nextBtn,
              opacity: (!stepValid || loading) ? 0.45 : 1,
              cursor: (!stepValid || loading) ? 'not-allowed' : 'pointer',
            }}
            className="next-btn"
          >
            {loading
              ? <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
              : step === TOTAL_STEPS
                ? 'Generate My Plan 🚀'
                : 'Continue →'
            }
          </button>

          {!stepValid && (
            <p style={s.hintText}>Complete all fields to continue</p>
          )}
        </div>

      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }

        /* Crossfade between steps */
        @keyframes fadeInBg {
          from { opacity: 0; transform: scale(1.02); }
          to   { opacity: 1; transform: scale(1); }
        }

        /* Cinematic Ken Burns - Slow, continuous push-in and pan.
          We create two variations so the camera direction changes on every step.
        */
        @keyframes kenBurnsOdd {
          0%   { transform: scale(1.0) translate(0%, 0%); }
          100% { transform: scale(1.8) translate(-2%, -1.5%); }
        }

        @keyframes kenBurnsEven {
          0%   { transform: scale(1.0) translate(0%, 0%); }
          100% { transform: scale(1.8) translate(1.5%, 2%); }
        }

        /* Apply alternating animations. 'infinite alternate' ensures if a user
           lingers on a step for >30s, it slowly reverses instead of snapping. */
        .ken-burns-step-1,
        .ken-burns-step-3,
        .ken-burns-step-5 {
          animation:
            fadeInBg 1s cubic-bezier(0.16, 1, 0.3, 1) both,
            kenBurnsOdd 30s linear infinite alternate;
          will-change: transform, opacity;
        }

        .ken-burns-step-2,
        .ken-burns-step-4,
        .ken-burns-step-6 {
          animation:
            fadeInBg 1s cubic-bezier(0.16, 1, 0.3, 1) both,
            kenBurnsEven 30s linear infinite alternate;
          will-change: transform, opacity;
        }

        /* Inputs */
        .glass-input:focus {
          outline: none;
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 3px var(--color-accent-glow) !important;
          background: rgba(255,255,255,0.80) !important;
        }
        .glass-input::placeholder { color: var(--color-text-faint); }

        /* Next button hover */
        .next-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px var(--color-accent-glow);
          background: var(--color-accent-hover) !important;
        }
        .next-btn:active:not(:disabled) { transform: translateY(0); }

        /* Loading sentence transition */
        .loading-sentence {
          transition: opacity 400ms ease, transform 400ms ease;
        }

        @media (max-width: 480px) {
          .onboarding-inner { padding: 0 !important; }
        }
      `}</style>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────

const s = {
  wrapper: {
    minHeight: '100dvh',
    position: 'relative',
    overflow: 'hidden',
    display: 'flex',
    fontFamily: 'var(--font-body)',
  },
  bgImage: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
    transformOrigin: 'center center',
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(160deg, rgba(220,245,228,0.50) 0%, rgba(180,225,195,0.42) 100%)',
    zIndex: 1,
  },
  inner: {
    position: 'relative',
    zIndex: 2,
    width: '100%',
    maxWidth: '480px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100dvh',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 20px 8px',
  },
  backBtn: {
    width: '40px', height: '40px',
    borderRadius: '12px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    border: 'none',
  },
  stepCounter: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.3px',
  },
  progressTrack: {
    height: '3px',
    background: 'rgba(255,255,255,0.35)',
    margin: '8px 20px 0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--color-accent)',
    borderRadius: '4px',
    transition: 'width 450ms cubic-bezier(0.16,1,0.3,1)',
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
    fontSize: 'clamp(1.4rem, 4vw, 1.7rem)',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.4px',
    lineHeight: 1.2,
  },
  stepSubtitle: {
    fontSize: '0.9rem',
    color: 'var(--color-text-muted)',
    marginTop: '-16px',
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
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.2px',
  },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.60)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.70)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    fontFamily: 'var(--font-body)',
    transition: 'border-color var(--transition), box-shadow var(--transition), background var(--transition)',
  },
  optionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  chip: {
    padding: '8px 18px',
    borderRadius: '999px',
    fontSize: '0.875rem',
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
    whiteSpace: 'nowrap',
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
  },
  goalCard: {
    padding: '14px',
    borderRadius: 'var(--radius-md)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    cursor: 'pointer',
    position: 'relative',
    transition: 'all 200ms cubic-bezier(0.16,1,0.3,1)',
    textAlign: 'left',
  },
  goalCheck: {
    position: 'absolute',
    top: '10px', right: '10px',
    width: '18px', height: '18px',
    background: 'var(--color-accent)',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    background: 'rgba(255,255,255,0.55)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.65)',
    borderRadius: 'var(--radius-lg)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-md)',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
  },
  summaryLabel: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  summaryValue: {
    fontSize: '0.875rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    textTransform: 'capitalize',
  },
  aiNote: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    background: 'rgba(58,158,95,0.10)',
    border: '1px solid rgba(58,158,95,0.25)',
    borderRadius: 'var(--radius-md)',
    padding: '14px',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
  },
  footer: {
    padding: '16px 20px',
    paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
    borderTop: '1px solid rgba(255,255,255,0.30)',
  },
  nextBtn: {
    width: '100%',
    padding: '15px',
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'background var(--transition), transform var(--transition), box-shadow var(--transition)',
    letterSpacing: '0.2px',
  },
  hintText: {
    textAlign: 'center',
    fontSize: '0.75rem',
    color: 'var(--color-text-faint)',
    marginTop: '8px',
  },
  loadingOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(220,245,228,0.45)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  loadingCard: {
    borderRadius: 'var(--radius-xl)',
    padding: '40px 36px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    maxWidth: '320px',
    width: '90%',
  },
  loadingSentence: {
    fontSize: '1rem',
    fontWeight: 600,
    color: 'var(--color-text)',
    fontFamily: 'var(--font-body)',
    lineHeight: 1.5,
    minHeight: '48px',
    transition: 'opacity 400ms ease, transform 400ms ease',
    marginBottom: '12px',
  },
  loadingHint: {
    fontSize: '0.8rem',
    color: 'var(--color-text-faint)',
    fontFamily: 'var(--font-body)',
  },
}

export default Onboarding