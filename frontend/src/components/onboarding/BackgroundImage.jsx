import s from '../../utils/onboarding/styles'

function BackgroundImage({ step, currentBg }) {
  return (
    <img
      key={`bg-step-${step}`}
      src={currentBg}
      alt=""
      style={s.bgImage}
      className={`ken-burns-step-${step}`}
    />
  )
}

export default BackgroundImage
