import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, Loader2, Camera, Type } from 'lucide-react'
import toast from 'react-hot-toast'

import { FONT, GLASS_WHITE, MODES, STAGES } from '../../utils/cheatMeal/constants'
import { submitImageMeal, submitManualMeal, submitFollowUpAnswer } from '../../services/cheatMealService'
import ImageUploader from '../../components/cheatmeal/ImageUploader'
import FollowUpCard from '../../components/cheatmeal/FollowUpCard'
import ResultCard from '../../components/cheatmeal/ResultCard'

export default function CheatMeal() {
  const navigate = useNavigate()

  // ── Page-level state ───────────────────────────────────────────
  const [mode, setMode] = useState(MODES.IMAGE)
  const [stage, setStage] = useState(STAGES.PICK)
  const [loading, setLoading] = useState(false)

  // Image mode
  const [images, setImages] = useState([])   // [{file, preview}]

  // Text mode
  const [desc, setDesc] = useState('')
  const [notes, setNotes] = useState('')

  // Result / follow-up
  const [result, setResult] = useState(null)
  const [followUp, setFollowUp] = useState(null) // {cheat_meal_id, question}
  const [answer, setAnswer] = useState('')

  // Revoke any remaining object URLs on unmount
  useEffect(() => {
    return () => {
      images.forEach(img => URL.revokeObjectURL(img.preview))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ── Submit: image ──────────────────────────────────────────────
  const submitImage = async () => {
    if (!images.length) { toast.error('Pick at least 1 photo'); return }
    setLoading(true)
    try {
      const fd = new FormData()
      images.forEach(img => fd.append('images', img.file))
      if (notes) fd.append('notes', notes)

      const res = await submitImageMeal(fd)
      setResult(res.data)
      setStage(STAGES.RESULT)
      toast.success('Cheat meal logged! 🍔')
    } catch (e) {
      toast.error(e?.response?.data?.error || 'Failed to analyze image')
    } finally {
      setLoading(false)
    }
  }

  // ── Submit: manual ─────────────────────────────────────────────
  const submitManual = async () => {
    if (!desc.trim()) { toast.error('Describe what you ate'); return }
    setLoading(true)
    try {
      const res = await submitManualMeal({
        manual_description: desc,
        notes: notes || undefined,
      })

      if (res.status === 202) {
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

  // ── Submit: follow-up answer ───────────────────────────────────
  const submitFollowUp = async () => {
    if (!answer.trim()) { toast.error('Please answer the question'); return }
    setLoading(true)
    try {
      const res = await submitFollowUpAnswer({
        cheat_meal_id: followUp.cheat_meal_id,
        answer,
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

  // ── Render ─────────────────────────────────────────────────────
  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <button
          onClick={() => stage !== STAGES.PICK ? setStage(STAGES.PICK) : navigate(-1)}
          style={s.backBtn}
        >
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
              style={{ ...s.modeTab, ...(mode === MODES.IMAGE ? s.modeTabActive : {}) }}
            >
              <Camera size={16} /> Photo
            </button>
            <button
              onClick={() => setMode(MODES.TEXT)}
              style={{ ...s.modeTab, ...(mode === MODES.TEXT ? s.modeTabActive : {}) }}
            >
              <Type size={16} /> Manual
            </button>
          </div>

          {/* IMAGE sub-mode */}
          {mode === MODES.IMAGE && (
            <ImageUploader
              images={images}
              notes={notes}
              onChange={setImages}
              onNotesChange={setNotes}
            />
          )}

          {/* TEXT sub-mode */}
          {mode === MODES.TEXT && (
            <div style={s.card}>
              <label style={s.label}>What did you eat? *</label>
              <textarea
                style={{ ...s.input, minHeight: 100, resize: 'vertical' }}
                placeholder="e.g. 2 slices of pizza, a can of Coke and some garlic bread..."
                value={desc}
                onChange={e => setDesc(e.target.value)}
                autoFocus
              />
              <label style={{ ...s.label, marginTop: 16 }}>Notes (optional)</label>
              <input
                style={s.input}
                placeholder="e.g. Late night craving, college canteen..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
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
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : mode === MODES.IMAGE ? '📸 Analyze & Log' : '✍️ Analyze & Log'}
          </button>
        </>
      )}

      {/* ── FOLLOW-UP stage ── */}
      {stage === STAGES.FOLLOWUP && followUp && (
        <>
          <FollowUpCard
            question={followUp.question}
            answer={answer}
            onAnswerChange={setAnswer}
          />
          <button
            onClick={submitFollowUp}
            disabled={loading || !answer.trim()}
            style={{
              ...s.submitBtn,
              opacity: loading || !answer.trim() ? 0.5 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading
              ? <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              : 'Submit Answer →'}
          </button>
        </>
      )}

      {/* ── RESULT stage ── */}
      {stage === STAGES.RESULT && result && (
        <>
          <ResultCard result={result} />
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

// ── Styles ──────────────────────────────────────────────────────
const s = {
  page: {
    display: 'flex', flexDirection: 'column', gap: 16, padding: '16px',
  },
  header: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0',
  },
  backBtn: {
    width: 44, height: 44,
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  title: {
    fontFamily: FONT, fontSize: '1.2rem',
    fontWeight: 800, color: 'var(--color-text)',
  },
  banner: {
    display: 'flex', alignItems: 'center', gap: 16,
    ...GLASS_WHITE,
    background: 'rgba(255, 59, 48, 0.08)',
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: 24, padding: '20px',
  },
  bannerTitle: {
    fontFamily: FONT, fontSize: '1.1rem',
    fontWeight: 800, color: 'var(--color-text)',
  },
  bannerSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: 4,
  },
  modeTabs: {
    display: 'flex', gap: 8,
    ...GLASS_WHITE,
    borderRadius: 20, padding: 8,
  },
  modeTab: {
    flex: 1, display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    padding: '12px 0', borderRadius: 14, border: 'none',
    background: 'transparent', color: 'var(--color-text-muted)',
    fontSize: '0.9rem', fontWeight: 700,
    fontFamily: FONT, cursor: 'pointer',
    transition: 'all 200ms ease',
  },
  modeTabActive: {
    background: '#ffffff',
    color: 'var(--color-text)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
  },
  card: {
    ...GLASS_WHITE,
    borderRadius: 24, padding: '20px',
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
  submitBtn: {
    width: '100%', padding: 16,
    background: '#FF3B30',
    border: 'none',
    borderRadius: 16, color: '#ffffff',
    fontSize: '1rem', fontWeight: 800,
    fontFamily: FONT,
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: 10,
    boxShadow: '0 8px 24px rgba(255, 59, 48, 0.3)',
    transition: 'opacity 180ms ease, transform 180ms ease', cursor: 'pointer',
  },
}
