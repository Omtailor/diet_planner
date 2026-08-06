export default function ProgressSteps({ steps, activeStep, done, FONT }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: 'min(340px, 88vw)',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      padding: '0 16px',
      marginBottom: 'clamp(8px, 1.5vh, 16px)',
    }}>
      {steps.map((step, i) => {
        const isActive = i === activeStep && !done;
        const isCompleted = i < activeStep || done;
        const isPending = i > activeStep && !done;

        return (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '12px 16px',
              borderRadius: 14,
              background: isActive
                ? 'rgba(58,158,95,0.10)'
                : isCompleted
                  ? 'rgba(58,158,95,0.05)'
                  : 'rgba(255,255,255,0.45)',
              border: `1.5px solid ${isActive ? 'rgba(58,158,95,0.35)'
                : isCompleted ? 'rgba(58,158,95,0.18)'
                  : 'rgba(0,0,0,0.05)'
                }`,
              opacity: isPending ? 0.38 : 1,
              transform: isActive ? 'translateX(4px)' : 'translateX(0)',
              transition: 'background 500ms ease, border-color 500ms ease, opacity 500ms ease, transform 500ms cubic-bezier(0.34,1.56,0.64,1)',
            }}
          >
            <span style={{
              fontSize: '1.05rem',
              flexShrink: 0,
              opacity: isPending ? 0.5 : 1,
              transition: 'opacity 400ms ease',
            }}>
              {step.emoji}
            </span>

            <span style={{
              fontFamily: FONT,
              fontSize: 'clamp(0.75rem, 2.3vw, 0.85rem)',
              fontWeight: isActive ? 700 : isCompleted ? 600 : 500,
              color: isActive
                ? '#0f1f12'
                : isCompleted
                  ? '#3a7a50'
                  : '#8aaa92',
              flex: 1,
              lineHeight: 1.35,
              transition: 'color 400ms ease, font-weight 300ms ease',
            }}>
              {step.text}
            </span>

            <div style={{ flexShrink: 0, width: 24, height: 24 }}>
              {isCompleted ? (
                <div style={{
                  width: 24, height: 24,
                  borderRadius: '50%',
                  background: '#3a9e5f',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'checkScale 0.45s cubic-bezier(0.34,1.56,0.64,1) both',
                }}>
                  <svg width="11" height="9" viewBox="0 0 11 9" fill="none">
                    <path
                      d="M1.5 4.5L4.5 7.5L9.5 1.5"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ) : isActive ? (
                <div style={{
                  width: 22, height: 22,
                  borderRadius: '50%',
                  border: '2.5px solid rgba(58,158,95,0.2)',
                  borderTopColor: '#3a9e5f',
                  animation: 'smoothSpin 0.75s linear infinite',
                  willChange: 'transform',
                }} />
              ) : (
                <div style={{
                  width: 10, height: 10,
                  margin: '7px auto',
                  borderRadius: '50%',
                  background: 'rgba(0,0,0,0.1)',
                }} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  )
}
