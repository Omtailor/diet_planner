import { S } from '../../utils/account/styles'

export default function GoalsDietModal({ draft, setDraft, onClose, onSave, saving, goalOptions, dietOptions }) {
  return (
    <div>
      <p style={S.modalDesc}>Update your goal and diet preference.</p>

      <label style={S.fieldLabel}>Goal</label>
      <select
        value={draft?.goal ?? 'maintenance'}
        onChange={(e) => setDraft((current) => ({ ...current, goal: e.target.value }))}
        style={S.modalSelect}
      >
        {goalOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

      <label style={{ ...S.fieldLabel, marginTop: '14px' }}>Diet Preference</label>
      <select
        value={draft?.diet_preference ?? 'veg'}
        onChange={(e) => setDraft((current) => ({ ...current, diet_preference: e.target.value }))}
        style={S.modalSelect}
      >
        {dietOptions.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>

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
