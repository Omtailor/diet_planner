export default function VeggiePile({ pileEmojis, fadedIndices, flyingItem, pileItemRefs }) {
  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: -20,
      right: -20,
      overflow: 'hidden',
      pointerEvents: 'none',
      maskImage: 'linear-gradient(to bottom, transparent 0%, black 35%)',
      WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 35%)',
    }}>
      <div style={{
        position: 'absolute',
        bottom: -6,
        left: -24,
        right: -24,
        display: 'flex',
        flexWrap: 'wrap',
        alignContent: 'flex-end',
        alignItems: 'flex-end',
        gap: 0,
        lineHeight: 1,
      }}>
        {pileEmojis.map((emoji, idx) => {
          const isFaded = fadedIndices.includes(idx)
          const isFlying = flyingItem?.pileIdx === idx
          const rotate = ((idx * 17 + 5) % 34) - 17
          const scale = 0.8 + ((idx * 11) % 100) / 100 * 0.35
          const bobIdx = idx % 4

          return (
            <span
              key={idx}
              ref={(el) => { if (pileItemRefs) pileItemRefs.current[idx] = el }}
              data-pile-idx={idx}
              style={{
                display: 'inline-block',
                fontSize: '1.85rem',
                lineHeight: 1,
                flexShrink: 0,
                transform: `rotate(${rotate}deg) scale(${scale})`,
                width: '1.85rem',
                height: '1.85rem',
                textAlign: 'center',
                marginRight: -5,
                marginBottom: -6,
                opacity: isFaded ? 0.1 : isFlying ? 0 : 1,
                filter: isFaded
                  ? 'grayscale(1)'
                  : 'drop-shadow(0 2px 3px rgba(0,0,0,0.1))',
                transition: 'opacity 400ms ease, filter 400ms ease',
                animation: !isFaded && !isFlying
                  ? `pileBob${bobIdx} ${1.8 + (idx % 8) * 0.22}s ${(idx % 12) * 0.18}s ease-in-out infinite`
                  : 'none',
                userSelect: 'none',
              }}
            >
              {emoji}
            </span>
          )
        })}
      </div>
    </div>
  )
}
