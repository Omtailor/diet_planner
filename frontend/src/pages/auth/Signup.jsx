import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

import bgVideo from '../../assets/videos/bg-video.mp4'

function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.email || !form.password || !form.confirmPassword) {
      toast.error('Please fill in all fields'); return
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match'); return
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters'); return
    }
    setLoading(true)
    try {
      const res = await authService.register({
        username: form.username,
        email: form.email,
        password: form.password,
      })
      await login(
        { access: res.data.access, refresh: res.data.refresh },
        { username: form.username }
      )
      toast.success("Account created! Let's set up your profile 🎉")
      navigate('/onboarding')
    } catch (err) {
      const data = err.response?.data
      if (data?.username) toast.error(`Username: ${data.username[0]}`)
      else if (data?.email) toast.error(`Email: ${data.email[0]}`)
      else if (data?.password) toast.error(`Password: ${data.password[0]}`)
      else toast.error('Registration failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const getStrength = () => {
    const p = form.password
    if (!p) return { width: '0%', color: 'transparent', label: '' }
    if (p.length < 6) return { width: '33%', color: '#e05252', label: 'Weak' }
    if (p.length < 10) return { width: '66%', color: '#e09a2e', label: 'Medium' }
    return { width: '100%', color: 'var(--color-accent)', label: 'Strong' }
  }
  const strength = getStrength()

  return (
    <div style={s.wrapper}>

      {/* ── Background Video (loops) ── */}
      <video
        autoPlay playsInline loop muted
        style={s.bgVideo}
        preload="auto"
      >
        <source src={bgVideo} type="video/mp4" />
      </video>

      {/* ── Tint overlay ── */}
      <div style={s.overlay} />

      {/* ── Decorative blobs ── */}
      <div style={{
        ...s.blob,
        bottom: '-10%', left: '-5%',
        background: 'radial-gradient(circle, rgba(58,158,95,0.20) 0%, transparent 70%)'
      }} />
      <div style={{
        ...s.blob,
        top: '-8%', right: '-5%', width: '300px', height: '300px',
        background: 'radial-gradient(circle, rgba(100,200,130,0.15) 0%, transparent 70%)'
      }} />

      {/* ── Main content ── */}
      <div style={s.container} className="animate-fadeUp">

        {/* Logo */}
        <div style={s.logoSection}>
          <div style={s.logoIcon}>🥗</div>
          <h1 style={s.logoText}>NutriAI</h1>
          <p style={s.tagline}>Start your health journey today</p>
        </div>

        {/* Glass Card */}
        <div style={s.card} className="glass-heavy animate-fadeUp-delay-1">

          <div>
            <h2 style={s.cardTitle}>Create account</h2>
            <p style={s.cardSubtitle}>Join thousands on their fitness journey</p>
          </div>

          <form onSubmit={handleSubmit} style={s.form}>

            {/* Username */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Username</label>
              <input
                name="username" type="text"
                placeholder="Choose a username"
                value={form.username} onChange={handleChange}
                style={s.input} autoComplete="username"
                className="glass-input"
              />
            </div>

            {/* Email */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Email</label>
              <input
                name="email" type="email"
                placeholder="Enter your email"
                value={form.email} onChange={handleChange}
                style={s.input} autoComplete="email"
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
                  placeholder="Min. 8 characters"
                  value={form.password} onChange={handleChange}
                  style={{ ...s.input, paddingRight: '48px' }}
                  autoComplete="new-password"
                  className="glass-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={s.eyeBtn}
                >
                  {showPass
                    ? <EyeOff size={18} color="var(--color-text-faint)" />
                    : <Eye size={18} color="var(--color-text-faint)" />}
                </button>
              </div>

              {/* Password strength bar */}
              {form.password.length > 0 && (
                <div style={s.strengthWrapper}>
                  <div style={s.strengthTrack}>
                    <div style={{
                      ...s.strengthFill,
                      width: strength.width,
                      background: strength.color,
                    }} />
                  </div>
                  <span style={{ ...s.strengthLabel, color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={s.fieldGroup}>
              <label style={s.label}>Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword} onChange={handleChange}
                style={{
                  ...s.input,
                  borderColor: form.confirmPassword && form.confirmPassword !== form.password
                    ? '#e05252'
                    : 'rgba(255,255,255,0.70)',
                }}
                autoComplete="new-password"
                className="glass-input"
              />
              {/* Mismatch hint */}
              {form.confirmPassword && form.confirmPassword !== form.password && (
                <span style={s.errorHint}>Passwords do not match</span>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={loading}
              style={{ ...s.submitBtn, opacity: loading ? 0.75 : 1 }}
              className="submit-btn"
            >
              {loading
                ? <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
                : 'Create Account'}
            </button>

          </form>

          {/* Divider */}
          <div style={s.divider}>
            <div style={s.dividerLine} />
            <span style={s.dividerText}>or</span>
            <div style={s.dividerLine} />
          </div>

          {/* Login link */}
          <p style={s.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={s.link}>Sign in</Link>
          </p>

        </div>
      </div>

      <style>{`
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

        @keyframes spin { to { transform: rotate(360deg); } }

        @media (max-width: 480px) {
          .signup-container { padding: 16px !important; gap: 20px !important; }
          .signup-card      { padding: 22px 18px !important; }
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
    width: '380px',
    height: '380px',
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
    gap: '24px',
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
    fontSize: 'clamp(36px, 7vw, 46px)',
    lineHeight: 1,
    filter: 'drop-shadow(0 4px 12px rgba(58,158,95,0.3))',
  },
  logoText: {
    fontFamily: 'var(--font-body)',
    fontSize: 'clamp(1.6rem, 4.5vw, 2rem)',
    fontWeight: 700,
    color: 'var(--color-accent)',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: 'clamp(0.8rem, 2vw, 0.875rem)',
    color: 'var(--color-text-muted)',
    textAlign: 'center',
    fontWeight: 400,
  },
  card: {
    borderRadius: 'var(--radius-xl)',
    padding: 'clamp(22px, 5vw, 30px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
  },
  cardTitle: {
    fontSize: 'clamp(1.15rem, 3vw, 1.375rem)',
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
    gap: '14px',
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
    padding: '12px 16px',
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
  strengthWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginTop: '2px',
  },
  strengthTrack: {
    flex: 1,
    height: '4px',
    background: 'rgba(255,255,255,0.35)',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  strengthFill: {
    height: '100%',
    borderRadius: '4px',
    transition: 'width 300ms ease, background 300ms ease',
  },
  strengthLabel: {
    fontSize: '0.75rem',
    fontWeight: 600,
    minWidth: '44px',
  },
  errorHint: {
    fontSize: '0.75rem',
    color: '#e05252',
    fontWeight: 500,
    marginTop: '2px',
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'var(--color-accent)',
    color: '#ffffff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'var(--font-body)',
    cursor: 'pointer',
    marginTop: '2px',
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

export default Signup