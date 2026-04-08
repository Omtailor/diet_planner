import { createContext, useContext, useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { safeStorage } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Safety net — force-hide loader after 5s no matter what in case the network hangs
    const timeout = setTimeout(() => setLoading(false), 5000)

    const token = safeStorage.get('access_token')
    if (token) fetchProfile()
    else setLoading(false)

    return () => clearTimeout(timeout)
  }, [])

  const fetchProfile = async () => {
    try {
      const res = await authService.getProfile()
      setProfile(res.data)
      setUser({ username: res.data.user || res.data.username || 'user' })
      return res.data
    } catch (err) {
      const status = err.response?.status
      if (status === 401) {
        safeStorage.remove('access_token')
        safeStorage.remove('refresh_token')
        setUser(null)
        setProfile(null)
      }
      return null
    } finally {
      setLoading(false)
    }
  }

  const login = async (tokens, userData) => {
    safeStorage.set('access_token', tokens.access)
    safeStorage.set('refresh_token', tokens.refresh)
    setUser(userData)
    const profileData = await fetchProfile()
    return profileData
  }

  const logout = () => {
    safeStorage.remove('access_token')
    safeStorage.remove('refresh_token')
    setUser(null)
    setProfile(null)
  }

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      login, logout, fetchProfile
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)