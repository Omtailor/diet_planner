import { S } from '../../utils/account/styles'

export default function BodyStatsModal({ draft, setDraft, onClose, onSave, saving }) {
  return (
    <div>
      <p style={S.modalDesc}>Update weight and height. BMI updates automatically.</p>

      <label style={S.fieldLabel}>Weight (kg)</label>
      <input
        type="number"
        inputMode="decimal"
        placeholder="e.g. 68.5"
        value={draft?.weight_kg ?? ''}
        onChange={(e) => setDraft((current) => ({ ...current, weight_kg: e.target.value }))}
        style={S.modalInput}
      />

      <label style={{ ...S.fieldLabel, marginTop: '14px' }}>Height (cm)</label>
      <input
        type="number"
        inputMode="decimal"
        placeholder="e.g. 175"
        value={draft?.height_cm ?? ''}
        onChange={(e) => setDraft((current) => ({ ...current, height_cm: e.target.value }))}
        style={S.modalInput}
      />

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
