import { useState, useRef, useEffect } from 'react'  // add useRef, useEffect
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

import bgVideo  from '../../assets/videos/bg-video.mp4'
import bg1 from '../../assets/images/bg-1.webp'
import bg2 from '../../assets/images/bg-2.webp'
import bg3 from '../../assets/images/bg-3.webp'
import bg4 from '../../assets/images/bg-4.webp'
import bg5 from '../../assets/images/bg-5.webp'

const BG_IMAGES = [bg1, bg2, bg3, bg4, bg5]

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm]       = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const [activeImg, setActiveImg]   = useState(0)
  const [nextImg, setNextImg]       = useState(null)
  const intervalRef = useRef(null)

  useEffect(() => {
    if (!videoEnded) return

    intervalRef.current = setInterval(() => {
      const next = (activeImg + 1) % BG_IMAGES.length

      // Step 1: Mount next image at opacity 0
      setNextImg(next)

      // Step 2: After 1 frame, it fades in over 800ms
      // Step 3: After fade completes, swap active and unmount next
      setTimeout(() => {
        setActiveImg(next)
        setNextImg(null)
      }, 900) // slightly longer than CSS transition

    }, 5000)

    return () => clearInterval(intervalRef.current)
  }, [videoEnded, activeImg])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) { toast.error('Please fill in all fields'); return }
    setLoading(true)
    try {
      const res = await authService.login(form)
      await login(
        { access: res.data.access, refresh: res.data.refresh },
        { username: form.username }
      )
      if (res.data.onboarding_complete) {
        toast.success('Welcome back! 👋'); navigate('/')
      } else {
        toast.success('Complete your profile first!'); navigate('/onboarding')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={s.wrapper}>

      {/* ── Video (plays once) ── */}
      {!videoEnded && (
        <video
          autoPlay muted playsInline
          poster={bg1}
          style={s.bgVideo}
          preload="auto"
          onEnded={() => setVideoEnded(true)}
        >
          <source src={bgVideo} type="video/mp4" />
        </video>
      )}

      {/* ── Image Slideshow ── */}
      {videoEnded && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>

          {/* Current active image — always visible */}
          <img
            src={BG_IMAGES[activeImg]}
            alt=""
            style={{
              ...s.bgVideo,
              opacity: 1,
              transition: 'none',
            }}
          />

          {/* Next image — fades IN on top */}
          {nextImg !== null && (
            <img
              src={BG_IMAGES[nextImg]}
              alt=""
              style={{
                ...s.bgVideo,
                opacity: 0,
                animation: 'fadeInBg 0.9s ease forwards',
              }}
            />
          )}
        </div>
      )}

      {/* ── Tint overlay ── */}
      <div style={s.overlay} />

      {/* ── Decorative blobs ── */}
      <div style={{ ...s.blob, top: '-10%', right: '-5%',
        background: 'radial-gradient(circle, rgba(58,158,95,0.20) 0%, transparent 70%)' }} />
      <div style={{ ...s.blob, bottom: '-10%', left: '-5%', width: '350px', height: '350px',
        background: 'radial-gradient(circle, rgba(100,200,130,0.15) 0%, transparent 70%)' }} />

      {/* ── Main content ── */}
      <div style={s.container} className="animate-fadeUp">

        {/* Logo */}
        <div style={s.logoSection} className="animate-fadeUp">
          <div style={s.logoIcon}>🥗</div>
          <h1 style={s.logoText}>NutriAI</h1>
          <p style={s.tagline}>Your AI-powered diet & training planner</p>
        </div>

        {/* Glass Card */}
        <div style={s.card} className="glass-heavy animate-fadeUp-delay-1">

          <div>
            <h2 style={s.cardTitle}>Welcome back</h2>
            <p style={s.cardSubtitle}>Sign in to continue your journey</p>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Username */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Username</label>
              <input
                name="username" type="text"
                placeholder="Enter your username"
                value={form.username} onChange={handleChange}
                style={s.input} autoComplete="username"
                className="glass-input"
              />
            </div>

            {/* Password */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Password</label>
              <div style={s.inputWrapper}>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password} onChange={handleChange}
                  style={{ ...s.input, paddingRight: '48px' }}
                  autoComplete="current-password"
                  className="glass-input"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} style={s.eyeBtn}>
                  {showPass
                    ? <EyeOff size={18} color="var(--color-text-faint)" />
                    : <Eye    size={18} color="var(--color-text-faint)" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}
              className="submit-btn"
            >
              {loading
                ? <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
                : 'Sign In'}
            </button>

          </form>

          {/* Divider */}
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <div style={s.dividerLine} />
          </div>

          {/* Signup */}
          <p style={s.switchText}>
            Don't have an account?{' '}
            <Link to="/signup" style={s.link}>Create one</Link>
          </p>

        </div>
      </div>

      {/* ── Scoped styles ── */}
      <style>{`
        @keyframes fadeInBg {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        .glass-input:focus {
          outline: none;
          border-color: var(--color-accent) !important;
          box-shadow: 0 0 0 3px var(--color-accent-glow) !important;
          background: rgba(255,255,255,0.80) !important;
        }
        .glass-input::placeholder { color: var(--color-text-faint); }
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 8px 24px var(--color-accent-glow);
          background: var(--color-accent-hover) !important;
        }
        .submit-btn:active:not(:disabled) { transform: translateY(0); }

        /* Responsive */
        @media (max-width: 480px) {
          .login-container { padding: 16px !important; gap: 24px !important; }
          .login-card { padding: 24px 20px !important; }
        }
        @media (min-width: 768px) {
          .login-container { max-width: 420px !important; }
        }
      `}</style>
    </div>
  )
}

