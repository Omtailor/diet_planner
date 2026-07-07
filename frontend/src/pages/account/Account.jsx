import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { groceryService } from '../../services/groceryService'
import API from '../../services/api'
import { getDateStr } from '../../utils/date'
import { GOAL_OPTIONS, DIET_OPTIONS, MENU_ITEMS } from '../../utils/account/constants'
import { S } from '../../utils/account/styles'
import AccountGlobalStyles from '../../components/account/AccountGlobalStyles'
import AppInfoCard from '../../components/account/AppInfoCard'
import BodyStatsModal from '../../components/account/BodyStatsModal'
import CheatMealHistorySection from '../../components/account/CheatMealHistorySection'
import FastingModal from '../../components/account/FastingModal'
import GoalsDietModal from '../../components/account/GoalsDietModal'
import GroceryRangeModal from '../../components/account/GroceryRangeModal'
import GrocerySheet from '../../components/account/GrocerySheet'
import GymActivityModal from '../../components/account/GymActivityModal'
import LogoutButton from '../../components/account/LogoutButton'
import MenuList from '../../components/account/MenuList'
import OnboardingBlocker from '../../components/account/OnboardingBlocker'
import PersonalInfoModal from '../../components/account/PersonalInfoModal'
import ProfileHeader from '../../components/account/ProfileHeader'
import StatsRow from '../../components/account/StatsRow'

