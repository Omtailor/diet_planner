import { useState, useEffect } from 'react';

/**
 * Animated horizontal progress bar with a needle indicator.
 * Used to visualise calorie/effort intensity per exercise.
 */
export default function NeedleBar({ value, max, color, glow }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min((value / (max || 1)) * 100, 100);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{
      height: '6px', background: 'rgba(0,0,0,0.06)',
      borderRadius: '6px', overflow: 'visible', marginTop: '8px',
    }}>
      <div style={{
        height: '100%', width: `${animated}%`,
        background: color, borderRadius: '6px',
        boxShadow: `0 0 8px ${glow}`,
        transition: 'width 800ms cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
      }}>
        {animated > 3 && (
          <div style={{
            position: 'absolute', right: '-2px', top: '50%',
            transform: 'translateY(-50%)',
            width: '4px', height: '12px',
            background: '#ffffff',
            borderRadius: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        )}
      </div>
    </div>
  );
}
