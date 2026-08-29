import { useState, useEffect, useRef, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, RefreshCw, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { mealService } from '../../services/mealService'
import API from '../../services/api'
import { useAuth } from '../../context/AuthContext'

// Extracted utilities
import { getDateStr, getWeekDays } from '../../utils/date'
import { FONT, GLASS_WHITE } from '../../utils/nutrition/constants'
import { exportMealPdf } from '../../utils/nutrition/exportMealPdf'
import { isFreshEntry } from '../../utils/nutrition/cache'

// Extracted components
import Skeleton from '../../components/nutrition/Skeleton'
import EmptyState from '../../components/nutrition/EmptyState'
import GroceryCard from '../../components/nutrition/GroceryCard'
import CheatMealButton from '../../components/nutrition/CheatMealButton'
import DateStrip from '../../components/nutrition/DateStrip'
import NutritionHeader from '../../components/nutrition/NutritionHeader'
import SwipeMealCard from '../../components/nutrition/SwipeMealCard'
import GroceryModal from '../../components/nutrition/GroceryModal'
import GroceryRangeModal from '../../components/nutrition/GroceryRangeModal'
import ExportPdfModal from '../../components/nutrition/ExportPdfModal'
import CookingLoader from '../../components/nutrition/CookingLoader/CookingLoader'

// Extracted hooks
import useMealFetch from '../../hooks/useMealFetch'
import useMealAutoplay from '../../hooks/useMealAutoplay'

// ─── Main Nutrition Component ─────────────────────────────────────

export default function Nutrition() {
  const { profile, user } = useAuth()
  const navigate = useNavigate()
  const weekStripRef = useRef(null)
  const [selectedDate, setSelectedDate] = useState(getDateStr(0))
  
  // Additional refs needed for prefetch logic
  const prefetchTimeoutRef = useRef(null)
  const selectedFetchIdRef = useRef(0)
  const abortControllerRef = useRef(null)
  
  // Use extracted hooks
  const {
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
    prefetchAllHistory,
  } = useMealFetch(user, profile, mealService)

  const {
    activeSlot,
    displaySlot,
    cardVisible,
    handleSlotChange,
    switchSlot,
  } = useMealAutoplay()

  const [regenerating, setRegenerating] = useState(false)
  
  const [showGrocery, setShowGrocery] = useState(false)
  const [grocery, setGrocery] = useState(null)
  const [groceryLoading, setGroceryLoading] = useState(false)
  const [groceryError, setGroceryError] = useState(null)
  const [generatingNextWeek, setGeneratingNextWeek] = useState(false)
  const [, setNextWeekExists] = useState(false)
  const [latestPlanEndDate, setLatestPlanEndDate] = useState(null)  // always latest plan's end
  const [exportPdfLoading, setExportPdfLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStartDate, setExportStartDate] = useState(getDateStr(0))
  const [exportEndDate, setExportEndDate] = useState(getDateStr(6))
  const [showGroceryRangeModal, setShowGroceryRangeModal] = useState(false);
  const [groceryStartDate, setGroceryStartDate] = useState(getDateStr(0));
  const [groceryEndDate, setGroceryEndDate] = useState(getDateStr(6));
  const [showOnboardingBlocker, setShowOnboardingBlocker] = useState(false)
  const slots = ['breakfast', 'lunch', 'dinner']
  
  const cacheUserKey = user?.id ?? profile?.id ?? user?.username ?? profile?.username ?? null

  const isProfileComplete = () => Boolean(
    profile?.age && profile?.height_cm && profile?.weight_kg && profile?.gender
  )

  useEffect(() => {
    checkNextWeekPlan()
    // Prefetch all historical meal data in the background to populate cache
    prefetchAllHistory().then((data) => {
      if (data?.week_end_date) {
        setLatestPlanEndDate(data.week_end_date)
      }
    })
  }, [])

  useEffect(() => {
    fetchDayMeal(selectedDate)
    return () => {
      clearTimeout(prefetchTimeoutRef.current)
      if (abortControllerRef.current) {
        try { abortControllerRef.current.abort() } catch { }
      }
    }
  }, [selectedDate, cacheKey])

  useEffect(() => {
    if (!weekStripRef.current) return
    const selected = weekStripRef.current.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDate])

  const checkNextWeekPlan = async () => {
    try {
      const res = await mealService.getLatestPlan()
      const endDateStr = res.data?.week_end_date
      setLatestPlanEndDate(endDateStr || null)
      // Don't pre-check DayMeal — backend rejects duplicates; avoid stale client state
      setNextWeekExists(false)
    } catch {
      setLatestPlanEndDate(null)
      setNextWeekExists(false)
    }
  }

  const getAdjacentDates = (date, offsets = [-1, 1, -2, 2]) => {
    const base = new Date(date)
    return offsets.map((offset) => {
      const d = new Date(base)
      d.setDate(d.getDate() + offset)
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    })
  }

  const prefetchDate = async (date) => {
    const entry = getCacheEntry(date)
    if (entry && isFreshEntry(date, entry)) return
    if (inflightRef.current.has(date)) return
    try {
      await fetchMealForDate(date, { background: true })
    } catch {
      // ignore background misses
    }
  }

  const prefetchAdjacentDays = async (date) => {
    const dates = getAdjacentDates(date)
    // Filter out dates already fresh in cache
    const needed = dates.filter(d => {
      const entry = getCacheEntry(d)
      return !(entry && isFreshEntry(d, entry))
    })
    if (needed.length === 0) return

    // Use batch endpoint — 1 HTTP call instead of 4
    try {
      const res = await mealService.getBatchDayMeals(needed)
      const results = res.data?.results || {}
      for (const d of needed) {
        if (results[d]) {
          setCacheEntry(d, { data: results[d], ts: Date.now() })
        } else {
          // No plan for this date — cache as empty
          setCacheEntry(d, { data: null, ts: Date.now(), empty: true })
        }
      }
    } catch {
      // Fallback: fire individual requests in parallel
      await Promise.allSettled(needed.map(d => prefetchDate(d)))
    }
  }

  const scheduleAdjacentPrefetch = (date) => {
    clearTimeout(prefetchTimeoutRef.current)
    prefetchTimeoutRef.current = setTimeout(() => {
      prefetchAdjacentDays(date)
    }, 150)
  }

  const fetchDayMeal = async (date) => {
    const requestId = ++selectedFetchIdRef.current
    const cached = getCacheEntry(date)

    if (abortControllerRef.current) {
      try { abortControllerRef.current.abort() } catch { }
    }
    abortControllerRef.current = new AbortController()

    if (cached) {
      setDayMeal(cached.data)
      setLoading(false)
      if (isFreshEntry(date, cached)) {
        scheduleAdjacentPrefetch(date)
        return
      }
      // stale → background revalidation
    } else {
      setLoading(true)
    }

    try {
      const data = await fetchMealForDate(date, { signal: abortControllerRef.current.signal })
      if (requestId !== selectedFetchIdRef.current) return
      setDayMeal(data)
      scheduleAdjacentPrefetch(date)
    } catch {
      if (abortControllerRef.current?.signal?.aborted) return
      if (requestId !== selectedFetchIdRef.current) return
      if (!cached) setDayMeal(null)
    } finally {
      if (requestId === selectedFetchIdRef.current) setLoading(false)
    }
  }

  const handleDateChange = (dir) => {
    const [y, m, d] = selectedDate.split('-').map(Number)
    const date = new Date(y, m - 1, d)
    date.setDate(date.getDate() + dir)
    const yyyy = date.getFullYear()
    const mm = String(date.getMonth() + 1).padStart(2, '0')
    const dd = String(date.getDate()).padStart(2, '0')
    setSelectedDate(`${yyyy}-${mm}-${dd}`)
    handleSlotChange(0)
  }


  const handleRegenerate = async () => {
    if (!dayMeal) {
      toast("Generate a plan first!", {
        icon: "🍽️",
      });
      return;
    }

    setRegenerating(true);
    try {
      await mealService.regenerateDay(selectedDate);
      
      // Clear all caches so fresh data is fetched immediately
      clearAllCaches();
      
      // Await fresh fetch BEFORE showing success
      const data = await fetchMealForDate(selectedDate, { forceRefresh: true });
      setDayMeal(data);
      
      // Only show success AFTER data is loaded
      toast.success("Day meals regenerated!");
      
      if (navigator.vibrate) navigator.vibrate([30, 10, 30]);
    } catch {
      toast.error("Failed to regenerate");
    } finally {
      setRegenerating(false);
    }
  };

  const clearAllCaches = () => {
    // Clear both in-memory and persisted caches to force fresh fetches
    cacheRef.current = {}
    if (cacheKey) sessionStorage.removeItem(cacheKey)
    sessionStorage.removeItem('meal_cache')
    // Also clear Dashboard's cached meal data so it stays in sync
    if (cacheUserKey) sessionStorage.removeItem(`dash_meal_today:${cacheUserKey}`)
    sessionStorage.removeItem('dash_meal_today')
  }

  const handleGenerateNextWeek = async () => {
    // Pre-check BEFORE showing cooking loader
    if (!isProfileComplete()) {
      setShowOnboardingBlocker(true)
      return
    }
    setGeneratingNextWeek(true)

    try {
      const res = await mealService.generateNextWeek()
      
      // Clear ALL caches (in-memory + sessionStorage) BEFORE refetch
      clearAllCaches()
      
      // Refetch all historical data to populate cache with new plan
      await prefetchAllHistory()
      
      // Update metadata
      setNextWeekExists(true)
      if (res?.data?.week_end_date) {
        setLatestPlanEndDate(res.data.week_end_date)
      }
      
      // Jump to the first day of the newly generated plan
      const generatedStartStr =
        res?.data?.week_start_date ||
        (latestPlanEndDate
          ? (() => {
            const nextStart = new Date(latestPlanEndDate)
            nextStart.setDate(nextStart.getDate() + 1)
            const yyyy = nextStart.getFullYear()
            const mm = String(nextStart.getMonth() + 1).padStart(2, '0')
            const dd = String(nextStart.getDate()).padStart(2, '0')
            return `${yyyy}-${mm}-${dd}`
          })()
          : null)

      if (generatedStartStr) {
        setSelectedDate(generatedStartStr)
        handleSlotChange(0)
        // Fetch all 3 days immediately to display them without refresh
        const day1 = generatedStartStr
        const d1 = new Date(day1)
        const day2 = new Date(d1)
        day2.setDate(d1.getDate() + 1)
        const day2Str = `${day2.getFullYear()}-${String(day2.getMonth() + 1).padStart(2, '0')}-${String(day2.getDate()).padStart(2, '0')}`
        const day3 = new Date(d1)
        day3.setDate(d1.getDate() + 2)
        const day3Str = `${day3.getFullYear()}-${String(day3.getMonth() + 1).padStart(2, '0')}-${String(day3.getDate()).padStart(2, '0')}`
        
        // Fetch all 3 days in parallel
        await Promise.all([
          fetchDayMeal(day1),
          fetchMealForDate(day2Str, { background: true }),
          fetchMealForDate(day3Str, { background: true })
        ])
      }
      
      // Only show success AFTER data is loaded
      toast.success('Next 3 days plan ready! 🎉', {
        duration: 3500,
        style: { fontFamily: FONT, fontWeight: 700 },
      })
      
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail === 'PROFILE_INCOMPLETE') {
        setShowOnboardingBlocker(true)
      } else if (detail === 'Next plan already exists.') {
        setNextWeekExists(true)
        toast.success('Next plan already exists! 🗓️')
      } else {
        const msg = err?.response?.data?.message || 'Failed to generate next plan'
        toast.error(msg)
      }
    } finally {
      setGeneratingNextWeek(false)
    }
  }

  const getMealSlot = (slot) =>
    dayMeal?.meal_slots?.find(m => m.slot === slot)

  const handleGroceryRangeConfirm = async () => {
    setShowGroceryRangeModal(false);
    setGroceryError(null);
    setGrocery(null);
    setGroceryLoading(true);
    setShowGrocery(true);
    try {
      const url = `grocery?start_date=${groceryStartDate}&end_date=${groceryEndDate}`;
      const res = await API.get(url);
      setGrocery(res.data);

      if (res.data.is_partial) {
        const fmt = (d) =>
          new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
        setGroceryError({
          type: 'partial',
          message: `Grocery list shown until ${fmt(res.data.actual_end_date)} — no plan generated beyond that.`,
        });
      }
    } catch (err) {
      if (err?.response?.data?.no_plan) {
        setGroceryError({
          type: 'no_plan',
          message: 'No meal plan found for this range. Generate a plan first.',
        });
      } else {
        setGroceryError({
          type: 'error',
          message: 'Could not load grocery list. Please try again.',
        });
      }
    } finally {
      setGroceryLoading(false);
    }
  };

  const toggleItem = async (itemId, currentChecked) => {
    try {
      await API.patch(`/grocery/check/${itemId}/`)
      setGrocery(prev => ({
        ...prev,
        items: prev.items.map(i =>
          i.id === itemId ? { ...i, is_checked: !currentChecked } : i
        )
      }))
    } catch {
      toast.error('Failed to update item')
    }
  }

  const handleExportPdf = async () => {
    setShowExportModal(false)
    await exportMealPdf(exportStartDate, exportEndDate, mealService, setExportPdfLoading)
  }

  const weekDays = useMemo(() => getWeekDays(selectedDate), [selectedDate])
  const hasPlan = !!dayMeal

  // ── Onboarding Blocker UI (full-page overlay) ─────────────────────────────
  if (showOnboardingBlocker) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px', gap: '0',
        animation: 'fadeUp 0.3s ease-out',
      }}>
        {/* Illustration */}
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>📋</div>

        {/* Heading */}
        <h2 style={{
          fontFamily: FONT, fontSize: '1.5rem', fontWeight: 800,
          color: 'var(--color-text)', textAlign: 'center',
          letterSpacing: '-0.3px', marginBottom: '10px',
        }}>
          Complete Your Profile First
        </h2>

        {/* Subtext */}
        <p style={{
          fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
          color: 'var(--color-text-muted)', textAlign: 'center',
          maxWidth: '260px', lineHeight: 1.6, marginBottom: '32px',
        }}>
          We need a few details about you — age, weight, goal, and diet preference — to build a personalised meal plan.
        </p>

        {/* Steps hint */}
        <div style={{
          width: '100%', maxWidth: '300px',
          background: 'rgba(52,199,89,0.06)',
          border: '1px solid rgba(52,199,89,0.2)',
          borderRadius: '16px', padding: '16px 20px',
          marginBottom: '28px', display: 'flex',
          flexDirection: 'column', gap: '10px',
        }}>
          {[
            { emoji: '👤', text: 'Basic info — age, gender, city' },
            { emoji: '⚖️', text: 'Body stats — height & weight' },
            { emoji: '🎯', text: 'Your goal — fat loss, muscle gain...' },
            { emoji: '🥗', text: 'Diet preference — veg, non-veg, jain' },
          ].map(({ emoji, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.2rem' }}>{emoji}</span>
              <span style={{
                fontFamily: FONT, fontSize: '0.85rem',
                fontWeight: 600, color: 'var(--color-text)',
              }}>{text}</span>
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <button
          onClick={() => navigate('/onboarding')}
          style={{
            width: '100%', maxWidth: '300px',
            padding: '16px', background: 'var(--color-accent)',
            border: 'none', borderRadius: '16px',
            color: '#ffffff', fontFamily: FONT,
            fontWeight: 800, fontSize: '1rem',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(52,199,89,0.35)',
            marginBottom: '12px',
          }}
        >
          Complete Onboarding →
        </button>

        {/* Dismiss */}
        <button
          onClick={() => setShowOnboardingBlocker(false)}
          style={{
            width: '100%', maxWidth: '300px',
            padding: '12px', background: 'transparent',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '16px', color: 'var(--color-text-muted)',
            fontFamily: FONT, fontWeight: 600,
            fontSize: '0.9rem', cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>
    )
  }

  return (
    <div style={S.pageWrap}>

      {/* ── Generation Loading Overlay ── */}
      {generatingNextWeek && (
        <CookingLoader
          dietType={profile?.diet_preference || 'non-veg'}
          onDone={() => {
            // CookingLoader's animation finished — loader will unmount when
            // generatingNextWeek flips to false (handled in handleGenerateNextWeek)
          }}
        />
      )}

      {/* ── Week Strip ── */}
      <DateStrip
        weekStripRef={weekStripRef}
        weekDays={weekDays}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        switchSlot={switchSlot}
        prefetchDate={prefetchDate}
      />

      {/* ── Date Header ── */}
      <NutritionHeader
        selectedDate={selectedDate}
        handleDateChange={handleDateChange}
      />

      {/* ── Slot Tabs ── */}
      <div style={S.slotTabs}>
        {slots.map((slot, i) => (
          <button key={slot}
            onClick={() => handleSlotChange(i)}
            style={{
              flex: 1, padding: '12px 6px',
              background: activeSlot === i ? 'var(--color-accent)' : 'rgba(255,255,255,0.4)',
              border: '1px solid',
              borderColor: activeSlot === i ? 'var(--color-accent)' : 'rgba(0,0,0,0.04)',
              borderRadius: '16px',
              fontSize: '0.85rem', fontWeight: activeSlot === i ? 700 : 600,
              color: activeSlot === i ? '#ffffff' : 'var(--color-text-muted)',
              fontFamily: FONT, cursor: 'pointer',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '6px',
              boxShadow: activeSlot === i ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
            }}>
            {slot === 'breakfast' ? '🌅' : slot === 'lunch' ? '☀️' : '🌙'}
            {slot.charAt(0).toUpperCase() + slot.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Regenerate Bar ── */}
      {hasPlan && (
        <div style={S.regenBar}>
          <p style={{
            fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600,
            fontFamily: FONT
          }}>
            {dayMeal?.is_fasting_day ? '🙏 Fasting day' : '📅 Regular day'}
          </p>
          <button onClick={handleRegenerate} disabled={regenerating} style={S.regenBtn}>
            {regenerating
              ? <Loader2 size={16} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <RefreshCw size={16} />}
            <span style={{ fontSize: '0.8rem', fontWeight: 600, fontFamily: FONT }}>
              Regenerate
            </span>
          </button>
        </div>
      )}

      {/* ── Meal Swipe Card ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Skeleton height="80px" radius="24px" />
          <Skeleton height="320px" radius="24px" />
          <Skeleton height="60px" radius="20px" />
        </div>
      ) : dayMeal ? (
        <div style={{
          opacity: cardVisible ? 1 : 0,
          transform: cardVisible ? 'translateY(0px)' : 'translateY(12px)',
          transition: 'opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)',
        }}>
          <SwipeMealCard
            slot={slots[displaySlot]}
            meal={getMealSlot(slots[displaySlot])}
            onViewDetail={() => navigate(`/nutrition/${selectedDate}`, { state: { slot: slots[displaySlot] } })}
          />
        </div>
      ) : (
        <EmptyState
          onGenerateNextWeek={handleGenerateNextWeek}
          generatingNextWeek={generatingNextWeek}
        />
      )}

      {/* ── Slot Dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
        {slots.map((_, i) => (
          <button key={i} onClick={() => handleSlotChange(i)} style={{
            width: displaySlot === i ? '24px' : '8px',
            height: '8px',
            background: displaySlot === i ? 'var(--color-accent)' : 'rgba(0,0,0,0.1)',
            borderRadius: '999px', border: 'none', cursor: 'pointer',
            transition: 'all 200ms ease', padding: 0,
          }} />
        ))}
      </div>

      {/* ── Next Week Plan ── */}
      <div style={{ height: '8px' }} />
      <button
        onClick={handleGenerateNextWeek}
        disabled={generatingNextWeek}
        style={{
          width: '100%', ...GLASS_WHITE,
          borderRadius: '20px', padding: '16px',
          display: 'flex', alignItems: 'center', gap: '14px',
          cursor: generatingNextWeek ? 'not-allowed' : 'pointer',
          border: '1px solid rgba(52,199,89,0.25)',
          opacity: generatingNextWeek ? 0.7 : 1,
          transition: 'all 180ms ease',
        }}
      >
        <div style={{
          width: '48px', height: '48px',
          background: 'rgba(52,199,89,0.15)',
          borderRadius: '14px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.4rem', flexShrink: 0,
        }}>
          🗓️
        </div>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <p style={{
            fontSize: '1rem', fontWeight: 700,
            color: 'var(--color-text)', fontFamily: FONT,
          }}>
            Generate Next 3 days Plan
          </p>
          <p style={{
            fontSize: '0.8rem', fontWeight: 500,
            fontFamily: FONT, marginTop: '2px',
            color: 'var(--color-text-muted)',
          }}>
            {!latestPlanEndDate
              ? 'No plan yet — generate your first plan!'
              : (() => {
                const start = new Date(latestPlanEndDate)
                start.setDate(start.getDate() + 1)
                const today = new Date(); today.setHours(0, 0, 0, 0)
                const displayStart = start > today ? start : today
                const displayEnd = new Date(displayStart)
                displayEnd.setDate(displayStart.getDate() + 2)
                const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                return `${fmt(displayStart)} – ${fmt(displayEnd)} · 3 day plan`
              })()}
          </p>
        </div>
        {generatingNextWeek
          ? <Loader2 size={20} color="var(--color-accent)"
            style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          : <ChevronRight size={20}
            color="var(--color-accent)"
            style={{ flexShrink: 0 }} />
        }
      </button>

      {/* ── Bottom Action Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <GroceryCard onView={() => {
          if (!isProfileComplete()) {
            setShowOnboardingBlocker(true)
            return
          }
          setShowGroceryRangeModal(true)
        }} />
        <CheatMealButton onLog={() => {
          if (!isProfileComplete()) {
            setShowOnboardingBlocker(true)
            return
          }
          navigate('/cheat-meal')
        }} />

        {/* Export PDF */}
        <button onClick={() => {
          if (!isProfileComplete()) {
            setShowOnboardingBlocker(true)
            return
          }
          setShowExportModal(true)
        }} disabled={exportPdfLoading}
          style={{
            width: '100%',
            ...GLASS_WHITE,
            borderRadius: '20px', padding: '16px',
            display: 'flex', alignItems: 'center', gap: '14px',
            cursor: exportPdfLoading ? 'not-allowed' : 'pointer',
            border: '1px solid rgba(0,0,0,0.06)',
            opacity: exportPdfLoading ? 0.7 : 1,
            transition: 'all 180ms ease',
          }}
        >
          <div style={{
            width: '48px', height: '48px',
            background: 'rgba(255, 59, 48, 0.12)', borderRadius: '14px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.4rem', flexShrink: 0
          }}>📄</div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: FONT }}>
              Export Meal Plan as PDF
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: '2px' }}>
              Full meal details — calories, macros & ingredients
            </p>
          </div>
          {exportPdfLoading
            ? <Loader2 size={20} color="var(--color-text-faint)" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
            : <ChevronRight size={20} color="var(--color-text-faint)" style={{ flexShrink: 0 }} />}
        </button>
      </div>
      <div style={{ height: '16px' }} />

      {/* Grocery Range Modal */}
      <GroceryRangeModal
        show={showGroceryRangeModal}
        onClose={() => setShowGroceryRangeModal(false)}
        groceryStartDate={groceryStartDate}
        setGroceryStartDate={setGroceryStartDate}
        groceryEndDate={groceryEndDate}
        setGroceryEndDate={setGroceryEndDate}
        onConfirm={handleGroceryRangeConfirm}
      />

      {/* Export PDF Modal */}
      <ExportPdfModal
        show={showExportModal}
        onClose={() => setShowExportModal(false)}
        exportStartDate={exportStartDate}
        setExportStartDate={setExportStartDate}
        exportEndDate={exportEndDate}
        setExportEndDate={setExportEndDate}
        onExport={handleExportPdf}
      />
      {/* Grocery Modal */}
      <GroceryModal
        show={showGrocery}
        onClose={() => setShowGrocery(false)}
        grocery={grocery}
        groceryLoading={groceryLoading}
        groceryError={groceryError}
        toggleItem={toggleItem}
      />

      {/* Global CSS mapped to the new theme variables */}
      <style>{`
        :root {
          --color-accent: #34C759;
          --color-text: #1C1C1E;
          --color-text-muted: #636366;
          --color-text-faint: #8E8E93;
        }
        body, #root { 
          background: #F2F2F7 !important; 
          color: var(--color-text);
          margin: 0;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%) }
          100% { transform: translateX(100%) }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }

        .week-strip::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}

// ─── Local Layout Styles ───────────────────────────────────────
const S = {
  pageWrap: {
    display: 'flex', flexDirection: 'column',
    gap: '16px', padding: '16px',
  },
  slotTabs: {
    display: 'flex', gap: '8px',
    ...GLASS_WHITE, padding: '8px', borderRadius: '24px',
  },
  regenBar: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
  },
  regenBtn: {
    display: 'flex', alignItems: 'center', gap: '6px',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.05)',
    borderRadius: '12px', padding: '8px 14px',
    color: 'var(--color-text)', cursor: 'pointer',
    transition: 'all 180ms ease', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
}