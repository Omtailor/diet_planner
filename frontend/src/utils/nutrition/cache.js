import { getDateStr } from '../date'

export const MEAL_CACHE_TTL = 60 * 1000
export const PAST_MEAL_TTL = 10 * 60 * 1000
export const EMPTY_CACHE_TTL = 30 * 1000

export function getCacheKey(user, profile) {
  return user?.id ?? profile?.id ?? user?.username ?? profile?.username ?? null
}

export function getTTL(date, entry) {
  const today = getDateStr(0)
  if (entry?.empty) return EMPTY_CACHE_TTL
  return date < today ? PAST_MEAL_TTL : MEAL_CACHE_TTL
}

export function isFreshEntry(date, entry) {
  if (!entry) return false
  return Date.now() - entry.ts < getTTL(date, entry)
}

export function loadCacheFromSession(cacheKey) {
  if (!cacheKey) return {}
  try {
    return JSON.parse(sessionStorage.getItem(cacheKey) || '{}')
  } catch {
    return {}
  }
}

export function persistCacheToSession(cacheKey, cache) {
  if (!cacheKey) return
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(cache))
  } catch { }
}

export function getCacheEntry(cache, date) {
  return cache[date]
}

export function setCacheEntry(cache, date, value, persistFn) {
  const next = { ...cache, [date]: value }
  if (persistFn) persistFn(next)
  return next
}

export function removeCacheEntry(cache, date, persistFn) {
  const next = { ...cache }
  delete next[date]
  if (persistFn) persistFn(next)
  return next
}
