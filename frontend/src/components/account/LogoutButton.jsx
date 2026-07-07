import { LogOut } from 'lucide-react'
import { S } from '../../utils/account/styles'
import { FONT } from '../../utils/account/constants'

export default function LogoutButton({ onClick }) {
  return (
    <button onClick={onClick} style={S.logoutBtn}>
      <LogOut size={20} color="#FF3B30" />
      <span style={{
        fontSize: '1rem', fontWeight: 800,
        color: '#FF3B30', fontFamily: FONT,
      }}>
        Log Out
      </span>
    </button>
  )
}
