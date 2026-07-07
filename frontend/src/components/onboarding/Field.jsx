import s from '../../utils/onboarding/styles'

function Field({ label, children }) {
  return (
    <div style={s.fieldGroup}>
      <label style={s.label}>{label}</label>
      {children}
    </div>
  )
}

export default Field
