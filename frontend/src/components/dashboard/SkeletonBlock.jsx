/**
 * A shimmer skeleton placeholder block used during loading states.
 */
export default function SkeletonBlock({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div style={{
      width, height,
      background: 'rgba(160,210,170,0.25)',
      borderRadius: radius,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%)',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }} />
    </div>
  )
}
