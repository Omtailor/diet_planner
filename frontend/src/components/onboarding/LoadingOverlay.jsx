import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { LOADING_SENTENCES } from '../../utils/onboarding/constants'
import s from '../../utils/onboarding/styles'

function LoadingOverlay() {
  const [sentenceIdx, setSentenceIdx] = useState(0)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const cycle = () => {
      // Fade out
      setVisible(false)
      setTimeout(() => {
        setSentenceIdx(prev => (prev + 1) % LOADING_SENTENCES.length)
        setVisible(true) // Fade in
      }, 400)
    }
    const id = setInterval(cycle, 2200)
    return () => clearInterval(id)
  }, [])

  return (
    <div style={s.loadingOverlay}>
      <div style={s.loadingCard} className="glass-heavy">
        <Loader2
          size={44}
          color="var(--color-accent)"
          style={{ animation: 'spin 1s linear infinite', marginBottom: '24px' }}
        />
        <p style={{
          ...s.loadingSentence,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(8px)',
        }}>
          {LOADING_SENTENCES[sentenceIdx]}
        </p>
        <p style={s.loadingHint}>This may take a upto 1 minute, Please have patience while the magic happens!</p>
      </div>
    </div>
  )
}

export default LoadingOverlay
