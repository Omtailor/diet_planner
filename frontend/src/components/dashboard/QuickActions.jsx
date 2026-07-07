import { useNavigate } from 'react-router-dom'
import { UtensilsCrossed, Dumbbell, Scale } from 'lucide-react'
import { FONT } from '../../utils/dashboard/constants'
import { quickGrid, quickBtn, quickIconWrap } from '../../utils/dashboard/styles'

/**
 * Three-tile quick-action grid at the top of the Dashboard.
 * Navigates to Nutrition / Training, or opens the weight modal.
 *
 * Props:
 *  onUpdateWeight – called when the Scale tile is tapped
 */
export default function QuickActions({ onUpdateWeight }) {
  const navigate = useNavigate()

  const actions = [
    {
      icon: <UtensilsCrossed size={22} color="var(--color-accent)" />,
      glow: 'hsla(142, 46%, 42%, 0.15)',
      label: 'View Meals',
      action: () => navigate('/nutrition'),
    },
    {
      icon: <Dumbbell size={22} color="#60B8FF" />,
      glow: 'rgba(96,184,255,0.15)',
      label: 'Training',
      action: () => navigate('/training'),
    },
    {
      icon: <Scale size={22} color="#e09a2e" />,
      glow: 'rgba(224,154,46,0.15)',
      label: 'Update Weight',
      action: onUpdateWeight,
    },
  ]

  return (
    <div style={quickGrid} className="dash-fadeUp dash-delay-3">
      {actions.map(({ icon, glow, label, action }) => (
        <button key={label} onClick={action} style={quickBtn} className="quick-tile">
          <div style={{ ...quickIconWrap, background: glow }}>
            {icon}
          </div>
          <span style={{
            fontSize: '0.72rem', fontWeight: 600,
            color: 'var(--color-text-muted)',
            fontFamily: FONT,
            textAlign: 'center', lineHeight: 1.3,
            textTransform: 'uppercase', letterSpacing: '0.8px',
          }}>{label}</span>
        </button>
      ))}
    </div>
  )
}
