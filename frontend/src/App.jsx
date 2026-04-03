import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'

// Auth Pages
import Login from './pages/auth/Login'
import Signup from './pages/auth/Signup'
import Onboarding from './pages/auth/Onboarding'

// App Pages
import Dashboard from './pages/dashboard/Dashboard'
import Nutrition from './pages/nutrition/Nutrition'
import NutritionDetail from './pages/nutrition/NutritionDetail'
import Training from './pages/training/Training'
import Account from './pages/account/Account'
import CheatMeal from './pages/nutrition/CheatMeal'

// Layout
import AppLayout from './components/layout/AppLayout'

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

function SplashScreen() {
  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg-primary)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px'
    }}>
      <h1 style={{
        fontFamily: 'Clash Display, sans-serif',
        fontSize: '2rem',
        color: 'var(--accent)',
        letterSpacing: '-0.5px'
      }}>
        NutriAI
      </h1>
      <div style={{
        width: '32px',
        height: '32px',
        border: '3px solid var(--bg-surface-3)',
        borderTop: '3px solid var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite'
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function App() {
  return (
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
  )
}

export default App