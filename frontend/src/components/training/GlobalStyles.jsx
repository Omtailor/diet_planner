/**
 * Injects global CSS keyframes and utility class definitions
 * needed by the training page (skeletons, spin, fadeUp, etc.).
 */
export default function GlobalStyles() {
  return (
    <style>{`
      :root {
        --color-accent: #34C759;
        --color-text: #1C1C1E;
        --color-text-muted: #636366;
        --color-text-faint: #8E8E93;
      }
      body, #root {
        background: #F2F2F7 !important;
        color: var(--color-text);
        margin: 0;
      }

      .week-strip::-webkit-scrollbar { display: none; }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes regenPulse {
        0%   { box-shadow: 0 0 0 0 rgba(52,199,89,0.6); }
        70%  { box-shadow: 0 0 0 16px rgba(52,199,89,0); }
        100% { box-shadow: 0 0 0 0 rgba(52,199,89,0); }
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(16px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50%       { transform: scale(1.15); }
      }
      @keyframes shimmer {
        0%   { background-position: -200% 0; }
        100% { background-position: 200% 0; }
      }

      .skeleton {
        background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
        background-size: 200% 100%;
        animation: shimmer 1.2s ease-in-out infinite;
      }

      .spin        { animation: spin 0.8s linear infinite; }
      .spin-ring   { animation: spin 0.9s linear infinite; }
      .regen-pulse { animation: regenPulse 0.6s ease-out; }
      .day-detail-enter { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    `}</style>
  );
}
