import { S } from '../../utils/account/styles'

export default function StatsRow({ weight, targetWeight, bmi }) {
  const stats = [
    { label: 'Weight', value: weight ? `${weight}kg` : '—' },
    { label: 'Target', value: targetWeight ? `${targetWeight}kg` : '—' },
    { label: 'BMI', value: bmi ? parseFloat(bmi).toFixed(1) : '—' },
  ]

  return (
    <div style={S.statsRow}>
      {stats.map(({ label, value }) => (
        <div key={label} style={S.statBox}>
          <span style={S.statVal}>{value}</span>
          <span style={S.statLabel}>{label}</span>
        </div>
      ))}
    </div>
  )
}
