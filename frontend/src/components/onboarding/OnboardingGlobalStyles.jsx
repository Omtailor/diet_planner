// Scoped CSS injected as a <style> tag.
// Preserves all animations, transitions, hover effects, and responsive rules
// exactly as they were in the original Onboarding.jsx inline <style> block.

function OnboardingGlobalStyles() {
  return (
    <style>{`
      @keyframes spin { to { transform: rotate(360deg); } }

      /* Crossfade between steps */
      @keyframes fadeInBg {
        from { opacity: 0; transform: scale(1.02); }
        to   { opacity: 1; transform: scale(1); }
      }

      /* Cinematic Ken Burns - Slow, continuous push-in and pan.
         We create two variations so the camera direction changes on every step.
      */
      @keyframes kenBurnsOdd {
        0%   { transform: scale(1.0) translate(0%, 0%); }
        100% { transform: scale(1.8) translate(-2%, -1.5%); }
      }

      @keyframes kenBurnsEven {
        0%   { transform: scale(1.0) translate(0%, 0%); }
        100% { transform: scale(1.8) translate(1.5%, 2%); }
      }

      /* Apply alternating animations. 'infinite alternate' ensures if a user
         lingers on a step for >30s, it slowly reverses instead of snapping. */
      .ken-burns-step-1,
      .ken-burns-step-3,
      .ken-burns-step-5 {
        animation:
          fadeInBg 1s cubic-bezier(0.16, 1, 0.3, 1) both,
          kenBurnsOdd 30s linear infinite alternate;
        will-change: transform, opacity;
      }

      .ken-burns-step-2,
      .ken-burns-step-4,
      .ken-burns-step-6 {
        animation:
          fadeInBg 1s cubic-bezier(0.16, 1, 0.3, 1) both,
          kenBurnsEven 30s linear infinite alternate;
        will-change: transform, opacity;
      }

      /* Inputs */
      .glass-input:focus {
        outline: none;
        border-color: var(--color-accent) !important;
        box-shadow: 0 0 0 3px var(--color-accent-glow) !important;
        background: rgba(255,255,255,0.80) !important;
      }
      .glass-input::placeholder { color: var(--color-text-faint); }

      /* Next button hover */
      .next-btn:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 8px 24px var(--color-accent-glow);
        background: var(--color-accent-hover) !important;
      }
      .next-btn:active:not(:disabled) { transform: translateY(0); }

      /* Loading sentence transition */
      .loading-sentence {
        transition: opacity 400ms ease, transform 400ms ease;
      }

      @media (max-width: 480px) {
        .onboarding-inner { padding: 0 !important; }
      }
    `}</style>
  )
}

export default OnboardingGlobalStyles
