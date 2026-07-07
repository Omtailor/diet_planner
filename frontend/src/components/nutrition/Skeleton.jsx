const shimmerStyle = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%)',
  animation: 'shimmer 1.5s ease-in-out infinite',
}

export default function Skeleton({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div style={{
      width, height, background: 'rgba(0,0,0,0.06)',
      borderRadius: radius, overflow: 'hidden', position: 'relative'
    }}>
      <div style={shimmerStyle} />
    </div>
  )
}
