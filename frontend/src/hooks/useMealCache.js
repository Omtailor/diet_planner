import { useState, useEffect, useRef } from 'react'
import { getCacheKey, loadCacheFromSession, persistCacheToSession, getCacheEntry, setCacheEntry, removeCacheEntry, isFreshEntry } from '../utils/nutrition/cache'

export default function useMealCache(user, profile, mealService) {
  const cacheUserKey = getCacheKey(user, profile)
  const MEAL_CACHE_KEY = cacheUserKey ? `meal_cache:${cacheUserKey}` : null

  const cacheRef = useRef({})
  const inflightRef = useRef(new Map())

  const [cacheKey, setCacheKey] = useState(MEAL_CACHE_KEY)

  useEffect(() => {
    if (!MEAL_CACHE_KEY) {
      cacheRef.current = {}
      return
    }
    try {
      cacheRef.current = loadCacheFromSession(MEAL_CACHE_KEY)
    } catch {
      cacheRef.current = {}
    }
  }, [MEAL_CACHE_KEY])

  const persistCache = () => {
    persistCacheToSession(MEAL_CACHE_KEY, cacheRef.current)
  }

  const setCacheEntryWithPersist = (date, value) => {
    cacheRef.current = setCacheEntry(cacheRef.current, date, value, persistCache)
  }

  const removeCacheEntryWithPersist = (date) => {
    cacheRef.current = removeCacheEntry(cacheRef.current, date, persistCache)
  }

  const fetchMealForDate = async (date, { background = false, signal, forceRefresh = false } = {}) => {
    if (!forceRefresh) {
      const cached = getCacheEntry(cacheRef.current, date)

      if (cached && isFreshEntry(date, cached)) return cached.data

      if (inflightRef.current.has(date)) return inflightRef.current.get(date)
    }

    const reqOpts = signal ? { signal } : undefined
    const req = mealService.getDayMeal(date, reqOpts)
      .then((res) => {
        const data = res.data
        setCacheEntryWithPersist(date, { data, ts: Date.now() })
        return data
      })
      .catch((err) => {
        if (signal?.aborted) throw err
        const cached = getCacheEntry(cacheRef.current, date)
        if (!cached) {
          setCacheEntryWithPersist(date, { data: null, ts: Date.now(), empty: true })
        }
        throw err
      })
      .finally(() => {
        inflightRef.current.delete(date)
      })

    inflightRef.current.set(date, req)
    return req
  }

  const clearCache = () => {
    cacheRef.current = {}
    persistCache()
  }

  return {
    cacheKey,
    cacheRef,
    inflightRef,
    fetchMealForDate,
    getCacheEntry: (date) => getCacheEntry(cacheRef.current, date),
    setCacheEntry: setCacheEntryWithPersist,
    removeCacheEntry: removeCacheEntryWithPersist,
    clearCache,
  }
}
