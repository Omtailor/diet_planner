export default function MeshBackground() {
  return (
    <>
      {/* Blob 1 — vivid lime green, top-left */}
      <div style={{
        position: 'absolute',
        width: '70vw', height: '70vw',
        maxWidth: 500, maxHeight: 500,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(52,211,120,0.65) 0%, transparent 65%)',
        top: '-20%', left: '-20%',
        animation: 'meshMove1 7s ease-in-out infinite',
        willChange: 'transform',
        pointerEvents: 'none',
        filter: 'blur(28px)',
        zIndex: 0,
      }} />

      {/* Blob 2 — warm yellow-green, bottom-right */}
      <div style={{
        position: 'absolute',
        width: '60vw', height: '60vw',
        maxWidth: 480, maxHeight: 480,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(180,235,80,0.7) 0%, transparent 65%)',
        bottom: '-15%', right: '-15%',
        animation: 'meshMove2 9s ease-in-out infinite',
        willChange: 'transform',
        pointerEvents: 'none',
        filter: 'blur(24px)',
        zIndex: 0,
      }} />

      {/* Blob 3 — teal, center */}
      <div style={{
        position: 'absolute',
        width: '50vw', height: '50vw',
        maxWidth: 400, maxHeight: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(20,184,166,0.5) 0%, transparent 65%)',
        top: '25%', right: '0%',
        animation: 'meshMove3 11s ease-in-out infinite',
        willChange: 'transform',
        pointerEvents: 'none',
        filter: 'blur(32px)',
        zIndex: 0,
      }} />

      {/* Blob 4 — gold/amber, top-right */}
      <div style={{
        position: 'absolute',
        width: '40vw', height: '40vw',
        maxWidth: 320, maxHeight: 320,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(250,204,21,0.45) 0%, transparent 65%)',
        top: '-5%', right: '5%',
        animation: 'meshMove1 13s 1.5s ease-in-out infinite',
        willChange: 'transform',
        pointerEvents: 'none',
        filter: 'blur(30px)',
        zIndex: 0,
      }} />

      {/* Blob 5 — deep emerald, bottom-left */}
      <div style={{
        position: 'absolute',
        width: '50vw', height: '50vw',
        maxWidth: 400, maxHeight: 400,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(16,185,129,0.45) 0%, transparent 65%)',
        bottom: '0%', left: '-10%',
        animation: 'meshMove2 15s 2s ease-in-out infinite',
        willChange: 'transform',
        pointerEvents: 'none',
        filter: 'blur(26px)',
        zIndex: 0,
      }} />

      {/* Grain overlay — makes it feel organic, not digital */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
        backgroundSize: '180px',
        opacity: 0.022,
        animation: 'breatheOverlay 6s ease-in-out infinite',
        pointerEvents: 'none',
        mixBlendMode: 'multiply',
      }} />
    </>
  )
}
