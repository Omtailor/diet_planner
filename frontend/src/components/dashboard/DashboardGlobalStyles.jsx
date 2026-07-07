/**
 * Injects global CSS keyframes and utility classes needed by the Dashboard.
 */
export default function DashboardGlobalStyles() {
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
      }
      @keyframes spin        { to { transform: rotate(360deg) } }
      @keyframes shimmer     { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      @keyframes dashFadeUp  { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes mealSlideIn { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
      @keyframes badgePulse  { 0%,100%{opacity:1} 50%{opacity:0.6} }
      .dash-fadeUp   { animation: dashFadeUp 0.5s cubic-bezier(0.16,1,0.3,1) both }
      .dash-delay-1  { animation-delay: 0.08s }
      .dash-delay-2  { animation-delay: 0.16s }
      .dash-delay-3  { animation-delay: 0.24s }
      .meal-card:hover  { background: rgba(255,255,255,0.85) !important; transform: translateX(3px) }
      .meal-card:active { transform: scale(0.98) }
      .quick-tile:hover  { transform: translateY(-5px) scale(1.02); box-shadow: 0 12px 28px rgba(0,0,0,0.08); background: rgba(255,255,255,0.85) !important }
      .quick-tile:active { transform: scale(0.97) }
      .spin { animation: spin 0.8s linear infinite }
      .week-strip::-webkit-scrollbar { display: none }
      .glass-input:focus { outline: none; border-color: var(--color-accent) !important; box-shadow: 0 0 0 3px rgba(52,199,89,0.15) !important }
    `}</style>
  )
}
