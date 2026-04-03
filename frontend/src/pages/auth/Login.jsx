import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'

function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [form, setForm] = useState({ username: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.username || !form.password) {
      toast.error('Please fill in all fields'); return
    }
    setLoading(true)
    try {
      const res = await authService.login(form)
      await login(
        { access: res.data.access, refresh: res.data.refresh },
        { username: form.username }
      )
      if (res.data.onboarding_complete) {
        toast.success('Welcome back! 👋')
        navigate('/')
      } else {
        toast.success('Complete your profile first!')
        navigate('/onboarding')
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.wrapper}>
      {/* Background accent blob */}
      <div style={styles.blob} />

      <div style={styles.container}>
        {/* Logo */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>🥗</div>
          <h1 style={styles.logoText}>NutriAI</h1>
          <p style={styles.tagline}>Your AI-powered diet & training planner</p>
        </div>

        {/* Card */}
        <div style={styles.card}>
          <h2 style={styles.cardTitle}>Welcome back</h2>
          <p style={styles.cardSubtitle}>Sign in to continue your journey</p>

          <form onSubmit={handleSubmit} style={styles.form}>
            {/* Username */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Username</label>
              <input
                name="username"
                type="text"
                placeholder="Enter your username"
                value={form.username}
                onChange={handleChange}
                style={styles.input}
                autoComplete="username"
              />
            </div>

            {/* Password */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Password</label>
              <div style={styles.inputWrapper}>
                <input
                  name="password"
                  type={showPass ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  style={{ ...styles.input, paddingRight: '48px' }}
                  autoComplete="current-password"
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
                : 'Sign In'
              }
            </button>
          </form>

          {/* Divider */}
          <div style={styles.divider}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>or</span>
            <div style={styles.dividerLine} />
          </div>

          {/* Signup link */}
          <p style={styles.switchText}>
            Don't have an account?{' '}
            <Link to="/signup" style={styles.link}>
              Create one
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
    top: '-120px',
    right: '-80px',
    width: '300px',
    height: '300px',
    background: 'radial-gradient(circle, rgba(200,241,53,0.12) 0%, transparent 70%)',
    borderRadius: '50%',
    pointerEvents: 'none',
  },
  container: {
    width: '100%',
    maxWidth: '400px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '8px',
  },
  logoIcon: {
    fontSize: '48px',
    lineHeight: 1,
  },
  logoText: {
    fontFamily: 'Clash Display, sans-serif',
    fontSize: '2rem',
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
  inputWrapper: {
    position: 'relative',
  },
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
  spinner: {
    animation: 'spin 0.8s linear infinite',
  },
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

export default Login