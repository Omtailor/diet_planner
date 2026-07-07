import { S } from '../../utils/account/styles'

export default function PersonalInfoModal({ draft, setDraft, onClose, onSave, saving }) {
  return (
    <div>
      <p style={S.modalDesc}>Update your basic profile info.</p>

      <label style={S.fieldLabel}>Name</label>
      <input
        type="text"
        value={draft?.name || ''}
        disabled
        style={{ ...S.modalInput, opacity: 0.6, cursor: 'not-allowed' }}
      />

      <label style={{ ...S.fieldLabel, marginTop: '14px' }}>Age</label>
      <input
        type="number"
        inputMode="numeric"
        placeholder="e.g. 25"
        value={draft?.age ?? ''}
        onChange={(e) => setDraft((current) => ({ ...current, age: e.target.value }))}
        style={S.modalInput}
      />

      <label style={{ ...S.fieldLabel, marginTop: '14px' }}>City</label>
      <input
        type="text"
        placeholder="e.g. Mumbai"
        value={draft?.city ?? ''}
        onChange={(e) => setDraft((current) => ({ ...current, city: e.target.value }))}
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
