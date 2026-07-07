import { useState, useEffect, useRef } from 'react'
import { DIET_POOLS } from '../../../utils/nutrition/constants'
import VeggiePile from './VeggiePile'
import MeshBackground from './MeshBackground'
import ProgressSteps from './ProgressSteps'

export default function CookingLoader({ dietType = 'non-veg', onDone }) {
  const FONT = "'General Sans', sans-serif"
  const ACCENT = '#3a9e5f'

  const normalizedDietType = String(dietType || 'non-veg').toLowerCase().replace(/_/g, '-')
  const diet = normalizedDietType === 'vegetarian' ? 'veg' : (DIET_POOLS[normalizedDietType] ? normalizedDietType : 'non-veg')
  const pool = DIET_POOLS[diet]

  const PILE_COUNT = 150
  const [pileEmojis] = useState(() => {
    const arr = []
    while (arr.length < 150) arr.push(...pool)
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
        ;[arr[i], arr[j]] = [arr[j], arr[i]]
    }
    return arr.slice(0, 150)
  })

  const COOKING_STEPS = [
    { emoji: '📊', text: 'Calculating your TDEE & macros' },
    { emoji: '🍳', text: 'Designing Day 1 meals for your goal' },
    { emoji: '🥗', text: 'Planning Day 2 with variety' },
    { emoji: '🍱', text: 'Crafting Day 3 balanced meals' },
    { emoji: '✅', text: 'Validating macros & finalising plan' },
  ]

  const [activeStep, setActiveStep] = useState(0)
  const [fadedIndices, setFadedIndices] = useState([])
  const [flyingItem, setFlyingItem] = useState(null)
  const [plateItems, setPlateItems] = useState([])
  const [plateGlow, setPlateGlow] = useState(false)
  const [done, setDone] = useState(false)
  const [scatterItems, setScatterItems] = useState([])

  const pileItemRefs = useRef({})
  const plateRef = useRef(null)
  const timerRef = useRef(null)
  const usedPileIdx = useRef([])
  const usedEmojis = useRef([])

  const pickRandom = () => {
    const available = pileEmojis
      .map((e, i) => ({ e, i }))
      .filter(({ e, i }) => !usedPileIdx.current.includes(i) && !usedEmojis.current.includes(e))
    if (!available.length) return null
    return available[Math.floor(Math.random() * available.length)]
  }

  const launchIngredient = (step) => {
    const picked = pickRandom()
    if (!picked) return

    const { e: emoji, i: pileIdx } = picked
    usedPileIdx.current.push(pileIdx)
    usedEmojis.current.push(emoji)

    const fromNode = pileItemRefs.current[pileIdx]
    const toNode = plateRef.current
    if (!fromNode || !toNode) return

    const fromRect = fromNode.getBoundingClientRect()
    const toRect = toNode.getBoundingClientRect()

    setFlyingItem({
      pileIdx,
      emoji,
      fromX: fromRect.left + fromRect.width / 2,
      fromY: fromRect.top + fromRect.height / 2,
      toX: toRect.left + toRect.width / 2,
      toY: toRect.top + toRect.height / 2,
    })

    setTimeout(() => {
      setFlyingItem(null)
      setFadedIndices((prev) => [...prev, pileIdx])
      setPlateItems((prev) => [...prev, emoji])
      if (step === COOKING_STEPS.length - 1) {
        setTimeout(() => {
          setPlateGlow(true)
          setDone(true)
          setTimeout(() => {
            setScatterItems([...usedEmojis.current])
            if (typeof onDone === 'function') onDone()
          }, 600)
        }, 400)
      }
    }, 1000)
  }

  useEffect(() => {
    let cancelled = false

    const advance = (step) => {
      if (cancelled || step >= COOKING_STEPS.length) return
      setActiveStep(step)

      const launchTimer = setTimeout(() => {
        if (!cancelled) launchIngredient(step)
      }, 1500)

      if (step < COOKING_STEPS.length - 1) {
        const nextTimer = setTimeout(() => {
          if (!cancelled) advance(step + 1)
        }, 5000)
        timerRef.current = [launchTimer, nextTimer]
      } else {
        timerRef.current = [launchTimer]
      }
    }

    advance(0)

    return () => {
      cancelled = true
        ; (timerRef.current || []).forEach(clearTimeout)
    }
  }, [])

  const SCATTER_TARGETS = [
    { x: '-45vw', y: '-40vh', r: '-25deg' },
    { x: '45vw', y: '-40vh', r: '20deg' },
    { x: '-45vw', y: '40vh', r: '15deg' },
    { x: '45vw', y: '40vh', r: '-30deg' },
    { x: '0', y: '-48vh', r: '5deg' },
  ]

  return (
    <>
      <style>{`
        @keyframes pileBob0 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-7px) rotate(4deg)} }
        @keyframes pileBob1 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-5px) rotate(-3deg)} }
        @keyframes pileBob2 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-9px) rotate(6deg)} }
        @keyframes pileBob3 { 0%,100%{transform:translateY(0) rotate(0deg)} 50%{transform:translateY(-4px) rotate(-5deg)} }

        @keyframes smoothSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }

        @keyframes stepIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 1; transform: translateX(0); }
        }

        @keyframes checkScale {
          0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
          60%  { transform: scale(1.25) rotate(5deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes arcFly {
          0%   { opacity:0; transform:translate(0,0) scale(0.6) rotate(0deg); }
          15%  { opacity:1; }
          50%  { transform:translate(var(--mid-x), var(--mid-y)) scale(1.3) rotate(180deg); }
          85%  { transform:translate(var(--end-x), var(--end-y)) scale(1.1) rotate(330deg); }
          100% { opacity:1; transform:translate(var(--end-x), var(--end-y)) scale(1) rotate(360deg); }
        }

        @keyframes plateLand {
          0%,100% { transform:scale(1); }
          40%     { transform:scale(1.08) rotate(-2deg); }
          70%     { transform:scale(0.95) rotate(1deg); }
        }

        @keyframes plateGlowPulse {
          0%,100% { box-shadow:0 8px 32px rgba(30,80,45,0.15),0 0 0 rgba(58,158,95,0); }
          50%     { box-shadow:0 8px 32px rgba(30,80,45,0.15),0 0 40px 12px rgba(58,158,95,0.4); }
        }

        @keyframes scatterOut {
          0%   { opacity:1; transform:translate(0,0) scale(1) rotate(0deg); }
          100% { opacity:0; transform:translate(var(--sx),var(--sy)) scale(0.3) rotate(var(--sr)); }
        }

        @keyframes floatPlate {
          0%,100% { transform:translateY(0px) rotate(0deg); }
          50%     { transform:translateY(-5px) rotate(4deg); }
        }

        @keyframes checkPop {
          0%   { transform:scale(0); opacity:0; }
          60%  { transform:scale(1.3); opacity:1; }
          100% { transform:scale(1); opacity:1; }
        }

        @keyframes bgShift {
          0%,100% { background-position:0% 50%; }
          50%     { background-position:100% 50%; }
        }

        @keyframes fadeUp {
          from { opacity:0; transform:translateY(16px); }
          to   { opacity:1; transform:translateY(0); }
        }

        @keyframes meshMove1 {
          0%,100% { transform: translate(0%, 0%) scale(1); }
          33%     { transform: translate(12%, -18%) scale(1.2); }
          66%     { transform: translate(-10%, 12%) scale(0.88); }
        }
        @keyframes meshMove2 {
          0%,100% { transform: translate(0%, 0%) scale(1); }
          33%     { transform: translate(-14%, 14%) scale(1.15); }
          66%     { transform: translate(16%, -10%) scale(1.08); }
        }
        @keyframes meshMove3 {
          0%,100% { transform: translate(0%, 0%) scale(1); }
          50%     { transform: translate(10%, 18%) scale(1.18); }
        }
        @keyframes breatheOverlay {
          0%,100% { opacity: 0.45; }
          50%     { opacity: 0.7; }
        }
      `}</style>

      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        paddingTop: 'clamp(32px, 6vh, 64px)',
        paddingBottom: 0,
        overflow: 'clip',
        background: '#d8f5e3',
      }}>
        <MeshBackground />

        <div style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-start',
          overflow: 'hidden',
        }}>
          <div style={{ textAlign: 'center', marginBottom: 'clamp(12px,2.5vh,24px)', animation: 'fadeUp 0.5s ease both' }}>
            <p style={{ fontFamily: FONT, fontSize: 'clamp(1.2rem,4vw,1.55rem)', fontWeight: 800, color: '#0f1f12', letterSpacing: '-0.3px', marginBottom: 4 }}>
              {done ? '🎉 Your plan is ready!' : 'Cooking your meal plan...'}
            </p>
            <p style={{ fontFamily: FONT, fontSize: 'clamp(0.78rem,2.5vw,0.9rem)', color: '#4a6652', fontWeight: 500 }}>
              {done ? 'Sit tight! Your personalised meal plan is getting ready.' : 'We are crafting 9 personalised Indian meals for you'}
            </p>
          </div>

          <div ref={plateRef} style={{
            position: 'relative',
            width: 'clamp(130px,28vw,160px)',
            height: 'clamp(130px,28vw,160px)',
            marginBottom: 'clamp(10px,2vh,20px)',
            flexShrink: 0,
          }}>
            <div style={{
              width: '100%', height: '100%', borderRadius: '50%',
              background: plateGlow
                ? 'radial-gradient(circle,rgba(58,158,95,0.25) 0%,rgba(255,255,255,0.9) 60%)'
                : 'radial-gradient(circle,rgba(255,255,255,0.97) 60%,rgba(220,230,222,0.8) 100%)',
              border: `3px solid ${plateGlow ? 'rgba(58,158,95,0.55)' : 'rgba(200,220,205,0.6)'}`,
              boxShadow: '0 8px 32px rgba(30,80,45,0.15),0 2px 8px rgba(30,80,45,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexWrap: 'wrap', gap: 2,
              transition: 'all 600ms ease',
              animation: plateGlow
                ? 'plateGlowPulse 1.8s ease infinite'
                : plateItems.length > 0 ? 'plateLand 0.5s ease' : 'none',
              position: 'relative', overflow: 'visible',
            }}>
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: '1.5px solid rgba(200,220,205,0.35)', pointerEvents: 'none' }} />

              {plateItems.map((emoji, i) => {
                const total = plateItems.length
                const angle = (i / Math.max(total, 1)) * 360 - 90
                const rad = angle * Math.PI / 180
                const r = total === 1 ? 0 : Math.min(30, 10 + total * 5)
                return (
                  <span key={i} style={{
                    position: 'absolute',
                    fontSize: 'clamp(1rem,3vw,1.25rem)',
                    left: `calc(50% + ${Math.cos(rad) * r}px)`,
                    top: `calc(50% + ${Math.sin(rad) * r}px)`,
                    transform: 'translate(-50%,-50%)',
                    animation: done && scatterItems.length
                      ? `scatterOut 1.2s ${i * 0.12}s cubic-bezier(0.55,0,1,0.45) forwards`
                      : `floatPlate ${2 + i * 0.4}s ${i * 0.3}s ease-in-out infinite`,
                    '--sx': SCATTER_TARGETS[i % SCATTER_TARGETS.length].x,
                    '--sy': SCATTER_TARGETS[i % SCATTER_TARGETS.length].y,
                    '--sr': SCATTER_TARGETS[i % SCATTER_TARGETS.length].r,
                  }}>
                    {emoji}
                  </span>
                )
              })}
            </div>
          </div>

          <ProgressSteps 
            steps={COOKING_STEPS} 
            activeStep={activeStep} 
            done={done} 
            plateItems={plateItems}
            ACCENT={ACCENT}
            FONT={FONT}
          />

          <div style={{ width: '100%', maxWidth: 'min(340px,88vw)', height: 3, borderRadius: 4, background: 'rgba(0,0,0,0.06)', margin: '0 16px clamp(8px,1.5vh,14px)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${done ? 100 : (plateItems.length / COOKING_STEPS.length) * 100}%`,
              background: `linear-gradient(90deg,${ACCENT},#6ee7b7)`,
              borderRadius: 4,
              transition: 'width 800ms cubic-bezier(0.34,1.56,0.64,1)',
              boxShadow: '0 0 6px rgba(58,158,95,0.4)',
            }} />
          </div>

          <p style={{ fontFamily: FONT, fontSize: 'clamp(0.67rem,2vw,0.75rem)', color: '#8aaa92', textAlign: 'center' }}>
            {done ? 'Preparing your view...' : 'This usually takes 25–30 seconds · Please wait ⚡'}
          </p>

          {flyingItem && (() => {
            const { emoji, fromX, fromY, toX, toY } = flyingItem
            const endDX = toX - fromX
            const endDY = toY - fromY
            const midDX = endDX * 0.5
            const midDY = endDY * 0.5 - 120
            return (
              <div style={{
                position: 'fixed',
                left: fromX,
                top: fromY,
                fontSize: 'clamp(1.6rem,5vw,2rem)',
                '--mid-x': `${midDX}px`,
                '--mid-y': `${midDY}px`,
                '--end-x': `${endDX}px`,
                '--end-y': `${endDY}px`,
                animation: 'arcFly 1s cubic-bezier(0.25,0.46,0.45,0.94) forwards',
                pointerEvents: 'none',
                zIndex: 10000,
                transform: 'translate(-50%,-50%)',
                filter: 'drop-shadow(0 6px 12px rgba(0,0,0,0.2))',
              }}>
                {emoji}
              </div>
            )
          })()}
          <VeggiePile
            pileEmojis={pileEmojis}
            fadedIndices={fadedIndices}
            flyingItem={flyingItem}
            pileItemRefs={pileItemRefs}
          />
        </div>
      </div>
    </>
  )
}
