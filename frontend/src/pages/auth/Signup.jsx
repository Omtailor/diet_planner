import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

function Signup() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({
    username: '', email: '', password: '', confirmPassword: ''
  })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

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
    if (p.length < 6) return { width: '33%', color: 'var(--error)', label: 'Weak' }
    if (p.length < 10) return { width: '66%', color: 'var(--warning)', label: 'Medium' }
    return { width: '100%', color: 'var(--success)', label: 'Strong' }
  }
  const strength = getStrength()

  return (
    <div style={styles.wrapper}>
      <div style={styles.blob} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🥗</div>
          <h1 style={styles.logoText}>NutriAI</h1>
          <p style={styles.tagline}>Start your health journey today</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Create account</h2>
          <p style={styles.cardSubtitle}>Join thousands on their fitness journey</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                name="username"
                type="text"
                placeholder="Choose a username"
                value={form.username}
                onChange={handleChange}
                style={styles.input}
                autoComplete="username"
              />
            </div>

            {/* Email */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Email</label>
              <input
                name="email"
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={handleChange}
                style={styles.input}
                autoComplete="email"
              />
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingRight: '48px' }}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  style={styles.eyeBtn}
                >
                  {showPass
                    ? <EyeOff size={18} color="var(--text-faint)" />
                    : <Eye size={18} color="var(--text-faint)" />
                  }
                </button>
              </div>
              {/* Password strength bar */}
              {form.password.length > 0 && (
                <div style={styles.strengthWrapper}>
                  <div style={styles.strengthTrack}>
                    <div style={{
                      ...styles.strengthFill,
                      width: strength.width,
                      background: strength.color,
                    }} />
                  </div>
                  <span style={{ ...styles.strengthLabel, color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password</label>
              <input
                name="confirmPassword"
                type="password"
                placeholder="Re-enter your password"
                value={form.confirmPassword}
                onChange={handleChange}
                style={{
                  ...styles.input,
                  borderColor: form.confirmPassword && form.confirmPassword !== form.password
                    ? 'var(--error)'
                    : 'var(--border)',
                }}
                autoComplete="new-password"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                ...styles.submitBtn,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading
                ? <Loader2 size={20} style={styles.spinner} />
                : 'Create Account'
              }
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Login link */}
          <p style={styles.switchText}>
            Already have an account?{' '}
            <Link to="/login" style={styles.link}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input:focus {
          outline: none;
          border-color: var(--accent) !important;
          box-shadow: 0 0 0 3px rgba(200, 241, 53, 0.15) !important;
        }
        input::placeholder { color: var(--text-faint); }
      `}</style>
    </div>
  )
}

const styles = {
  wrapper: {
    minHeight: '100dvh',
    background: 'var(--bg-primary)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    position: 'relative',
    overflow: 'hidden',
  },
  blob: {
    position: 'absolute',
    bottom: '-100px',
    left: '-80px',
    width: '280px',
    height: '280px',
    background: 'radial-gradient(circle, rgba(200,241,53,0.1) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '28px',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: { fontSize: '40px', lineHeight: 1 },
  logoText: {
    fontFamily: 'Clash Display, sans-serif',
    fontSize: '1.75rem',
    fontWeight: 700,
    color: 'var(--accent)',
    letterSpacing: '-0.5px',
  },
  tagline: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    textAlign: 'center',
    fontFamily: 'Satoshi, sans-serif',
  },
  card: {
    background: 'var(--bg-surface)',
    border: '1px solid var(--border)',
    borderRadius: '20px',
    padding: '28px 24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  cardTitle: {
    fontFamily: 'Clash Display, sans-serif',
    fontSize: '1.375rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    letterSpacing: '-0.3px',
  },
  cardSubtitle: {
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    marginTop: '-12px',
    fontFamily: 'Satoshi, sans-serif',
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
    fontWeight: 500,
    color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif',
    letterSpacing: '0.2px',
  },
  inputWrapper: { position: 'relative' },
  input: {
    width: '100%',
    padding: '13px 16px',
    background: 'var(--bg-surface-2)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'var(--text-primary)',
    fontSize: '1rem',
    fontFamily: 'Satoshi, sans-serif',
    transition: 'border-color 180ms ease, box-shadow 180ms ease',
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
    marginTop: '4px',
  },
  strengthTrack: {
    flex: 1,
    height: '4px',
    background: 'var(--bg-surface-3)',
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
    fontFamily: 'Satoshi, sans-serif',
    minWidth: '40px',
  },
  submitBtn: {
    width: '100%',
    padding: '14px',
    background: 'var(--accent)',
    color: '#0A0A0A',
    border: 'none',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: 700,
    fontFamily: 'Satoshi, sans-serif',
    cursor: 'pointer',
    marginTop: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 180ms ease, transform 180ms ease',
  },
  spinner: { animation: 'spin 0.8s linear infinite' },
  divider: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  dividerLine: {
    flex: 1,
    height: '1px',
    background: 'var(--border)',
  },
  dividerText: {
    fontSize: '0.75rem',
    color: 'var(--text-faint)',
    fontFamily: 'Satoshi, sans-serif',
  },
  switchText: {
    textAlign: 'center',
    fontSize: '0.875rem',
    color: 'var(--text-secondary)',
    fontFamily: 'Satoshi, sans-serif',
  },
  link: {
    color: 'var(--accent)',
    textDecoration: 'none',
    fontWeight: 600,
  },
}

export default Signup