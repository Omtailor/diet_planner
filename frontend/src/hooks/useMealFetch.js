import { useState, useEffect } from 'react'
import useMealCache from './useMealCache'

export default function useMealFetch(user, profile, mealService) {
  const {
    cacheKey,
    cacheRef,
    inflightRef,
    fetchMealForDate,
    getCacheEntry,
    setCacheEntry,
    clearCache,
  } = useMealCache(user, profile, mealService)

  const [dayMeal, setDayMeal] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setDayMeal(null)
    setLoading(true)
  }, [cacheKey])

  const prefetchAllHistory = async () => {
    if (!cacheKey) return null

    const cacheKeys = Object.keys(cacheRef.current)
    if (cacheKeys.length > 10) return null

    try {
      const res = await mealService.getAllDays()
      const dayMeals = res.data?.day_meals || []

      const now = Date.now()
      dayMeals.forEach(dm => {
        if (dm.date) {
          setCacheEntry(dm.date, { data: dm, ts: now })
        }
      })

      return res.data
    } catch (err) {
      if (err?.response?.status !== 404) {
        console.warn('[Nutrition] Failed to prefetch history:', err)
      }
      return null
    }
  }

  return {
    dayMeal,
    setDayMeal,
    loading,
    setLoading,
    cacheKey,
    cacheRef,
    inflightRef,
    fetchMealForDate,
    getCacheEntry,
    setCacheEntry,
    clearCache,
    prefetchAllHistory,
  }
}
