import s from '../../utils/onboarding/styles'

function ProgressBar({ progress }) {
  return (
    <div style={s.progressTrack}>
      <div style={{ ...s.progressFill, width: `${progress}%` }} />
    </div>
  )
}

export default ProgressBar
