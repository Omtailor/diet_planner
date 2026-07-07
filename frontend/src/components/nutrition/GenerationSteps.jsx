import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { STEPS, FONT } from '../../utils/nutrition/constants'

export default function GenerationSteps() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveStep(prev => (prev + 1) % STEPS.length);
    }, 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16, width: '100%', maxWidth: 300 }}>
      {STEPS.map((step, i) => (
        <div key={i} style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '10px 16px',
          borderRadius: 14,
          background: i === activeStep ? 'rgba(52,199,89,0.1)' : 'rgba(0,0,0,0.03)',
          border: `1px solid ${i === activeStep ? 'rgba(52,199,89,0.3)' : 'rgba(0,0,0,0.05)'}`,
          transition: 'all 400ms ease',
          opacity: i === activeStep ? 1 : 0.45,
          transform: i === activeStep ? 'scale(1.02)' : 'scale(1)',
        }}>
          <span style={{ fontSize: '1.2rem' }}>{step.emoji}</span>
          <span style={{ fontFamily: FONT, fontSize: '0.85rem', fontWeight: i === activeStep ? 700 : 500, color: i === activeStep ? 'var(--color-text)' : 'var(--color-text-muted)' }}>
            {step.text}
          </span>
          {i === activeStep && (
            <Loader2 size={14} color="var(--color-accent)"
              style={{ marginLeft: 'auto', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          )}
        </div>
      ))}
    </div>
  );
}
