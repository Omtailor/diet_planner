import { S } from '../../utils/account/styles'
import { FONT } from '../../utils/account/constants'

export default function GymActivityModal({ draft, setDraft, onClose, onSave, saving, showHealthTimeWarning }) {
  return (
    <div>
      <p style={S.modalDesc}>
        Update your gym schedule and daily health time.
        {showHealthTimeWarning && (
          <span style={{ color: 'rgba(255,149,0,0.9)', fontWeight: 700 }}>
            {' '}Your health time is currently 0 — training plans won't generate until this is set.
          </span>
        )}
      </p>

      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
        <input
          type="checkbox"
          checked={!!draft?.has_gym}
          onChange={(e) => setDraft((current) => ({ ...current, has_gym: e.target.checked }))}
        />
        <span style={{ fontFamily: FONT, fontWeight: 700, color: 'var(--color-text)' }}>
          I have a gym routine
        </span>
      </label>

      <label style={{ ...S.fieldLabel, marginTop: '16px' }}>Health Time (Minutes)</label>
      <input
        type="number"
        inputMode="numeric"
        placeholder="e.g. 30"
        value={draft?.health_time_minutes ?? ''}
        onChange={(e) => setDraft((current) => ({ ...current, health_time_minutes: e.target.value }))}
        style={S.modalInput}
      />
      {(draft?.health_time_minutes === 0 || draft?.health_time_minutes === '0') && (
        <p style={{
          fontSize: '0.78rem', color: 'rgba(255,149,0,0.9)', fontWeight: 600,
          fontFamily: FONT, marginTop: '6px',
        }}>
          ⚠️ Setting this to 0 will disable training plan generation
        </p>
      )}

      <div style={S.modalActions}>
        <button type="button" onClick={onClose} style={S.modalSecondaryBtn}>
          Cancel
        </button>
        <button type="button" onClick={onSave} disabled={saving} style={S.modalPrimaryBtn}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
