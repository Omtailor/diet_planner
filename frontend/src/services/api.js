import axios from 'axios'

// ── Base URL ───────────────────────────────────────────────────────────────
// Set VITE_API_BASE_URL in your .env files:
//   .env.development  → VITE_API_BASE_URL=http://127.0.0.1:8000/api
//   .env.production   → VITE_API_BASE_URL=https://your-backend.onrender.com/api
const BASE_URL = import.meta.env.VITE_API_BASE_URL

if (!BASE_URL) {
  console.error('[API] VITE_API_BASE_URL is not set. Check your .env file.')
}

// ── Safe storage — falls back to memory if localStorage is blocked ─────────
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
  },
}

// ── Axios instance ─────────────────────────────────────────────────────────
const API = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// ── Request interceptor — attach JWT ──────────────────────────────────────
API.interceptors.request.use((config) => {
  const token = safeStorage.get('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// ── Response interceptor — auto-refresh on 401 ───────────────────────────
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      try {
        const refresh = safeStorage.get('refresh_token')
        // ✅ Uses env var — not hardcoded URL
        const res = await axios.post(`${BASE_URL}/token/refresh/`, { refresh })
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