export default function Account() {
  const navigate = useNavigate()
  const { profile, logout, fetchProfile, user } = useAuth()
  const [activeSection, setActiveSection] = useState(null)
  const [draft, setDraft] = useState({})
  const [modalSaving, setModalSaving] = useState(false)
  const [grocery, setGrocery] = useState(null)
  const [groceryLoading, setGroceryLoading] = useState(false)
  const [groceryError, setGroceryError] = useState(null)
  const [showGroceryRangeModal, setShowGroceryRangeModal] = useState(false)
  const [groceryStartDate, setGroceryStartDate] = useState(getDateStr(0))
  const [groceryEndDate, setGroceryEndDate] = useState(getDateStr(6))
  const [showGrocerySheet, setShowGrocerySheet] = useState(false)
  const [showOnboardingBlocker, setShowOnboardingBlocker] = useState(false)

  const menuItems = MENU_ITEMS.map((item) => (
    item.getSub ? { ...item, sub: item.getSub(profile) } : item
  ))

  useEffect(() => {
    if (!activeSection || !profile) return

    if (activeSection === 'personal') {
      setDraft({
        name: user?.username || '',
        age: profile?.age ?? '',
        city: profile?.city ?? '',
      })
      return
    }

    if (activeSection === 'body') {
      setDraft({
        weight_kg: profile?.weight_kg ?? '',
        height_cm: profile?.height_cm ?? '',
      })
      return
    }

    if (activeSection === 'goals') {
      setDraft({
        goal: profile?.goal ?? 'maintenance',
        diet_preference: profile?.diet_preference ?? 'veg',
      })
      return
    }

    if (activeSection === 'gym') {
      setDraft({
        has_gym: profile?.has_gym ?? false,
        health_time_minutes: profile?.health_time_minutes ?? 60,
      })
      return
    }

    if (activeSection === 'fasting') {
      setDraft({
        is_fasting: profile?.is_fasting ?? false,
        fasting_days: profile?.fasting_days ?? '',
        fasting_type: profile?.fasting_type ?? '',
      })
    }
  }, [activeSection, profile, user])

  const closeModal = () => {
    setActiveSection(null)
    setModalSaving(false)
  }

  const handleMenuClick = (key) => {
    if (key === 'cheat' || key === 'grocery') {
      if (!profile?.age || !profile?.goal || !profile?.diet_preference) {
        setShowOnboardingBlocker(true)
        return
      }
    }

    if (key === 'grocery') {
      setShowGroceryRangeModal(true)
      return
    }

    setActiveSection(key)
  }

  const handleGroceryRangeConfirm = async () => {
    setShowGroceryRangeModal(false)
    setGroceryError(null)
    setGrocery(null)
    setGroceryLoading(true)
    setShowGrocerySheet(true)

    try {
      const url = `grocery?start_date=${groceryStartDate}&end_date=${groceryEndDate}`
      const res = await API.get(url)
      setGrocery(res.data)
      if (res.data.is_partial) {
        const fmt = (dateValue) => new Date(dateValue).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        setGroceryError({
          type: 'partial',
          message: `Grocery list shown until ${fmt(res.data.actual_end_date)} — no meal plan generated beyond that.`,
        })
      }
    } catch (err) {
      if (err?.response?.data?.no_plan) {
        setGroceryError({
          type: 'no_plan',
          message: 'No meal plan found for this range. Generate a plan first from the Nutrition tab.',
        })
      } else {
        setGroceryError({
          type: 'error',
          message: 'Could not load grocery list. Please try again.',
        })
      }
    } finally {
      setGroceryLoading(false)
    }
  }

  const handlePersonalSave = async () => {
    const ageNum = draft?.age === '' ? null : Number(draft?.age)
    if (ageNum !== null && Number.isNaN(ageNum)) {
      toast.error('Enter a valid age')
      return
    }

    setModalSaving(true)
    try {
      await authService.updateProfile({ age: ageNum, city: draft?.city ?? '' })
      toast.success('Personal info updated')
      await fetchProfile()
      closeModal()
    } catch {
      toast.error('Failed to update personal info')
    } finally {
      setModalSaving(false)
    }
  }

  const handleBodySave = async () => {
    const weightNum = draft?.weight_kg === '' ? null : Number(draft?.weight_kg)
    const heightNum = draft?.height_cm === '' ? null : Number(draft?.height_cm)

    if (weightNum !== null && Number.isNaN(weightNum)) {
      toast.error('Enter a valid weight')
      return
    }
    if (heightNum !== null && Number.isNaN(heightNum)) {
      toast.error('Enter a valid height')
      return
    }

    setModalSaving(true)
    try {
      await authService.updateProfile({ weight_kg: weightNum, height_cm: heightNum })
      toast.success('Body stats updated')
      await fetchProfile()
      closeModal()
    } catch {
      toast.error('Failed to update body stats')
    } finally {
      setModalSaving(false)
    }
  }

  const handleGoalsSave = async () => {
    setModalSaving(true)
    try {
      await authService.updateProfile({
        goal: draft?.goal ?? 'maintenance',
        diet_preference: draft?.diet_preference ?? 'veg',
      })
      toast.success('Goals updated')
      await fetchProfile()
      closeModal()
    } catch {
      toast.error('Failed to update goals')
    } finally {
      setModalSaving(false)
    }
  }

  const handleGymSave = async () => {
    const minutesNum = draft?.health_time_minutes === '' ? 0 : Number(draft?.health_time_minutes)
    if (Number.isNaN(minutesNum)) {
      toast.error('Enter valid minutes')
      return
    }
    if (minutesNum < 0 || minutesNum > 300) {
      toast.error('Health time must be between 0 and 300 minutes')
      return
    }

    setModalSaving(true)
    try {
      await authService.updateProfile({
        has_gym: !!draft?.has_gym,
        health_time_minutes: minutesNum,
      })
      toast.success('Gym preferences updated')
      await fetchProfile()
      closeModal()
    } catch {
      toast.error('Failed to update gym preferences')
    } finally {
      setModalSaving(false)
    }
  }

  const handleFastingSave = async () => {
    if (draft?.is_fasting && !draft?.fasting_days) {
      toast.error('Please select at least one fasting day')
      return
    }

    setModalSaving(true)
    try {
      await authService.updateProfile({
        is_fasting: !!draft?.is_fasting,
        fasting_days: draft?.is_fasting ? draft?.fasting_days ?? '' : '',
        fasting_type: draft?.is_fasting ? draft?.fasting_type ?? '' : '',
      })
      toast.success('Fasting preferences updated 🙏')
      await fetchProfile()
      closeModal()
    } catch {
      toast.error('Failed to update fasting preferences')
    } finally {
      setModalSaving(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  const handleGroceryItemToggle = async (item) => {
    try {
      await groceryService.checkItem(item.id, { is_checked: !item.is_checked })
      const url = `grocery?start_date=${groceryStartDate}&end_date=${groceryEndDate}`
      const res = await API.get(url)
      setGrocery(res.data)
    } catch {
      toast.error('Failed to update item')
    }
  }

  return (
    <div style={S.pageWrap}>
      <ProfileHeader
        username={user?.username}
        goal={profile?.goal}
        dietPreference={profile?.diet_preference}
      />

      <StatsRow
        weight={profile?.weight_kg}
        targetWeight={profile?.target_weight_kg}
        bmi={profile?.bmi}
      />

      <MenuList items={menuItems} onItemClick={handleMenuClick} />

      {activeSection && (
        <div style={S.modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            {activeSection !== 'grocery' && (
              <h3 style={S.modalTitle}>
                {menuItems.find((item) => item.key === activeSection)?.label || 'Details'}
              </h3>
            )}

            {activeSection === 'personal' && (
              <PersonalInfoModal
                draft={draft}
                setDraft={setDraft}
                onClose={closeModal}
                onSave={handlePersonalSave}
                saving={modalSaving}
              />
            )}

            {activeSection === 'body' && (
              <BodyStatsModal
                draft={draft}
                setDraft={setDraft}
                onClose={closeModal}
                onSave={handleBodySave}
                saving={modalSaving}
              />
            )}

            {activeSection === 'goals' && (
              <GoalsDietModal
                draft={draft}
                setDraft={setDraft}
                onClose={closeModal}
                onSave={handleGoalsSave}
                saving={modalSaving}
                goalOptions={GOAL_OPTIONS}
                dietOptions={DIET_OPTIONS}
              />
            )}

            {activeSection === 'gym' && (
              <GymActivityModal
                draft={draft}
                setDraft={setDraft}
                onClose={closeModal}
                onSave={handleGymSave}
                saving={modalSaving}
                showHealthTimeWarning={profile?.health_time_minutes === 0}
              />
            )}

            {activeSection === 'fasting' && (
              <FastingModal
                draft={draft}
                setDraft={setDraft}
                onClose={closeModal}
                onSave={handleFastingSave}
                saving={modalSaving}
              />
            )}

            {activeSection === 'cheat' && (
              <CheatMealHistorySection
                onLogNew={() => {
                  closeModal()
                  navigate('/cheat-meal')
                }}
              />
            )}
          </div>
        </div>
      )}

      {showOnboardingBlocker && (
        <OnboardingBlocker
          onCompleteOnboarding={() => {
            setShowOnboardingBlocker(false)
            navigate('/onboarding')
          }}
          onDismiss={() => setShowOnboardingBlocker(false)}
        />
      )}

      {showGroceryRangeModal && (
        <GroceryRangeModal
          startDate={groceryStartDate}
          endDate={groceryEndDate}
          onStartDateChange={setGroceryStartDate}
          onEndDateChange={setGroceryEndDate}
          onClose={() => setShowGroceryRangeModal(false)}
          onConfirm={handleGroceryRangeConfirm}
        />
      )}

      {showGrocerySheet && (
        <GrocerySheet
          grocery={grocery}
          loading={groceryLoading}
          error={groceryError}
          startDate={groceryStartDate}
          endDate={groceryEndDate}
          onClose={() => setShowGrocerySheet(false)}
          onChangeDates={() => {
            setShowGrocerySheet(false)
            setShowGroceryRangeModal(true)
          }}
          onDone={() => setShowGrocerySheet(false)}
          onToggleItem={handleGroceryItemToggle}
        />
      )}

      <AppInfoCard />

      <LogoutButton onClick={handleLogout} />

      <div style={{ height: '16px' }} />

      <AccountGlobalStyles />
    </div>
  )
}