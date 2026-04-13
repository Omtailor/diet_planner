import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'
import './styles/theme.css'
import './styles/glass.css'
import './styles/animations.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              fontFamily: "'General Sans', 'Satoshi', sans-serif",
              fontWeight: 600,
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.95)',
              color: '#1C1C1E',
              borderRadius: '16px',
              padding: '14px 18px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)',
              border: '1px solid rgba(0, 0, 0, 0.06)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              maxWidth: '320px',
            },
            success: {
              style: {
                border: '1px solid rgba(52, 199, 89, 0.25)',
                background: 'rgba(255, 255, 255, 0.97)',
              },
              iconTheme: {
                primary: '#34C759',
                secondary: '#ffffff',
              },
            },
            error: {
              style: {
                border: '1px solid rgba(255, 59, 48, 0.25)',
                background: 'rgba(255, 255, 255, 0.97)',
              },
              iconTheme: {
                primary: '#FF3B30',
                secondary: '#ffffff',
              },
            },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)