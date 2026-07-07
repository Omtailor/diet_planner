import { ChevronLeft } from 'lucide-react'
import { TOTAL_STEPS } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function OnboardingHeader({ step, onBack }) {
  return (
    <div style={s.header}>
      {step > 1 ? (
        <button onClick={onBack} style={s.backBtn} className="glass">
          <ChevronLeft size={20} color="var(--color-text)" />
        </button>
      ) : (
        <div style={{ width: '40px' }} />
      )}
      <span style={s.stepCounter}>Step {step} of {TOTAL_STEPS}</span>
      <div style={{ width: '40px' }} />
    </div>
  )
}

export default OnboardingHeader
