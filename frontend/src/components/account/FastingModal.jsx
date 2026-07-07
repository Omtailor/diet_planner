import { S } from '../../utils/account/styles'
import { ALL_DAYS, FONT } from '../../utils/account/constants'

export default function FastingModal({ draft, setDraft, onClose, onSave, saving }) {
  return (
    <div>
      <p style={S.modalDesc}>Update your fasting schedule. Plans will respect these on next generation.</p>

      <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input
          type="checkbox"
          checked={!!draft?.is_fasting}
          onChange={(e) => setDraft((current) => ({ ...current, is_fasting: e.target.checked }))}
        />
        <span style={{ fontFamily: FONT, fontWeight: 700, color: 'var(--color-text)' }}>
          I observe fasting 🙏
        </span>
      </label>

      {draft?.is_fasting && (
        <>
          <label style={S.fieldLabel}>Fasting Days</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
            {ALL_DAYS.map((day) => {
              const selectedDays = draft?.fasting_days
                ? draft.fasting_days.split(',').map((value) => value.trim().toLowerCase()).filter(Boolean)
                : []
              const isSelected = selectedDays.includes(day.toLowerCase())
              const toggleDay = () => {
                const updated = isSelected
                  ? selectedDays.filter((value) => value !== day.toLowerCase())
                  : [...selectedDays, day.toLowerCase()]
                setDraft((current) => ({ ...current, fasting_days: updated.join(',') }))
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={toggleDay}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 999,
                    fontSize: '0.85rem',
                    fontFamily: FONT,
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    border: `1px solid ${isSelected ? 'var(--color-accent)' : 'rgba(0,0,0,0.1)'}`,
                    background: isSelected ? 'var(--color-accent)' : 'rgba(0,0,0,0.03)',
                    color: isSelected ? '#fff' : 'var(--color-text-muted)',
                    transition: 'all 180ms ease',
                    transform: isSelected ? 'scale(1.04)' : 'scale(1)',
                  }}
                >
                  {isSelected && '✓ '}{day}
                </button>
              )
            })}
          </div>
          {draft?.fasting_days && (
            <p style={{ fontSize: '0.75rem', color: 'var(--color-accent)', fontWeight: 600, fontFamily: FONT, marginBottom: 16 }}>
              {draft.fasting_days.split(',').filter(Boolean).length} day(s) selected
            </p>
          )}

          <label style={{ ...S.fieldLabel, marginTop: 8 }}>Fasting Type (e.g. Ekadashi, Navratri)</label>
          <input
            style={S.modalInput}
            placeholder="Type of fast"
            value={draft?.fasting_type ?? ''}
            onChange={(e) => setDraft((current) => ({ ...current, fasting_type: e.target.value }))}
          />
        </>
      )}

      <div style={S.modalActions}>
        <button type="button" onClick={onClose} style={S.modalSecondaryBtn}>Cancel</button>
        <button type="button" disabled={saving} style={S.modalPrimaryBtn} onClick={onSave}>
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
