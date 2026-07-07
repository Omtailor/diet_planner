import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'
import { FONT } from '../../utils/dashboard/constants'
import {
  accentBtn, modalOverlay, modalSheet, modalHandle, inputStyle,
} from '../../utils/dashboard/styles'

/**
 * Bottom-sheet modal for updating the user's current weight.
 *
 * Props:
 *  current  – current weight value (number or undefined)
 *  onClose  – called when the modal should be dismissed
 *  onSave   – called after a successful save (e.g. to re-fetch profile)
 */
export default function WeightModal({ current, onClose, onSave }) {
  const [val, setVal]       = useState(current || '')
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!val || isNaN(val)) { toast.error('Enter a valid weight'); return }
    setLoading(true)
    try {
      await authService.updateProfile({ weight_kg: parseFloat(val) })
      toast.success('Weight updated! 📊')
      onSave()
      onClose()
    } catch {
      toast.error('Failed to update weight')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={modalOverlay} onClick={onClose}>
      <div style={modalSheet} onClick={e => e.stopPropagation()}>
        <div style={modalHandle} />
        <h3 style={{
          fontFamily: FONT,
          fontSize: '1.3rem', fontWeight: 700,
          color: 'var(--color-text)', marginBottom: '6px',
        }}>Update Weight</h3>
        <p style={{
          fontSize: '0.875rem', color: 'var(--color-text-muted)',
          fontFamily: FONT, marginBottom: '20px',
        }}>Keep your plan accurate 📈</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <input
            type="number"
            value={val}
            autoFocus
            onChange={e => setVal(e.target.value)}
            placeholder="e.g. 68.5"
            style={inputStyle}
            className="glass-input"
          />
          <span style={{
            fontSize: '1rem', fontWeight: 600,
            color: 'var(--color-text-muted)',
            fontFamily: FONT,
          }}>kg</span>
        </div>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            ...accentBtn,
            width: '100%', padding: '14px',
            borderRadius: '12px', fontSize: '1rem',
            opacity: loading ? 0.7 : 1,
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px',
          }}
        >
          {loading
            ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
            : 'Save Weight'}
        </button>
      </div>
    </div>
  )
}
