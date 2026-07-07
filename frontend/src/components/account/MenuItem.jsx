import { S } from '../../utils/account/styles'

export default function MenuItem({ icon, label, sub, onClick, isLast }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...S.menuItem,
        borderBottom: isLast ? 'none' : '1px solid rgba(0,0,0,0.04)',
      }}
    >
      <div style={S.menuIcon}>{icon}</div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={S.menuLabel}>{label}</p>
        <p style={S.menuSub}>{sub}</p>
      </div>
      <span style={S.menuChevron}>›</span>
    </button>
  )
}
