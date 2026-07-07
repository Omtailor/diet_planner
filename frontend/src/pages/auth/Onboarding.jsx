import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { useAuth } from '../../context/AuthContext'

// ─── Constants ─────────────────────────────────────────────────
import { STEP_IMAGES, TOTAL_STEPS } from '../../utils/onboarding/constants'

// ─── Validation ────────────────────────────────────────────────
import { isStepValid, validateStep } from '../../utils/onboarding/validation'

// ─── Styles ────────────────────────────────────────────────────
import s from '../../utils/onboarding/styles'

// ─── Shared UI Components ──────────────────────────────────────
import BackgroundImage from '../../components/onboarding/BackgroundImage'
import OnboardingGlobalStyles from '../../components/onboarding/OnboardingGlobalStyles'
import OnboardingHeader from '../../components/onboarding/OnboardingHeader'
import OnboardingFooter from '../../components/onboarding/OnboardingFooter'
import ProgressBar from '../../components/onboarding/ProgressBar'
import LoadingOverlay from '../../components/onboarding/LoadingOverlay'

// ─── Step Components ───────────────────────────────────────────
import Step1 from '../../components/onboarding/Step1'
import Step2 from '../../components/onboarding/Step2'
import Step3 from '../../components/onboarding/Step3'
import Step4 from '../../components/onboarding/Step4'
import Step5 from '../../components/onboarding/Step5'
import Step6 from '../../components/onboarding/Step6'

const STEPS = [Step1, Step2, Step3, Step4, Step5, Step6]

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

  const handleNext = () => {
    if (!validateStep(step, data)) return
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
      toast.success('Profile saved! Welcome to Diet Planner 🎉')
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

  const CurrentStep = STEPS[step - 1]
  const progress = (step / TOTAL_STEPS) * 100
  const stepValid = isStepValid(step, data)
  const currentBg = STEP_IMAGES[step - 1]

  return (
    <div style={s.wrapper}>

      {/* ── Ken Burns Background Image ── */}
      <BackgroundImage step={step} currentBg={currentBg} />

      {/* ── Overlay ── */}
      <div style={s.overlay} />

      {/* ── Loading Overlay (full screen) ── */}
      {loading && <LoadingOverlay />}

      {/* ── Inner layout ── */}
      <div style={s.inner}>

        {/* Header */}
        <OnboardingHeader step={step} onBack={handleBack} />

        {/* Progress bar */}
        <ProgressBar progress={progress} />

        {/* Step content */}
        <div style={s.content}>
          <CurrentStep data={data} update={update} />
        </div>

        {/* Footer */}
        <OnboardingFooter
          step={step}
          loading={loading}
          stepValid={stepValid}
          onNext={handleNext}
          onSubmit={handleSubmit}
        />

      </div>

      {/* ── Scoped global styles (animations, hover effects, responsive) ── */}
      <OnboardingGlobalStyles />

    </div>
  )
}

export default Onboarding
