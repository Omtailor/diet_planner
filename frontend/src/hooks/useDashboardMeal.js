import { useState, useRef, useEffect } from 'react'
import { mealService } from '../services/mealService'
import { DASH_MEAL_TTL, REFETCH_COOLDOWN } from '../utils/dashboard/constants'
import { getDateStr } from '../utils/date'

/**
 * Handles today's meal fetching, sessionStorage caching, and regeneration
 * for the Dashboard page.
 *
 * @param {string|null} cacheUserKey  – unique key scoped to the current user
 * @param {boolean}     onboardingComplete – skip fetching until onboarding is done
 */
export default function useDashboardMeal(cacheUserKey, onboardingComplete) {
  const [dayMeal, setDayMeal]       = useState(null)
  const [loadingMeal, setLoadingMeal] = useState(true)
  const [regenerating, setRegenerating] = useState(false)

  const DASH_MEAL_KEY = cacheUserKey ? `dash_meal_today:${cacheUserKey}` : null
  const lastFetchRef  = useRef(null)
  const today         = getDateStr()   // YYYY-MM-DD for the local date

  // ─── Re-fetch whenever the user key or onboarding state changes ──
  useEffect(() => {
    if (!onboardingComplete) return
    setDayMeal(null)
    lastFetchRef.current = null
    fetchTodayMeal()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [DASH_MEAL_KEY, onboardingComplete])

  const fetchTodayMeal = async (forceRefresh = false) => {
    const now = Date.now()

    // Cooldown guard – skip if we recently fetched and have data
    if (
      !forceRefresh &&
      lastFetchRef.current &&
      now - lastFetchRef.current < REFETCH_COOLDOWN &&
      dayMeal
    ) {
      return
    }

    // Try sessionStorage cache first
    if (!forceRefresh && DASH_MEAL_KEY) {
      try {
        const raw = sessionStorage.getItem(DASH_MEAL_KEY)
        if (raw) {
          const { data, ts } = JSON.parse(raw)
          const isFresh = Date.now() - ts < DASH_MEAL_TTL
          setDayMeal(data)
          setLoadingMeal(false)
          lastFetchRef.current = Date.now()
          if (isFresh) return
        }
      } catch { /* corrupted cache – fall through to network */ }
    }

    if (!dayMeal) setLoadingMeal(true)
    try {
      const res = await mealService.getDayMeal(today)
      setDayMeal(res.data)
      if (DASH_MEAL_KEY) {
        sessionStorage.setItem(DASH_MEAL_KEY, JSON.stringify({ data: res.data, ts: Date.now() }))
      }
    } catch {
      setDayMeal(null)
    } finally {
      setLoadingMeal(false)
      lastFetchRef.current = Date.now()
    }
  }

  const regenerateMeal = async ({ onSuccess, onError, cacheUserKey: userKey }) => {
    setRegenerating(true)
    try {
      await mealService.regenerateDay(today)
      // Bust all relevant cache entries
      if (DASH_MEAL_KEY) sessionStorage.removeItem(DASH_MEAL_KEY)
      sessionStorage.removeItem('dash_meal_today')
      if (userKey) sessionStorage.removeItem(`meal_cache:${userKey}`)
      sessionStorage.removeItem('meal_cache')
      // Reset cooldown so the re-fetch isn't skipped
      lastFetchRef.current = null
      await fetchTodayMeal(true)
      if (onSuccess) onSuccess()
      if (navigator.vibrate) navigator.vibrate([30, 10, 30])
    } catch {
      if (onError) onError()
    } finally {
      setRegenerating(false)
    }
  }

  return {
    dayMeal,
    loadingMeal,
    regenerating,
    today,
    fetchTodayMeal,
    regenerateMeal,
  }
}
