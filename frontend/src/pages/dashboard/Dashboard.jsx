import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { RefreshCw, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

import { useAuth } from '../../context/AuthContext'
import { mealService } from '../../services/mealService'

// ── Hooks ────────────────────────────────────────────────────────
import useDashboardMeal from '../../hooks/useDashboardMeal'

// ── Utils ────────────────────────────────────────────────────────
import { FONT, MACRO_CONFIG, MACRO_RATIOS, STATUS_CONFIG } from '../../utils/dashboard/constants'
import { getGreeting, profileGreetingName, profileAvatarInitial, formatDate } from '../../utils/dashboard/greeting'
import {
  pageWrapper, ambientBg,
  greetingSection, greetingTime, greetingName, avatarCircle,
  glassCard, sectionLabel, statusBannerExtra,
  regenBtn, ghostBtn, accentBtn, emptyState,
} from '../../utils/dashboard/styles'

// ── Components ───────────────────────────────────────────────────
import DashboardGlobalStyles from '../../components/dashboard/DashboardGlobalStyles'
import SkeletonBlock from '../../components/dashboard/SkeletonBlock'
import CalorieRing from '../../components/dashboard/CalorieRing'
import MacroBar from '../../components/dashboard/MacroBar'
import MealPreviewCard from '../../components/dashboard/MealPreviewCard'
import WeightCard from '../../components/dashboard/WeightCard'
import BMICard from '../../components/dashboard/BMICard'
import QuoteCard from '../../components/dashboard/QuoteCard'
import WeightModal from '../../components/dashboard/WeightModal'
import OnboardingGate from '../../components/dashboard/OnboardingGate'
import OnboardingBlocker from '../../components/dashboard/OnboardingBlocker'
import QuickActions from '../../components/dashboard/QuickActions'

// ─── Dashboard ──────────────────────────────────────────────────

export default function Dashboard() {
  const navigate = useNavigate()
  const { profile, fetchProfile, user, loading: authLoading, onboardingComplete } = useAuth()

  const [showWeightModal, setShowWeightModal] = useState(false)
  const [showOnboardingBlocker, setShowOnboardingBlocker] = useState(false)

  // ── User-scoped cache key ────────────────────────────────────
  const cacheUserKey = user?.id ?? profile?.id ?? user?.username ?? profile?.username ?? null

  // ── Meal state + fetching ────────────────────────────────────
  const {
    dayMeal, loadingMeal, regenerating,
    today, fetchTodayMeal, regenerateMeal,
  } = useDashboardMeal(cacheUserKey, onboardingComplete)

  // ── Derived values ───────────────────────────────────────────
  const hasMealPlan = !!dayMeal

  const getMealSlot = useCallback(
    (slot) => dayMeal?.meal_slots?.find((m) => m.slot === slot),
    [dayMeal],
  )

  /** Calories consumed based on time-of-day cutoffs */
  const consumedCals = useMemo(() => {
    if (!dayMeal?.meal_slots) return 0
    const timeInMins = new Date().getHours() * 60 + new Date().getMinutes()
    const MEAL_TIMES = { breakfast: 8 * 60, lunch: 13 * 60, dinner: 20 * 60 + 30 }
    return dayMeal.meal_slots.reduce((sum, m) => {
      const mealTime = MEAL_TIMES[m.slot]
      if (mealTime !== undefined && timeInMins >= mealTime) return sum + (m.calories || 0)
      return sum
    }, 0)
  }, [dayMeal])

  /** Macros consumed based on the same time-of-day cutoffs */
  const macros = useMemo(() => {
    if (!dayMeal?.meal_slots) return { protein: 0, carbs: 0, fats: 0 }
    const timeInMins = new Date().getHours() * 60 + new Date().getMinutes()
    const MEAL_TIMES = { breakfast: 8 * 60, lunch: 13 * 60, dinner: 20 * 60 + 30 }
    return dayMeal.meal_slots.reduce((acc, m) => {
      const mealTime = MEAL_TIMES[m.slot]
      if (mealTime === undefined || timeInMins < mealTime) return acc
      return {
        protein: acc.protein + (m.protein_g || 0),
        carbs: acc.carbs + (m.carbs_g || 0),
        fats: acc.fats + (m.fats_g || 0),
      }
    }, { protein: 0, carbs: 0, fats: 0 })
  }, [dayMeal])

  const targetCals = profile?.target_calories ?? 2000
  const targetProtein = Math.round((targetCals * MACRO_RATIOS.protein.ratio) / MACRO_RATIOS.protein.kcalPerGram)
  const targetCarbs = Math.round((targetCals * MACRO_RATIOS.carbs.ratio) / MACRO_RATIOS.carbs.kcalPerGram)
  const targetFats = Math.round((targetCals * MACRO_RATIOS.fats.ratio) / MACRO_RATIOS.fats.kcalPerGram)

  const macroTargets = { protein: targetProtein, carbs: targetCarbs, fats: targetFats }

  const plannedTargetCals = hasMealPlan ? targetCals : 0
  const status = hasMealPlan ? (dayMeal?.status || 'on_track') : null
  const sc = hasMealPlan
    ? (STATUS_CONFIG[status] || STATUS_CONFIG.on_track)
    : { label: 'No plan yet', color: 'var(--color-text-faint)' }

  // ── Handlers ─────────────────────────────────────────────────

  const handleRegenerate = async () => {
    if (!dayMeal) {
      toast('Generate a plan first!', { icon: '🍽️' })
      return
    }
    await regenerateMeal({
      cacheUserKey,
      onSuccess: () => toast.success("Today's meals refreshed!"),
      onError: () => toast.error('Failed to regenerate meals'),
    })
  }

  const handleUpdateWeight = () => {
    if (!onboardingComplete) { setShowOnboardingBlocker(true); return }
    setShowWeightModal(true)
  }

  const handleGeneratePlan = () => {
    if (!onboardingComplete) { setShowOnboardingBlocker(true); return }
    // Bust stale cache entries before generating
    const dashKey = cacheUserKey ? `dash_meal_today:${cacheUserKey}` : null
    if (dashKey) sessionStorage.removeItem(dashKey)
    sessionStorage.removeItem('dash_meal_today')
    mealService.generatePlan().then(() => fetchTodayMeal(true))
  }

  // ── Auth loading spinner ──────────────────────────────────────

  if (authLoading) {
    return (
      <div style={{
        minHeight: '100dvh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#F2F2F7',
      }}>
        <div style={{
          width: '32px', height: '32px',
          border: '3px solid rgba(52, 199, 89, 0.2)',
          borderTop: '3px solid #34C759',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    )
  }

  // ── Onboarding gate ───────────────────────────────────────────

  if (!onboardingComplete) {
    return <OnboardingGate onCompleteOnboarding={() => navigate('/onboarding')} />
  }

  // ── Main render ───────────────────────────────────────────────

  return (
    <div style={pageWrapper}>
      <DashboardGlobalStyles />

      {/* ── Ambient Background ── */}
      <div style={ambientBg} />

      {/* ── Greeting ── */}
      <div style={greetingSection} className="dash-fadeUp">
        <div>
          <p style={greetingTime}>{formatDate()}</p>
          <h1 style={greetingName}>
            {getGreeting()},{' '}
            <span style={{ color: 'var(--color-accent)' }}>
              {profileGreetingName(profile)} 👋
            </span>
          </h1>
        </div>
        <div style={avatarCircle}>
          {profileAvatarInitial(profile)}
        </div>
      </div>

      {/* ── Status Banner ── */}
      <div style={{ ...glassCard, ...statusBannerExtra }} className="dash-fadeUp dash-delay-1">
        <div>
          <p style={sectionLabel}>Today's Target</p>
          <p style={{
            fontFamily: FONT,
            fontSize: '1.9rem', fontWeight: 800,
            color: 'var(--color-text)', lineHeight: 1, marginTop: '4px',
          }}>
            {plannedTargetCals}
            <span style={{
              fontSize: '0.875rem', fontWeight: 500,
              color: 'var(--color-text-muted)', marginLeft: '4px',
            }}>kcal</span>
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={sectionLabel}>Status</p>
          <p style={{
            fontSize: '0.875rem', fontWeight: 700, color: sc.color,
            fontFamily: "'General Sans', sans-serif", marginTop: '4px',
          }}>{sc.label}</p>
        </div>
      </div>

      {/* ── Calorie Ring + Macros ── */}
      <div style={glassCard} className="dash-fadeUp dash-delay-2">
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', marginBottom: '16px',
        }}>
          <p style={sectionLabel}>Today's Calories</p>
          <button onClick={handleRegenerate} disabled={regenerating} style={regenBtn}>
            {regenerating
              ? <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />
              : <RefreshCw size={13} />}
            <span style={{
              fontSize: '0.78rem',
              fontFamily: "'Satoshi', sans-serif", fontWeight: 500,
            }}>Regenerate</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {/* Ring / Skeleton */}
          {loadingMeal ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', width: 148 }}>
              <SkeletonBlock height="148px" radius="50%" width="148px" />
              <SkeletonBlock height="14px" radius="8px" width="100%" />
              <SkeletonBlock height="14px" radius="8px" width="100%" />
              <SkeletonBlock height="14px" radius="8px" width="100%" />
            </div>
          ) : (
            <CalorieRing consumed={consumedCals} target={plannedTargetCals} />
          )}

          {/* Macro bars / Skeleton / Empty */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {loadingMeal ? (
              <>
                <SkeletonBlock height="14px" radius="8px" />
                <SkeletonBlock height="14px" radius="8px" />
                <SkeletonBlock height="14px" radius="8px" />
              </>
            ) : hasMealPlan ? (
              MACRO_CONFIG.map(({ key, label, trackColor, glowColor }) => (
                <MacroBar
                  key={key}
                  label={label}
                  value={macros[key]}
                  max={macroTargets[key]}
                  trackColor={trackColor}
                  glowColor={glowColor}
                />
              ))
            ) : (
              <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                minHeight: '148px', padding: '12px 6px', gap: '8px',
              }}>
                <p style={{
                  fontFamily: FONT, fontWeight: 700, color: 'var(--color-text)',
                  fontSize: '0.95rem',
                }}>
                  No meal plan generated for today
                </p>
                <p style={{
                  fontFamily: FONT, fontSize: '0.82rem', color: 'var(--color-text-muted)',
                  lineHeight: 1.5,
                }}>
                  Generate a plan to see today's calorie target and macro progress.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Actions ── */}
      <QuickActions onUpdateWeight={handleUpdateWeight} />

      {/* ── Today's Meals ── */}
      <div style={glassCard}>
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <p style={sectionLabel}>Today's Meals</p>
          <button onClick={() => navigate('/nutrition')} style={ghostBtn} className="see-all-btn">
            See All <span className="see-all-arrow">→</span>
          </button>
        </div>

        {loadingMeal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {[1, 2, 3].map(i => <SkeletonBlock key={i} height="64px" radius="14px" />)}
          </div>
        ) : dayMeal ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {['breakfast', 'lunch', 'dinner'].map((slot, i) => (
              <MealPreviewCard
                key={slot} slot={slot} index={i}
                meal={getMealSlot(slot)}
                onTap={() => navigate(`/nutrition/${today}`)}
              />
            ))}
          </div>
        ) : (
          <div style={emptyState}>
            <span style={{ fontSize: '2rem' }}>🍽️</span>
            <p style={{
              fontSize: '0.9rem', color: 'var(--color-text-muted)',
              fontFamily: "'General Sans', sans-serif", textAlign: 'center',
            }}>No meal plan yet</p>
            <button onClick={handleGeneratePlan} style={{ ...accentBtn, marginTop: '4px' }}>
              Generate Plan
            </button>
          </div>
        )}
      </div>

      {/* ── Weight Tracker ── */}
      <WeightCard profile={profile} onUpdate={handleUpdateWeight} />

      {/* ── BMI ── */}
      <BMICard profile={profile} />

      {/* ── Quote ── */}
      <QuoteCard />

      <div style={{ height: '8px' }} />

      {/* ── Onboarding Blocker overlay ── */}
      {showOnboardingBlocker && (
        <OnboardingBlocker onDismiss={() => setShowOnboardingBlocker(false)} />
      )}

      {/* ── Weight Modal ── */}
      {showWeightModal && (
        <WeightModal
          current={profile?.weight_kg}
          onClose={() => setShowWeightModal(false)}
          onSave={fetchProfile}
        />
      )}
    </div>
  )
}
