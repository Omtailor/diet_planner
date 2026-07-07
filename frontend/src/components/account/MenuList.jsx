import { S } from '../../utils/account/styles'
import MenuItem from './MenuItem'

export default function MenuList({ items, onItemClick }) {
  return (
    <div style={S.menuCard}>
      {items.map(({ icon, label, sub, key }, index, arr) => (
        <MenuItem
          key={key}
          icon={icon}
          label={label}
          sub={sub}
          onClick={() => onItemClick(key)}
          isLast={index === arr.length - 1}
        />
      ))}
    </div>
  )
}
