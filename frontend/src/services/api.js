import axios from 'axios'

// Safe storage — falls back to memory if localStorage is blocked
const memStore = {}
export const safeStorage = {
  get: (key) => {
    try { return localStorage.getItem(key) }
    catch { return memStore[key] || null }
  },
  set: (key, val) => {
    try { localStorage.setItem(key, val) }
    catch { memStore[key] = val }
  },
  remove: (key) => {
    try { localStorage.removeItem(key) }
    catch { delete memStore[key] }
  },
  clear: () => {
    try { localStorage.clear() }
    catch { Object.keys(memStore).forEach(k => delete memStore[k]) }
  }
}

const API = axios.create({
  baseURL: 'http://127.0.0.1:8000/api',
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = safeStorage.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-refresh token on 401
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = safeStorage.get('refresh_token')
        const res = await axios.post('http://127.0.0.1:8000/api/token/refresh/', { refresh })
        safeStorage.set('access_token', res.data.access)
        original.headers.Authorization = `Bearer ${res.data.access}`
        return API(original)
      } catch {
        safeStorage.clear()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default API