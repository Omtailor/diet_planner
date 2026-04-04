import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'
import './styles/theme.css'      // ← ADD
import './styles/glass.css'      // ← ADD
import './styles/animations.css' // ← ADD

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1C1C1C',
              color: '#F5F5F5',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontFamily: 'Satoshi, sans-serif',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#C8F135', secondary: '#0A0A0A' } },
            error: { iconTheme: { primary: '#FF4D4D', secondary: '#0A0A0A' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)