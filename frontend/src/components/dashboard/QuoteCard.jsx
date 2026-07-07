import { useState, useEffect } from 'react'
import { FONT, QUOTES } from '../../utils/dashboard/constants'
import { sectionLabel, quoteCardStyle } from '../../utils/dashboard/styles'

/**
 * Auto-rotating motivational quote card.
 * Cycles every 4 s, tap to advance manually.
 */
export default function QuoteCard() {
  const [idx, setIdx]       = useState(() => Math.floor(Math.random() * QUOTES.length))
  const [visible, setVisible] = useState(true)

  const nextQuote = () => {
    setVisible(false)
    setTimeout(() => { setIdx(i => (i + 1) % QUOTES.length); setVisible(true) }, 280)
  }

  useEffect(() => {
    const t = setInterval(nextQuote, 4000)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={quoteCardStyle} onClick={nextQuote}>
      <p style={{ ...sectionLabel, color: 'var(--color-accent)', marginBottom: '10px' }}>
        Daily Motivation ✨
      </p>
      <p style={{
        fontSize: '1.05rem', color: 'var(--color-text)',
        fontFamily: FONT,
        lineHeight: 1.6, fontStyle: 'italic',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(8px)',
        transition: 'opacity 280ms ease, transform 280ms ease',
      }}>
        "{QUOTES[idx]}"
      </p>
      <p style={{
        fontSize: '0.78rem', color: 'var(--color-text-faint)',
        fontFamily: FONT, marginTop: '10px',
      }}>
        Tap for next quote →
      </p>
    </div>
  )
}
