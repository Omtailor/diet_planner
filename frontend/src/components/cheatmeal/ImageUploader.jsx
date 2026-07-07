import { useRef, useEffect } from 'react'
import { Camera, X } from 'lucide-react'
import { FONT, GLASS_WHITE } from '../../utils/cheatMeal/constants'

/**
 * ImageUploader
 *
 * Props:
 *   images   – [{file, preview}]
 *   notes    – string
 *   onChange – (newImages: [{file, preview}]) => void
 *   onNotesChange – (value: string) => void
 */
export default function ImageUploader({ images, notes, onChange, onNotesChange }) {
  const fileRef = useRef()

  // Revoke object URLs when previews are replaced or component unmounts
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    // Revoke any existing previews before replacing
    images.forEach(img => URL.revokeObjectURL(img.preview))
    const picked = files.slice(0, 2).map(f => ({
      file: f,
      preview: URL.createObjectURL(f),
    }))
    onChange(picked)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const removeImage = (i) => {
    URL.revokeObjectURL(images[i].preview)
    onChange(images.filter((_, idx) => idx !== i))
  }

  return (
    <div style={{ ...GLASS_WHITE, borderRadius: 24, padding: '20px' }}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      {/* Upload zone or preview grid */}
      {images.length === 0 ? (
        <button onClick={() => fileRef.current?.click()} style={s.uploadZone}>
          <div style={s.cameraCircle}>
            <Camera size={30} color="#FF3B30" />
          </div>
          <p style={s.uploadTitle}>Take photo or upload</p>
          <p style={s.uploadSub}>Up to 2 images • AI detects the food</p>
          <div style={s.uploadHint}>Tap to open camera / gallery</div>
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 12 }}>
          {images.map((img, i) => (
            <div key={i} style={{ position: 'relative', flex: 1 }}>
              <img
                src={img.preview}
                alt="food"
                style={{
                  width: '100%', height: 160,
                  objectFit: 'cover', borderRadius: '16px', display: 'block',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              />
              <button onClick={() => removeImage(i)} style={s.removeBtn}>
                <X size={14} color="#fff" />
              </button>
            </div>
          ))}
          {images.length < 2 && (
            <button onClick={() => fileRef.current?.click()} style={s.addMoreBtn}>
              <Camera size={24} color="var(--color-text-faint)" />
              <span style={{
                fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
                fontFamily: FONT, marginTop: 6,
              }}>Add 2nd photo</span>
            </button>
          )}
        </div>
      )}

      {/* Notes – only shown after at least one image is selected */}
      {images.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <label style={s.label}>Notes (optional)</label>
          <input
            style={s.input}
            placeholder="e.g. Birthday party slice..."
            value={notes}
            onChange={e => onNotesChange(e.target.value)}
          />
        </div>
      )}
    </div>
  )
}

const s = {
  uploadZone: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '40px 16px',
    background: 'rgba(255,255,255,0.4)',
    border: '2px dashed rgba(0,0,0,0.1)',
    borderRadius: 20, cursor: 'pointer',
    transition: 'background 200ms ease',
  },
  cameraCircle: {
    width: 64, height: 64,
    background: 'rgba(255, 59, 48, 0.1)',
    borderRadius: '20px', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
  },
  uploadTitle: {
    fontFamily: FONT, fontSize: '1.1rem',
    fontWeight: 800, color: 'var(--color-text)', marginTop: 16,
  },
  uploadSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: 6,
  },
  uploadHint: {
    marginTop: 16, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600,
    fontFamily: FONT,
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: 999, padding: '6px 16px',
  },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    border: 'none', borderRadius: '50%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  addMoreBtn: {
    flex: 1, minHeight: 160, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.4)',
    border: '2px dashed rgba(0,0,0,0.1)',
    borderRadius: 16, cursor: 'pointer', gap: 6,
  },
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--color-text-muted)', letterSpacing: '0.5px',
    textTransform: 'uppercase', fontFamily: FONT,
    marginBottom: 10,
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16,
    padding: '14px 16px', color: 'var(--color-text)',
    fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
    outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)',
  },
}
