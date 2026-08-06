import { S } from '../../utils/account/styles'

const blockerItems = [
  { emoji: '👤', text: 'Basic info — age, gender, city' },
  { emoji: '⚖️', text: 'Body stats — height & weight' },
  { emoji: '🎯', text: 'Your goal — fat loss, muscle gain...' },
  { emoji: '🥗', text: 'Diet preference — veg, non-veg, jain' },
]

export default function OnboardingBlocker({ onCompleteOnboarding, onDismiss }) {
  return (
    <div style={S.onboardingOverlay} onClick={onDismiss}>
      <div style={S.onboardingCard} onClick={(e) => e.stopPropagation()}>
        <div style={S.onboardingIcon}>📋</div>

        <h2 style={S.onboardingTitle}>Complete Your Profile First</h2>

        <p style={S.onboardingDesc}>
          We need a few details about you — age, weight, goal, and diet preference — to build a personalised meal plan.
        </p>

        <div style={S.onboardingList}>
          {blockerItems.map(({ emoji, text }) => (
            <div key={text} style={S.onboardingRow}>
              <span style={S.onboardingEmoji}>{emoji}</span>
              <span style={S.onboardingText}>{text}</span>
            </div>
          ))}
        </div>

        <button onClick={onCompleteOnboarding} style={S.onboardingPrimaryBtn}>
          Complete Onboarding →
        </button>

        <button onClick={onDismiss} style={S.onboardingSecondaryBtn}>
          Maybe Later
        </button>
      </div>
    </div>
  )
}
