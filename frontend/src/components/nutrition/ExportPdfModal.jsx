import { X } from 'lucide-react'
import { GLASS_WHITE, FONT } from '../../utils/nutrition/constants'

export default function ExportPdfModal({ 
  show, 
  onClose, 
  exportStartDate, 
  setExportStartDate, 
  exportEndDate, 
  setExportEndDate, 
  onExport 
}) {
  if (!show) return null

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 999,
      background: 'rgba(0,0,0,0.4)',
      display: 'flex', alignItems: 'flex-end',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      animation: 'fadeUp 0.3s ease-out',
    }} onClick={onClose}>
      <div style={{
        width: '100%',
        maxHeight: '90dvh',
        overflowY: 'auto',
        ...GLASS_WHITE,
        background: 'rgba(255,255,255,0.95)',
        borderRadius: '32px 32px 0 0',
        padding: '24px',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
      }} onClick={e => e.stopPropagation()}>

        {/* Handle bar */}
        <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
              Export as PDF
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4 }}>
              Choose the date range to include
            </p>
          </div>
          <button onClick={onClose} style={{
            background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
            width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
          }}>
            <X size={20} color="var(--color-text-muted)" />
          </button>
        </div>

        {/* Date Pickers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
          {/* Start Date */}
          <div>
            <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              Start Date
            </p>
            <input
              type="date"
              value={exportStartDate}
              onChange={e => setExportStartDate(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16, fontFamily: FONT,
                fontSize: '1rem', fontWeight: 600,
                color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>

          {/* End Date */}
          <div>
            <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
              End Date
            </p>
            <input
              type="date"
              value={exportEndDate}
              min={exportStartDate}
              onChange={e => setExportEndDate(e.target.value)}
              style={{
                width: '100%', padding: '14px 16px',
                background: 'rgba(0,0,0,0.04)',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16, fontFamily: FONT,
                fontSize: '1rem', fontWeight: 600,
                color: 'var(--color-text)', outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Days count pill */}
        {exportStartDate && exportEndDate && (
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <span style={{
              display: 'inline-block',
              background: 'rgba(34,197,94,0.12)',
              color: 'var(--color-accent)',
              fontFamily: FONT, fontWeight: 700,
              fontSize: '0.85rem', borderRadius: 999,
              padding: '6px 16px',
            }}>
              {Math.max(0, Math.round((new Date(exportEndDate) - new Date(exportStartDate)) / (1000 * 60 * 60 * 24)) + 1)} days selected
            </span>
          </div>
        )}

        {/* Export Button */}
        <button
          onClick={onExport}
          disabled={!exportStartDate || !exportEndDate || exportStartDate > exportEndDate}
          style={{
            width: '100%', padding: '16px',
            background: exportStartDate > exportEndDate ? 'rgba(0,0,0,0.1)' : 'var(--color-accent)',
            border: 'none', borderRadius: 16,
            color: exportStartDate > exportEndDate ? 'var(--color-text-muted)' : '#ffffff',
            fontFamily: FONT, fontWeight: 800, fontSize: '1rem',
            cursor: exportStartDate > exportEndDate ? 'not-allowed' : 'pointer',
            boxShadow: exportStartDate > exportEndDate ? 'none' : '0 8px 24px rgba(34,199,89,0.3)',
            transition: 'all 180ms ease',
          }}
        >
          Export PDF
        </button>
      </div>
    </div>
  )
}
