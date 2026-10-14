import { ArrowLeft, ArrowRight, Utensils } from 'lucide-react'
import { motion, useReducedMotion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import useDocumentMeta from '../hooks/useDocumentMeta'

export default function NotFound() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const shouldReduceMotion = useReducedMotion()
  const AnimatedSection = motion.section

  useDocumentMeta({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has been moved.',
    robots: 'noindex, nofollow',
  })

  const goBack = () => {
    if (window.history.length > 1) navigate(-1)
    else navigate(user ? '/' : '/login', { replace: true })
  }

  return (
    <main
      id="main-content"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
        background: 'linear-gradient(160deg, rgba(242,242,247,0.98) 0%, rgba(232,244,236,0.96) 100%)',
      }}
    >
      <AnimatedSection
        className="glass-heavy"
        initial={shouldReduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          width: '100%',
          maxWidth: '460px',
          padding: 'clamp(28px, 7vw, 44px)',
          borderRadius: 'var(--radius-xl)',
          textAlign: 'center',
        }}
      >
        <div
          aria-hidden="true"
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 18px',
            display: 'grid',
            placeItems: 'center',
            borderRadius: '20px',
            background: 'var(--color-accent-soft)',
            color: 'var(--color-accent)',
          }}
        >
          <Utensils size={30} />
        </div>
        <p style={{ color: 'var(--color-accent)', fontSize: 'clamp(4rem, 18vw, 7rem)', fontWeight: 800, lineHeight: 0.9 }}>
          404
        </p>
        <h1 style={{ marginTop: '20px', color: 'var(--color-text)', fontSize: 'clamp(1.5rem, 5vw, 2rem)', fontWeight: 800 }}>
          This page isn&apos;t on the menu
        </h1>
        <p style={{ marginTop: '12px', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '12px', marginTop: '28px' }}>
          <button
            type="button"
            onClick={() => navigate(user ? '/' : '/login', { replace: true })}
            className="focus-visible:outline-2"
            style={{
              minHeight: '44px',
              padding: '12px 18px',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              background: 'var(--color-accent)',
              color: '#fff',
              fontWeight: 700,
            }}
          >
            {user ? 'Back to Dashboard' : 'Go to Sign In'}
            <ArrowRight size={17} aria-hidden="true" style={{ marginLeft: '8px', verticalAlign: 'middle' }} />
          </button>
          <button
            type="button"
            onClick={goBack}
            className="focus-visible:outline-2"
            style={{
              minHeight: '44px',
              padding: '12px 18px',
              border: '1px solid var(--color-border-subtle)',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(255,255,255,0.55)',
              color: 'var(--color-text-muted)',
              fontWeight: 700,
            }}
          >
            <ArrowLeft size={17} aria-hidden="true" style={{ marginRight: '8px', verticalAlign: 'middle' }} />
            Go Back
          </button>
        </div>
      </AnimatedSection>
    </main>
  )
}
