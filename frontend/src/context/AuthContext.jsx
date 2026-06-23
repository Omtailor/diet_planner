import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { authService } from '../services/authService'
import { safeStorage, clearApiCache } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const activeProfileRequestRef = useRef(0)

  const invalidateProfileRequests = () => {
    activeProfileRequestRef.current += 1
  }

  const applyProfile = (profileData) => {
    setProfile(profileData)
    setUser({
      id: profileData?.id ?? null,
      username: profileData?.username || profileData?.user || 'user',
      email: profileData?.email || '',
    })
    return profileData
  }

  useEffect(() => {
    // Safety net — force-hide loader after 5s no matter what in case the network hangs
    const timeout = setTimeout(() => setLoading(false), 5000)

    const token = safeStorage.get('access_token')
    if (token) fetchProfile()
    else setLoading(false)

    return () => clearTimeout(timeout)
  }, [])

  const fetchProfile = async () => {
    const requestId = ++activeProfileRequestRef.current
    try {
      const res = await authService.getProfile()
      if (requestId !== activeProfileRequestRef.current) return null
      applyProfile(res.data)
      return res.data
    } catch (err) {
      if (requestId !== activeProfileRequestRef.current) return null
      const status = err.response?.status
      if (status === 401) {
        clearApiCache()
        safeStorage.remove('access_token')
        safeStorage.remove('refresh_token')
        setUser(null)
        setProfile(null)
      } else {
        setProfile(null)
      }
      return null
    } finally {
      if (requestId === activeProfileRequestRef.current) {
        setLoading(false)
      }
    }
  }

  const login = async (tokens, userData) => {
    invalidateProfileRequests()
    clearApiCache()
    try { sessionStorage.clear() } catch {}
    setLoading(true)
    safeStorage.set('access_token', tokens.access)
    safeStorage.set('refresh_token', tokens.refresh)
    setProfile(null)
    setUser(userData)
    try {
      const profileData = await fetchProfile()
      return profileData
    } catch {
      return null
    }
  }

  const logout = () => {
    invalidateProfileRequests()
    clearApiCache()
    try { sessionStorage.clear() } catch {}
    safeStorage.clear()
    setUser(null)
    setProfile(null)
    setLoading(false)
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