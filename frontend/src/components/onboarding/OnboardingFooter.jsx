import { Loader2 } from 'lucide-react'
import { TOTAL_STEPS } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function OnboardingFooter({ step, loading, stepValid, onNext, onSubmit }) {
  const isLastStep = step === TOTAL_STEPS
  const handleClick = isLastStep ? onSubmit : onNext

  return (
    <div style={s.footer} className="glass">
      <button
        onClick={handleClick}
        disabled={loading || !stepValid}
        style={{
          ...s.nextBtn,
          opacity: (!stepValid || loading) ? 0.45 : 1,
          cursor: (!stepValid || loading) ? 'not-allowed' : 'pointer',
        }}
        className="next-btn"
      >
        {loading ? (
          <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
        ) : isLastStep ? (
          'Complete Setup 🎉'
        ) : (
          'Continue →'
        )}
      </button>

      {!stepValid && (
        <p style={s.hintText}>Complete all fields to continue</p>
      )}
    </div>
  )
}

export default OnboardingFooter
