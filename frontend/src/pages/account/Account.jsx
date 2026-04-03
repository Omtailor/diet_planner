import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { groceryService } from '../../services/groceryService'
import API from '../../services/api'

function CheatMealHistorySection({ onLogNew }) {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    API.get('/cheat-meals/history/')
      .then(res => setMeals(res.data || []))
      .catch(() => setMeals([]))
      .finally(() => setLoading(false))
  }, [])

  const fmt = (iso) => {
    const d = new Date(iso)
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={modalTitle}>Cheat Meal History</h3>
        <button onClick={onLogNew} style={{
          background: 'var(--error)', border: 'none',
          borderRadius: '10px', padding: '8px 14px',
          color: '#fff', fontSize: '0.8rem', fontWeight: 700,
          fontFamily: 'Satoshi, sans-serif', cursor: 'pointer',
        }}>
          + Log New
        </button>
      </div>

      {loading && (
        <p style={modalDesc}>Loading history...</p>
      )}

      {!loading && meals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <p style={{ fontSize: '2rem', marginBottom: '8px' }}>🍕</p>
          <p style={modalDesc}>No cheat meals logged yet.</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column',
          gap: '10px', maxHeight: '340px', overflowY: 'auto' }}>
          {meals.map(m => (
            <div key={m.id} style={{
              background: 'var(--bg-surface-2)',
              border: '1px solid var(--border)',
              borderRadius: '14px', padding: '14px 16px',
            }}>
              <div style={{ display: 'flex',
                justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 700,
                    color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    {m.food_name || 'Unknown food'}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-faint)',
                    fontFamily: 'Satoshi, sans-serif', marginTop: '3px' }}>
                    {fmt(m.logged_at)} • {m.entry_method === 'image' ? '📸 Photo' : '✍️ Manual'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontFamily: 'Clash Display, sans-serif',
                    fontSize: '1.1rem', fontWeight: 700,
                    color: 'var(--error)' }}>
                    {m.user_edited_calories || m.ai_estimated_calories
                      ? `${Math.round(m.user_edited_calories || m.ai_estimated_calories)} kcal`
                      : '— kcal'}
                  </p>
                  {m.ai_confidence && (
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-faint)',
                      fontFamily: 'Satoshi, sans-serif' }}>
                      {m.ai_confidence > 0.7 ? '🎯 High'
                        : m.ai_confidence > 0.4 ? '📊 Medium' : '⚠️ Low'} confidence
                    </p>
                  )}
                </div>
              </div>
              {m.notes && (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)',
                  fontFamily: 'Satoshi, sans-serif',
                  marginTop: '8px', fontStyle: 'italic' }}>
                  "{m.notes}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function Account() {
  const navigate = useNavigate()
  const { profile, logout, fetchProfile, user } = useAuth()
  const [activeSection, setActiveSection] = useState(null)
  const [draft, setDraft] = useState({})
  const [modalSaving, setModalSaving] = useState(false)

  const [grocery, setGrocery] = useState(null)
  const [groceryLoading, setGroceryLoading] = useState(false)
  const [groceryRefreshing, setGroceryRefreshing] = useState(false)

  const menuItems = [
    { icon: '👤', label: 'Personal Info',      sub: 'Name, age, city',          key: 'personal'  },
    { icon: '📊', label: 'Body Stats',        sub: 'Weight, height, BMI',      key: 'body'      },
    { icon: '🎯', label: 'Goals & Diet',      sub: 'Goal, diet preference',    key: 'goals'     },
    { icon: '🏋️', label: 'Gym & Activity',   sub: 'Gym, health time',         key: 'gym'       },
    { icon: '🍔', label: 'Cheat Meal History', sub: 'Past cheat meals',       key: 'cheat'     },
    { icon: '🛒', label: 'Grocery List',      sub: 'Weekly ingredients',       key: 'grocery'   },
  ]

  const goalOptions = [
    { value: 'muscle_building', label: 'Muscle Building' },
    { value: 'fat_loss', label: 'Fat Loss' },
    { value: 'weight_loss', label: 'Weight Loss' },
    { value: 'maintenance', label: 'Maintenance' },
  ]

  const dietOptions = [
    { value: 'jain', label: 'Jain' },
    { value: 'veg', label: 'Vegetarian' },
    { value: 'non_veg', label: 'Non-Vegetarian' },
  ]

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
    }
  }, [activeSection, profile, user])

  useEffect(() => {
    if (activeSection !== 'grocery') return

    let isMounted = true
    const load = async () => {
      setGroceryLoading(true)
      try {
        const res = await groceryService.getList()
        if (isMounted) setGrocery(res.data)
      } catch (e) {
        if (isMounted) setGrocery(null)
        toast.error('Failed to load grocery list')
      } finally {
        if (isMounted) setGroceryLoading(false)
      }
    }

    load()
    return () => { isMounted = false }
  }, [activeSection])

  const closeModal = () => {
    setActiveSection(null)
    setModalSaving(false)
  }

  const handleMenuClick = (key) => {
    setActiveSection(key)
  }

  const handleLogout = () => {
    logout()
    toast.success('Logged out successfully')
    navigate('/login')
  }

  return (
    <div style={pageWrap}>

      {/* Profile Header */}
      <div style={profileHeader}>
        <div style={avatarLarge}>
          {profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={profileName}>{profile?.name || 'User'}</h2>
          <p style={profileGoal}>
            {profile?.goal?.replace('_', ' ') || 'Goal not set'} •{' '}
            {profile?.diet_preference || 'Diet not set'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={statsRow}>
        {[
          { label: 'Weight',  value: profile?.weight_kg    ? `${profile.weight_kg}kg`    : '—' },
          { label: 'Target',  value: profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—' },
          { label: 'BMI',     value: profile?.bmi          ? parseFloat(profile.bmi).toFixed(1) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={statBox}>
            <span style={statVal}>{value}</span>
            <span style={statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Menu Items */}
      <div style={menuCard}>
        {menuItems.map(({ icon, label, sub, key }, i, arr) => (
          <button
            key={key}
            onClick={() => handleMenuClick(key)}
            type="button"
            style={{
              ...menuItem,
              borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
            }}
          >
            <div style={menuIcon}>{icon}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={menuLabel}>{label}</p>
              <p style={menuSub}>{sub}</p>
            </div>
            <span style={{ color: 'var(--text-faint)', fontSize: '1rem' }}>›</span>
          </button>
        ))}
      </div>

      {/* Inline Detail Modals */}
      {activeSection && (
        <div style={modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
          <div style={modalCard} onClick={(e) => e.stopPropagation()}>
            {activeSection !== 'grocery' && (
              <h3 style={modalTitle}>
                {menuItems.find((x) => x.key === activeSection)?.label || 'Details'}
              </h3>
            )}

            {activeSection === 'personal' && (
              <div>
                <p style={modalDesc}>Update your basic profile info.</p>

                <label style={fieldLabel}>Name</label>
                <input
                  type="text"
                  value={draft?.name || ''}
                  disabled
                  style={{ ...modalInput, opacity: 0.7, cursor: 'not-allowed' }}
                />

                <label style={{ ...fieldLabel, marginTop: '12px' }}>Age</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 25"
                  value={draft?.age ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
                  style={modalInput}
                />

                <label style={{ ...fieldLabel, marginTop: '12px' }}>City</label>
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={draft?.city ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  style={modalInput}
                />

                <div style={modalActions}>
                  <button type="button" onClick={closeModal} style={modalSecondaryBtn}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const ageNum = draft?.age === '' ? null : Number(draft?.age)
                      if (ageNum !== null && Number.isNaN(ageNum)) {
                        toast.error('Enter a valid age')
                        return
                      }

                      setModalSaving(true)
                      try {
                        await authService.updateProfile({
                          age: ageNum,
                          city: draft?.city ?? '',
                        })
                        toast.success('Personal info updated')
                        await fetchProfile()
                        closeModal()
                      } catch {
                        toast.error('Failed to update personal info')
                      } finally {
                        setModalSaving(false)
                      }
                    }}
                    disabled={modalSaving}
                    style={modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'body' && (
              <div>
                <p style={modalDesc}>Update weight and height. BMI updates automatically.</p>

                <label style={fieldLabel}>Weight (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 68.5"
                  value={draft?.weight_kg ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, weight_kg: e.target.value }))}
                  style={modalInput}
                />

                <label style={{ ...fieldLabel, marginTop: '12px' }}>Height (cm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 175"
                  value={draft?.height_cm ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, height_cm: e.target.value }))}
                  style={modalInput}
                />

                <div style={modalActions}>
                  <button type="button" onClick={closeModal} style={modalSecondaryBtn}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
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
                        await authService.updateProfile({
                          weight_kg: weightNum,
                          height_cm: heightNum,
                        })
                        toast.success('Body stats updated')
                        await fetchProfile()
                        closeModal()
                      } catch {
                        toast.error('Failed to update body stats')
                      } finally {
                        setModalSaving(false)
                      }
                    }}
                    disabled={modalSaving}
                    style={modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'goals' && (
              <div>
                <p style={modalDesc}>Update your goal and diet preference.</p>

                <label style={fieldLabel}>Goal</label>
                <select
                  value={draft?.goal ?? 'maintenance'}
                  onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
                  style={modalSelect}
                >
                  {goalOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <label style={{ ...fieldLabel, marginTop: '12px' }}>Diet Preference</label>
                <select
                  value={draft?.diet_preference ?? 'veg'}
                  onChange={(e) => setDraft((d) => ({ ...d, diet_preference: e.target.value }))}
                  style={modalSelect}
                >
                  {dietOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <div style={modalActions}>
                  <button type="button" onClick={closeModal} style={modalSecondaryBtn}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
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
                    }}
                    disabled={modalSaving}
                    style={modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'gym' && (
              <div>
                <p style={modalDesc}>Update your gym schedule preference.</p>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                  <input
                    type="checkbox"
                    checked={!!draft?.has_gym}
                    onChange={(e) => setDraft((d) => ({ ...d, has_gym: e.target.checked }))}
                  />
                  <span style={{ fontFamily: 'Satoshi, sans-serif', fontWeight: 600, color: 'var(--text-primary)' }}>
                    I have a gym routine
                  </span>
                </label>

                <label style={{ ...fieldLabel, marginTop: '12px' }}>Health time (minutes)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 60"
                  value={draft?.health_time_minutes ?? 60}
                  onChange={(e) => setDraft((d) => ({ ...d, health_time_minutes: e.target.value }))}
                  disabled={!draft?.has_gym}
                  style={{ ...modalInput, opacity: draft?.has_gym ? 1 : 0.65, cursor: draft?.has_gym ? 'text' : 'not-allowed' }}
                />

                <div style={modalActions}>
                  <button type="button" onClick={closeModal} style={modalSecondaryBtn}>
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const minutesNum = draft?.health_time_minutes === '' ? 60 : Number(draft?.health_time_minutes)
                      if (Number.isNaN(minutesNum)) {
                        toast.error('Enter valid minutes')
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
                    }}
                    disabled={modalSaving}
                    style={modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'cheat' && (
              <CheatMealHistorySection
                onLogNew={() => { closeModal(); navigate('/cheat-meal') }}
              />
            )}

            {activeSection === 'grocery' && (
              <div>
                <h3 style={modalTitle}>Grocery List</h3>
                <p style={modalDesc}>
                  Check off items as you use them. ({grocery?.checked_items ?? 0}/{grocery?.total_items ?? 0})
                </p>

                {groceryLoading && (
                  <p style={{ ...modalDesc, marginTop: '16px' }}>Loading your grocery list...</p>
                )}

                {!groceryLoading && grocery?.items?.length ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '8px',
                    marginTop: '14px',
                    overflowY: 'auto',
                    maxHeight: '48dvh',
                    paddingRight: '4px',
                  }}>
                    {grocery.items.map((it) => (
                      <label key={it.id} style={groceryRow}>
                        <input
                          type="checkbox"
                          checked={!!it.is_checked}
                          onChange={async (e) => {
                            try {
                              await groceryService.checkItem(it.id, { is_checked: e.target.checked })
                              // Refetch to keep counts consistent
                              const res = await groceryService.getList()
                              setGrocery(res.data)
                            } catch {
                              toast.error('Failed to update item')
                            }
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={groceryName}>{it.ingredient_name}</div>
                          <div style={grocerySub}>
                            {it.quantity} {it.unit}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (!groceryLoading && (
                  <p style={{ ...modalDesc, marginTop: '16px' }}>
                    No grocery list found yet. Generate a meal plan to create your list.
                  </p>
                ))}

                <div style={{
                  display: 'flex', gap: '10px',
                  marginTop: '14px',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border)',
                  flexShrink: 0,
                }}>
                  <button
                    type="button"
                    onClick={async () => {
                      setGroceryRefreshing(true)
                      try {
                        await groceryService.refreshList()
                        const res = await groceryService.getList()
                        setGrocery(res.data)
                        toast.success('Grocery list refreshed')
                      } catch {
                        toast.error('Failed to refresh grocery list')
                      } finally {
                        setGroceryRefreshing(false)
                      }
                    }}
                    disabled={groceryRefreshing}
                    style={{ ...modalSecondaryBtn, padding: '12px' }}
                  >
                    {groceryRefreshing ? 'Refreshing...' : 'Refresh List'}
                  </button>
                  <button type="button" onClick={closeModal} style={modalPrimaryBtn}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Info */}
      <div style={infoCard}>
        <p style={infoText}>NutriAI v1.0</p>
        <p style={infoText}>AI-powered diet & training planner 🥗</p>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={logoutBtn}>
        <LogOut size={18} color="var(--error)" />
        <span style={{ fontSize: '0.9375rem', fontWeight: 600,
          color: 'var(--error)', fontFamily: 'Satoshi, sans-serif' }}>
          Log Out
        </span>
      </button>

      <div style={{ height: '8px' }} />
    </div>
  )
}

const pageWrap = {
  display: 'flex', flexDirection: 'column',
  gap: '14px', padding: '16px',
}
const profileHeader = {
  display: 'flex', alignItems: 'center', gap: '16px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '18px', padding: '20px 16px',
}
const avatarLarge = {
  width: '60px', height: '60px',
  background: 'var(--accent)', borderRadius: '50%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.5rem', fontWeight: 700,
  color: '#0A0A0A', fontFamily: 'Clash Display, sans-serif',
  flexShrink: 0,
}
const profileName = {
  fontFamily: 'Clash Display, sans-serif',
  fontSize: '1.25rem', fontWeight: 600,
  color: 'var(--text-primary)', letterSpacing: '-0.3px',
}
const profileGoal = {
  fontSize: '0.8rem', color: 'var(--text-secondary)',
  fontFamily: 'Satoshi, sans-serif', marginTop: '4px',
  textTransform: 'capitalize',
}
const statsRow = {
  display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px',
}
const statBox = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px', padding: '14px 10px',
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', gap: '4px',
}
const statVal = {
  fontFamily: 'Clash Display, sans-serif',
  fontSize: '1.25rem', fontWeight: 700,
  color: 'var(--accent)',
}
const statLabel = {
  fontSize: '0.7rem', fontWeight: 600,
  color: 'var(--text-faint)', fontFamily: 'Satoshi, sans-serif',
  letterSpacing: '0.5px', textTransform: 'uppercase',
}
const menuCard = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '18px', overflow: 'hidden',
}
const menuItem = {
  width: '100%', display: 'flex',
  alignItems: 'center', gap: '12px',
  padding: '14px 16px', background: 'none',
  border: 'none', cursor: 'pointer',
  transition: 'background 180ms ease',
}
const menuIcon = {
  width: '38px', height: '38px',
  background: 'var(--bg-surface-2)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '1.1rem', flexShrink: 0,
}
const menuLabel = {
  fontSize: '0.9rem', fontWeight: 600,
  color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif',
}
const menuSub = {
  fontSize: '0.75rem', color: 'var(--text-secondary)',
  fontFamily: 'Satoshi, sans-serif', marginTop: '2px',
}
const infoCard = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '14px', padding: '14px 16px',
  display: 'flex', flexDirection: 'column', gap: '4px',
  alignItems: 'center',
}
const infoText = {
  fontSize: '0.75rem', color: 'var(--text-faint)',
  fontFamily: 'Satoshi, sans-serif',
}
const logoutBtn = {
  width: '100%', padding: '15px',
  background: 'rgba(255,77,77,0.06)',
  border: '1px solid rgba(255,77,77,0.2)',
  borderRadius: '14px',
  display: 'flex', alignItems: 'center',
  justifyContent: 'center', gap: '10px',
  cursor: 'pointer',
  transition: 'all 180ms ease',
}

const modalOverlay = {
  position: 'fixed', inset: 0,
  background: 'rgba(0, 0, 0, 0.45)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 200,
}

const modalCard = {
  width: '90%', maxWidth: '420px',
  maxHeight: '85dvh',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px',
  padding: '20px',
  boxShadow: '0 12px 30px rgba(0,0,0,0.2)',
  display: 'flex',
  flexDirection: 'column',
}

const modalTitle = {
  fontFamily: 'Clash Display, sans-serif',
  fontSize: '1.25rem',
  fontWeight: 600,
  color: 'var(--text-primary)',
  marginBottom: '6px',
}

const modalDesc = {
  fontSize: '0.875rem',
  color: 'var(--text-secondary)',
  fontFamily: 'Satoshi, sans-serif',
  marginBottom: '16px',
}

const modalInput = {
  width: '100%',
  padding: '13px 16px',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  fontFamily: 'Satoshi, sans-serif',
}

const modalSelect = {
  width: '100%',
  padding: '12px 14px',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontSize: '1rem',
  fontFamily: 'Satoshi, sans-serif',
}

const fieldLabel = {
  fontSize: '0.75rem',
  fontWeight: 700,
  color: 'var(--text-faint)',
  fontFamily: 'Satoshi, sans-serif',
  marginTop: '10px',
  display: 'block',
}

const modalActions = {
  display: 'flex',
  gap: '10px',
  marginTop: '18px',
}

const modalPrimaryBtn = {
  flex: 1,
  padding: '12px 14px',
  background: 'var(--accent)',
  border: 'none',
  borderRadius: '12px',
  color: '#0A0A0A',
  fontWeight: 800,
  cursor: 'pointer',
  fontFamily: 'Satoshi, sans-serif',
}

const modalSecondaryBtn = {
  flex: 1,
  padding: '12px 14px',
  background: 'rgba(255, 255, 255, 0.04)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  color: 'var(--text-primary)',
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: 'Satoshi, sans-serif',
}

const groceryRow = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '10px 12px',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  background: 'var(--bg-surface-2)',
  cursor: 'pointer',
}

const groceryName = {
  fontFamily: 'Satoshi, sans-serif',
  fontWeight: 800,
  color: 'var(--text-primary)',
  fontSize: '0.95rem',
  lineHeight: 1.3,
}

const grocerySub = {
  fontFamily: 'Satoshi, sans-serif',
  color: 'var(--text-secondary)',
  fontSize: '0.8rem',
  marginTop: '3px',
}

export default Account