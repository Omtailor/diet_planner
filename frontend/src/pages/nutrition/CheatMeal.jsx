import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Camera, Type, X } from 'lucide-react'
import toast from 'react-hot-toast'
import API from '../../services/api'

const MODES = { IMAGE: 'image', TEXT: 'text' }
const STAGES = { PICK: 'pick', RESULT: 'result', FOLLOWUP: 'followup', DONE: 'done' }

// ─── Style Tokens ──────────────────────────────────────────────
const FONT = "'General Sans', sans-serif";

const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

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
          <ChevronLeft size={20} color="var(--color-text)" />
        </button>
        <p style={s.title}>Log Cheat Meal</p>
        <div style={{ width: 44 }} /> {/* Balance back button width */}
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
              <Camera size={16} /> Photo
            </button>
            <button
              onClick={() => setMode(MODES.TEXT)}
              style={{ ...s.modeTab, ...(mode === MODES.TEXT ? s.modeTabActive : {}) }}>
              <Type size={16} /> Manual
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
                      <img src={img.preview} alt="food"
                        style={{
                          width: '100%', height: 160,
                          objectFit: 'cover', borderRadius: '16px', display: 'block',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                        }} />
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
                        fontFamily: FONT, marginTop: 6
                      }}>Add 2nd photo</span>
                    </button>
                  )}
                </div>
              )}

              {/* Notes */}
              {images.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <label style={s.label}>Notes (optional)</label>
                  <input style={s.input} placeholder="e.g. Birthday party slice..."
                    value={notes} onChange={e => setNotes(e.target.value)} />
                </div>
              )}
            </div>
          )}

          {/* ── TEXT sub-mode ── */}
          {mode === MODES.TEXT && (
            <div style={s.card}>
              <label style={s.label}>What did you eat? *</label>
              <textarea style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
                placeholder="e.g. 2 slices of pizza, a can of Coke and some garlic bread..."
                value={desc} onChange={e => setDesc(e.target.value)}
                autoFocus />

              <label style={{ ...s.label, marginTop: 16 }}>Notes (optional)</label>
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
              opacity: loading || (mode === MODES.IMAGE ? !images.length : !desc.trim()) ? 0.5 : 1,
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
              opacity: loading || !answer.trim() ? 0.5 : 1,
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
                  ? 'rgba(52,199,89,0.12)' : 'rgba(255,149,0,0.12)', // Apple Green or Orange
                color: result.ai_confidence > 0.7
                  ? '#34C759' : '#FF9500',
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

      <div style={{ height: 16 }} />
      <style>{`
        :root {
          --color-accent: #34C759;
          --color-text: #1C1C1E;
          --color-text-muted: #636366;
          --color-text-faint: #8E8E93;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// ── Styles ────────────────────────────────────────────────────────
const s = {
  page: { 
    display: 'flex', flexDirection: 'column', gap: 16, padding: '16px' 
  },
  header: { 
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' 
  },
  backBtn: {
    width: 44, height: 44, 
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.04)', 
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
  },
  title: {
    fontFamily: FONT, fontSize: '1.2rem',
    fontWeight: 800, color: 'var(--color-text)'
  },
  banner: {
    display: 'flex', alignItems: 'center', gap: 16,
    ...GLASS_WHITE,
    background: 'rgba(255, 59, 48, 0.08)', // Light Apple Red tint
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: 24, padding: '20px'
  },
  bannerTitle: {
    fontFamily: FONT, fontSize: '1.1rem',
    fontWeight: 800, color: 'var(--color-text)'
  },
  bannerSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: 4
  },
  modeTabs: {
    display: 'flex', gap: 8,
    ...GLASS_WHITE,
    borderRadius: 20, padding: 8
  },
  modeTab: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    padding: '12px 0', borderRadius: 14, border: 'none',
    background: 'transparent', color: 'var(--color-text-muted)',
    fontSize: '0.9rem', fontWeight: 700,
    fontFamily: FONT, cursor: 'pointer',
    transition: 'all 200ms ease'
  },
  modeTabActive: {
    background: '#ffffff',
    color: 'var(--color-text)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
  },
  card: {
    ...GLASS_WHITE,
    borderRadius: 24, padding: '20px'
  },
  uploadZone: {
    width: '100%', display: 'flex', flexDirection: 'column',
    alignItems: 'center', padding: '40px 16px',
    background: 'rgba(255,255,255,0.4)', 
    border: '2px dashed rgba(0,0,0,0.1)',
    borderRadius: 20, cursor: 'pointer',
    transition: 'background 200ms ease'
  },
  cameraCircle: {
    width: 64, height: 64,
    background: 'rgba(255, 59, 48, 0.1)',
    borderRadius: '20px', display: 'flex',
    alignItems: 'center', justifyContent: 'center'
  },
  uploadTitle: {
    fontFamily: FONT, fontSize: '1.1rem',
    fontWeight: 800, color: 'var(--color-text)', marginTop: 16
  },
  uploadSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: 6
  },
  uploadHint: {
    marginTop: 16, fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600,
    fontFamily: FONT,
    background: 'rgba(0,0,0,0.04)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: 999, padding: '6px 16px'
  },
  removeBtn: {
    position: 'absolute', top: 8, right: 8,
    width: 28, height: 28, background: 'rgba(0,0,0,0.6)',
    backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
    border: 'none', borderRadius: '50%', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center'
  },
  addMoreBtn: {
    flex: 1, minHeight: 160, display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    background: 'rgba(255,255,255,0.4)',
    border: '2px dashed rgba(0,0,0,0.1)',
    borderRadius: 16, cursor: 'pointer', gap: 6
  },
  label: {
    display: 'block', fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--color-text-muted)', letterSpacing: '0.5px',
    textTransform: 'uppercase', fontFamily: FONT,
    marginBottom: 10
  },
  input: {
    width: '100%', background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: 16,
    padding: '14px 16px', color: 'var(--color-text)',
    fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
    outline: 'none', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
  },
  submitBtn: {
    width: '100%', padding: 16,
    background: '#FF3B30', // Apple Red for Cheat Meal action
    border: 'none',
    borderRadius: 16, color: '#ffffff',
    fontSize: '1rem', fontWeight: 800,
    fontFamily: FONT,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    boxShadow: '0 8px 24px rgba(255, 59, 48, 0.3)',
    transition: 'opacity 180ms ease, transform 180ms ease', cursor: 'pointer'
  },
  followUpCard: {
    ...GLASS_WHITE,
    background: 'rgba(52, 199, 89, 0.08)',
    border: '1px solid rgba(52, 199, 89, 0.2)',
    borderRadius: 24, padding: '24px 20px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 14
  },
  aiAvatar: { fontSize: '3rem' },
  followUpQ: {
    fontFamily: FONT, fontSize: '1.05rem', fontWeight: 600,
    color: 'var(--color-text)', textAlign: 'center',
    lineHeight: 1.5
  },
  resultCard: {
    ...GLASS_WHITE,
    borderRadius: 24, padding: '36px 24px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: 12
  },
  resultCheck: { fontSize: '3.5rem' },
  resultTitle: {
    fontFamily: FONT,
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)', textAlign: 'center'
  },
  resultCals: {
    fontSize: '2.5rem', fontWeight: 800,
    color: 'var(--color-accent)',
    fontFamily: FONT, letterSpacing: '-0.5px'
  },
  confidenceBadge: {
    fontSize: '0.85rem', fontFamily: FONT,
    fontWeight: 700, padding: '6px 16px',
    borderRadius: 999, border: '1px solid transparent', marginTop: 4
  },
  resultSub: {
    fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, textAlign: 'center',
    marginTop: 8, lineHeight: 1.5
  },
}