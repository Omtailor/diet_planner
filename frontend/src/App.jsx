import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// ✅ Eagerly load auth pages (needed on initial load)
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Onboarding from './pages/auth/Onboarding'

// ✅ Lazy load app pages (code splitting for better initial load)
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Nutrition = lazy(() => import('./pages/nutrition/Nutrition'))
const NutritionDetail = lazy(() => import('./pages/nutrition/NutritionDetail'))
const Training = lazy(() => import('./pages/training/Training'))
const Account = lazy(() => import('./pages/account/Account'))
const CheatMeal = lazy(() => import('./pages/nutrition/CheatMeal'))
const AppLayout = lazy(() => import('./components/layout/AppLayout'))

// Route Guards
function PrivateRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  return user ? children : <Navigate to="/login" replace />
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <SplashScreen />
  return !user ? children : <Navigate to="/" replace />
}

// ✅ Loading fallback for lazy-loaded routes
function RouteLoadingFallback() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f0f7f2',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid rgba(52, 199, 89, 0.2)',
        borderTop: '3px solid #34C759',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: '#f0f7f2',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      {/* Logo / App Name */}
      <div style={{
        width: '64px',
        height: '64px',
        background: 'rgba(52, 199, 89, 0.12)',
        borderRadius: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '2rem',
        marginBottom: '4px',
      }}>
        🥗
      </div>

      <h1 style={{
        fontFamily: "'General Sans', 'Satoshi', sans-serif",
        fontSize: '1.8rem',
        fontWeight: 800,
        color: '#1C1C1E',
        letterSpacing: '-0.5px'
      }}>
        NutriAI
      </h1>

      {/* Green spinner matching your app theme */}
      <div style={{
        width: '28px',
        height: '28px',
        border: '3px solid rgba(52, 199, 89, 0.2)',
        borderTop: '3px solid #34C759',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function App() {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />
        <Route path="/onboarding" element={<PrivateRoute><Onboarding /></PrivateRoute>} />

        {/* Protected App Routes */}
        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="nutrition" element={<Nutrition />} />
          <Route path="nutrition/:date" element={<NutritionDetail />} />
          <Route path="cheat-meal" element={<PrivateRoute><CheatMeal /></PrivateRoute>} />
          <Route path="training" element={<Training />} />
          <Route path="account" element={<Account />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default App