const s = {
  wrapper: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 'clamp(16px, 4vw, 32px)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-body)',
  },
  bgVideo: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(135deg, rgba(230,248,235,0.55) 0%, rgba(200,235,210,0.45) 100%)',
    zIndex: 1,
  },
  blob: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    pointerEvents: 'none',
    zIndex: 1,
    filter: 'blur(40px)',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    position: 'relative',
    zIndex: 2,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '6px',
  },
  logoIcon: {
    fontSize: 'clamp(40px, 8vw, 52px)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 12px rgba(58,158,95,0.3))',
  },
  logoText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(1.75rem, 5vw, 2.25rem)',
    fontWeight: 700,
    color: 'var(--color-accent)',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: 'clamp(0.8rem, 2vw, 0.9rem)',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    fontWeight: 400,
  },
  card: {
    borderRadius: 'var(--radius-xl)',
    padding: 'clamp(24px, 5vw, 32px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardTitle: {
    fontSize: 'clamp(1.2rem, 3vw, 1.4rem)',
    fontWeight: 700,
    color: 'var(--color-text)',
    letterSpacing: '-0.3px',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
    fontWeight: 400,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--color-text-muted)',
    letterSpacing: '0.2px',
  },
  inputWrapper: { position: 'relative' },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: 'rgba(255,255,255,0.60)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.70)',
    borderRadius: 'var(--radius-md)',
    color: 'var(--color-text)',
    fontSize: '1rem',
    fontFamily: 'var(--font-body)',
    transition: 'border-color var(--transition), box-shadow var(--transition), background var(--transition)',
  },
  eyeBtn: {
    position: 'absolute',
    right: '14px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background var(--transition), transform var(--transition), box-shadow var(--transition)',
    letterSpacing: '0.2px',
  },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--color-divider)',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: 'var(--color-text-faint)',
    fontWeight: 500,
  },
  switchText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--color-text-muted)',
  },
  link: {
    color: 'var(--color-accent)',
    textDecoration: 'none',
    fontWeight: 700,
  },
}

export default Login