import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Camera, Type, X } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../../services/api'

const MODES = { IMAGE: 'image', TEXT: 'text' }
const STAGES = { PICK: 'pick', RESULT: 'result', FOLLOWUP: 'followup', DONE: 'done' }

export default function CheatMeal() {
  const navigate = useNavigate()
  const fileRef = useRef()

  const [mode, setMode] = useState(MODES.IMAGE)
  const [stage, setStage] = useState(STAGES.PICK)
  const [loading, setLoading] = useState(false)

  // Image mode state
  const [images, setImages] = useState([])   // [{file, preview}]

  // Text mode state
  const [desc, setDesc] = useState('')
  const [notes, setNotes] = useState('')

  // Result state
  const [result, setResult] = useState(null)  // CheatMealSerializer data
  const [followUp, setFollowUp] = useState(null) // {cheat_meal_id, question}
  const [answer, setAnswer] = useState('')

  // ── Image helpers ──────────────────────────────────────────
  const onFileChange = (e) => {
    const files = Array.from(e.target.files || [])
    const picked = files.slice(0, 2).map(f => ({
      file: f, preview: URL.createObjectURL(f)
    }))
    setImages(picked)
  }

  const removeImage = (i) =>
    setImages(p => p.filter((_, idx) => idx !== i))

  // ── Submit image ──────────────────────────────────────────
  const submitImage = async () => {
    if (!images.length) { toast.error('Pick at least 1 photo'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      images.forEach(img => fd.append('images', img.file))
      if (notes) fd.append('notes', notes)

      const res = await API.post('/cheat-meals/image/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      setStage(STAGES.RESULT)
      toast.success('Cheat meal logged! 🍔')
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to analyze image')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit manual ─────────────────────────────────────────
  const submitManual = async () => {
    if (!desc.trim()) { toast.error('Describe what you ate'); return }
    setLoading(true)
    try {
      const res = await API.post('/cheat-meals/manual/', {
        manual_description: desc,
        notes: notes || undefined,
      })

      if (res.status === 202) {
        // AI needs more info
        setFollowUp({
          cheat_meal_id: res.data.cheat_meal_id,
          question: res.data.follow_up_question,
        })
        setStage(STAGES.FOLLOWUP)
      } else {
        setResult(res.data)
        setStage(STAGES.RESULT)
        toast.success('Cheat meal logged! 🍔')
      }
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to log meal')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit follow-up answer ───────────────────────────────
  const submitFollowUp = async () => {
    if (!answer.trim()) { toast.error('Please answer the question'); return }
    setLoading(true)
    try {
      const res = await API.post('/cheat-meals/manual/followup/', {
        cheat_meal_id: followUp.cheat_meal_id,
        answer: answer,
      })
      setResult(res.data)
      setStage(STAGES.RESULT)
      toast.success('Cheat meal logged! 🍔')
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to submit answer')
    } finally {
      setLoading(false)
    }
  }

  // ── Render ────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button onClick={() => stage !== STAGES.PICK ? setStage(STAGES.PICK) : navigate(-1)}
          style={s.backBtn}>
          <ChevronLeft size={20} color="var(--text-primary)" />
        </button>
        <p style={s.title}>Log Cheat Meal</p>
        <div style={{ width: 38 }} />
      </div>

      {/* Banner */}
      <div style={s.banner}>
        <span style={{ fontSize: '2.4rem' }}>🍔</span>
        <div>
          <p style={s.bannerTitle}>No guilt, just honesty!</p>
          <p style={s.bannerSub}>AI adjusts tomorrow's plan automatically</p>
        </div>
      </div>

      {/* ── PICK stage ── */}
      {stage === STAGES.PICK && (
        <>
          {/* Mode tabs */}
          <div style={s.modeTabs}>
            <button
              onClick={() => setMode(MODES.IMAGE)}
              style={{ ...s.modeTab, ...(mode === MODES.IMAGE ? s.modeTabActive : {}) }}>
              <Camera size={15} /> Photo
            </button>
            <button
              onClick={() => setMode(MODES.TEXT)}
              style={{ ...s.modeTab, ...(mode === MODES.TEXT ? s.modeTabActive : {}) }}>
              <Type size={15} /> Manual
            </button>
          </div>

          {/* ── IMAGE sub-mode ── */}
          {mode === MODES.IMAGE && (
            <div style={s.card}>
              <input
                ref={fileRef} type="file"
                accept="image/*" multiple
                style={{ display: 'none' }}
                onChange={onFileChange}
              />

              {/* Preview grid or upload zone */}
              {images.length === 0 ? (
                <button onClick={() => fileRef.current?.click()} style={s.uploadZone}>
                  <div style={s.cameraCircle}>
                    <Camera size={30} color="var(--accent)" />
                  </div>
                  <p style={s.uploadTitle}>Take photo or upload</p>
                  <p style={s.uploadSub}>Up to 2 images • AI detects the food</p>
                  <div style={s.uploadHint}>Tap to open camera / gallery</div>
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 10 }}>
                  {images.map((img, i) => (
                    <div key={i} style={{ position: 'relative', flex: 1 }}>
                      <img src={img.preview} alt="food"
                        style={{
                          width: '100%', height: 160,
                          objectFit: 'cover', borderRadius: 12, display: 'block'
                        }} />
                      <button onClick={() => removeImage(i)} style={s.removeBtn}>
                        <X size={12} color="#fff" />
                      </button>
                    </div>
                  ))}
                  {images.length < 2 && (
                    <button onClick={() => fileRef.current?.click()} style={s.addMoreBtn}>
                      <Camera size={20} color="var(--text-faint)" />
                      <span style={{
                        fontSize: '0.7rem', color: 'var(--text-faint)',
                        fontFamily: 'Satoshi, sans-serif', marginTop: 4
                      }}>Add 2nd photo</span>
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              {images.length > 0 && (
                <div style={{ marginTop: 14 }}>
                  <label style={s.label}>Notes (optional)</label>
                  <input style={s.input} placeholder="e.g. Birthday party..."
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── TEXT sub-mode ── */}
          {mode === MODES.TEXT && (
            <div style={s.card}>
              <label style={s.label}>What did you eat? *</label>
              <textarea style={{ ...s.input, minHeight: 90, resize: 'vertical' }}
                placeholder="e.g. 2 slices of pizza, a can of Coke and some garlic bread..."
                value={desc} onChange={e => setDesc(e.target.value)}
                autoFocus />

              <label style={{ ...s.label, marginTop: 14 }}>Notes (optional)</label>
              <input style={s.input}
                placeholder="e.g. Late night craving, college canteen..."
                value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={mode === MODES.IMAGE ? submitImage : submitManual}
            disabled={loading || (mode === MODES.IMAGE ? !images.length : !desc.trim())}
            style={{
              ...s.submitBtn,
              opacity: loading || (mode === MODES.IMAGE ? !images.length : !desc.trim()) ? 0.4 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : mode === MODES.IMAGE ? '📸 Analyze & Log' : '✍️ Analyze & Log'}
          </button>
        </>
      )}

      {/* ── FOLLOW-UP stage ── */}
      {stage === STAGES.FOLLOWUP && followUp && (
        <>
          <div style={s.followUpCard}>
            <div style={s.aiAvatar}>🤖</div>
            <p style={s.followUpQ}>{followUp.question}</p>
          </div>
          <div style={s.card}>
            <label style={s.label}>Your answer</label>
            <input style={s.input}
              placeholder="Type your answer..."
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              autoFocus />
          </div>
          <button
            onClick={submitFollowUp}
            disabled={loading || !answer.trim()}
            style={{
              ...s.submitBtn,
              opacity: loading || !answer.trim() ? 0.4 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : 'Submit Answer →'}
          </button>
        </>
      )}

      {/* ── RESULT stage ── */}
      {stage === STAGES.RESULT && result && (
        <>
          <div style={s.resultCard}>
            <div style={s.resultCheck}>✅</div>
            <p style={s.resultTitle}>{result.food_name || 'Cheat meal logged'}</p>
            {result.ai_estimated_calories > 0 && (
              <p style={s.resultCals}>
                ~{result.user_edited_calories || result.ai_estimated_calories} kcal
              </p>
            )}
            {result.ai_confidence && (
              <div style={{
                ...s.confidenceBadge,
                background: result.ai_confidence > 0.7
                  ? 'rgba(100,200,80,0.12)' : 'rgba(255,200,0,0.12)',
                color: result.ai_confidence > 0.7
                  ? 'var(--success)' : 'var(--warning)',
              }}>
                {result.ai_confidence > 0.7 ? '🎯 High confidence'
                  : result.ai_confidence > 0.4 ? '📊 Medium confidence'
                    : '⚠️ Low confidence estimate'}
              </div>
            )}
            <p style={s.resultSub}>
              Plan will be adjusted automatically for the next meal slot.
            </p>
          </div>

          <button onClick={() => navigate(-1)} style={s.submitBtn}>
            ← Back to Nutrition
          </button>
        </>
      )}

      <div style={{ height: 8 }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────
const s = {
  page: { display: 'flex', flexDirection: 'column', gap: 14, padding: 16 },
  header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 38, height: 38, background: 'var(--bg-surface)',
    border: '1px solid var(--border)', borderRadius: 10,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer'
  },
  title: {
    fontFamily: 'Clash Display, sans-serif', fontSize: '1.1rem',
    fontWeight: 600, color: 'var(--text-primary)'
  },
  banner: {
    display: 'flex', alignItems: 'center', gap: 16,
    background: 'rgba(255,77,77,0.06)',
    border: '1px solid rgba(255,77,77,0.2)',
    borderRadius: 18, padding: '16px'
  },
  bannerTitle: {
    fontFamily: 'Clash Display, sans-serif', fontSize: '1rem',
    fontWeight: 600, color: 'var(--text-primary)'
  },
  bannerSub: {
    fontSize: '0.8rem', color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif', marginTop: 4
  },
  modeTabs: {
    display: 'flex', gap: 8,
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 12, padding: 4
  },
  modeTab: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 6,
    padding: '9px 0', borderRadius: 9, border: 'none',
    background: 'none', color: 'var(--text-faint)',
    fontSize: '0.875rem', fontWeight: 600,
    fontFamily: 'Satoshi, sans-serif', cursor: 'pointer',
    transition: 'all 180ms ease'
  },
  modeTabActive: {
    background: 'var(--bg-surface-2)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
  },
  card: {
    background: 'var(--bg-surface)', border: '1px solid var(--border)',
    borderRadius: 18, padding: '16px'
  },
  uploadZone: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '36px 16px',
    background: 'none', border: '2px dashed var(--border)',
    borderRadius: 14, cursor: 'pointer'
  },
  cameraCircle: {
    width: 64, height: 64,
    background: 'rgba(200,241,53,0.1)',
    border: '2px solid rgba(200,241,53,0.3)',
    borderRadius: '50%', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  },
  uploadTitle: {
    fontFamily: 'Clash Display, sans-serif', fontSize: '1rem',
    fontWeight: 600, color: 'var(--text-primary)', marginTop: 12
  },
  uploadSub: {
    fontSize: '0.78rem', color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif', marginTop: 6
  },
  uploadHint: {
    marginTop: 14, fontSize: '0.73rem', color: 'var(--text-faint)',
    fontFamily: 'Satoshi, sans-serif',
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: 999, padding: '5px 14px'
  },
  removeBtn: {
    position: 'absolute', top: 6, right: 6,
    width: 24, height: 24, background: 'rgba(0,0,0,0.6)',
    border: 'none', borderRadius: '50%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  addMoreBtn: {
    flex: 1, minHeight: 160, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg-surface-2)',
    border: '2px dashed var(--border)',
    borderRadius: 12, cursor: 'pointer', gap: 4
  },
  label: {
    display: 'block', fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--text-faint)', letterSpacing: '0.5px',
    textTransform: 'uppercase', fontFamily: 'Satoshi, sans-serif',
    marginBottom: 8
  },
  input: {
    width: '100%', background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)', borderRadius: 12,
    padding: '12px 14px', color: 'var(--text-primary)',
    fontFamily: 'Satoshi, sans-serif', fontSize: '0.9375rem',
    outline: 'none'
  },
  submitBtn: {
    width: '100%', padding: 15,
    background: 'var(--error)', border: 'none',
    borderRadius: 14, color: '#fff',
    fontSize: '0.9375rem', fontWeight: 700,
    fontFamily: 'Satoshi, sans-serif',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    transition: 'opacity 180ms ease', cursor: 'pointer'
  },
  followUpCard: {
    background: 'rgba(200,241,53,0.06)',
    border: '1px solid rgba(200,241,53,0.2)',
    borderRadius: 18, padding: '20px 16px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12
  },
  aiAvatar: { fontSize: '2.5rem' },
  followUpQ: {
    fontFamily: 'Satoshi, sans-serif', fontSize: '0.95rem',
    color: 'var(--text-primary)', textAlign: 'center',
    lineHeight: 1.5
  },
  resultCard: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: 20, padding: '28px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 10
  },
  resultCheck: { fontSize: '3rem' },
  resultTitle: {
    fontFamily: 'Clash Display, sans-serif',
    fontSize: '1.2rem', fontWeight: 700,
    color: 'var(--text-primary)', textAlign: 'center'
  },
  resultCals: {
    fontSize: '2rem', fontWeight: 800,
    color: 'var(--accent)',
    fontFamily: 'Clash Display, sans-serif'
  },
  confidenceBadge: {
    fontSize: '0.78rem', fontFamily: 'Satoshi, sans-serif',
    fontWeight: 600, padding: '6px 14px',
    borderRadius: 999, border: '1px solid transparent'
  },
  resultSub: {
    fontSize: '0.8rem', color: 'var(--text-faint)',
    fontFamily: 'Satoshi, sans-serif', textAlign: 'center',
    marginTop: 4
  },
}