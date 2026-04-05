import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../../context/AuthContext'
import { authService } from '../../services/authService'
import { groceryService } from '../../services/groceryService'
import API from '../../services/api'

// ─── Style Tokens ──────────────────────────────────────────────
const FONT = "'General Sans', sans-serif";

const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

// ─── Sub-Components ────────────────────────────────────────────

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
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', marginBottom: '16px'
      }}>
        <h3 style={S.modalTitle}>Cheat Meal History</h3>
        <button onClick={onLogNew} style={{
          background: '#FF3B30', border: 'none',
          borderRadius: '12px', padding: '10px 16px',
          color: '#ffffff', fontSize: '0.85rem', fontWeight: 800,
          fontFamily: FONT, cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(255,59,48,0.3)',
        }}>
          + Log New
        </button>
      </div>

      {loading && (
        <p style={S.modalDesc}>Loading history...</p>
      )}

      {!loading && meals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '32px 0' }}>
          <p style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🍕</p>
          <p style={S.modalDesc}>No cheat meals logged yet.</p>
        </div>
      )}

      {!loading && meals.length > 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column',
          gap: '12px', maxHeight: '380px', overflowY: 'auto',
          paddingRight: '4px'
        }}>
          {meals.map(m => (
            <div key={m.id} style={{
              background: 'rgba(255,255,255,0.7)',
              border: '1px solid rgba(0,0,0,0.05)',
              borderRadius: '16px', padding: '16px',
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between', alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{
                    fontFamily: FONT, fontWeight: 800,
                    color: 'var(--color-text)', fontSize: '1rem'
                  }}>
                    {m.food_name || 'Unknown food'}
                  </p>
                  <p style={{
                    fontSize: '0.8rem', color: 'var(--color-text-faint)', fontWeight: 600,
                    fontFamily: FONT, marginTop: '4px'
                  }}>
                    {fmt(m.logged_at)} • {m.entry_method === 'image' ? '📸 Photo' : '✍️ Manual'}
                  </p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{
                    fontFamily: FONT,
                    fontSize: '1.2rem', fontWeight: 800,
                    color: '#FF3B30'
                  }}>
                    {m.user_edited_calories || m.ai_estimated_calories
                      ? `${Math.round(m.user_edited_calories || m.ai_estimated_calories)} kcal`
                      : '— kcal'}
                  </p>
                  {m.ai_confidence && (
                    <p style={{
                      fontSize: '0.75rem', color: 'var(--color-text-faint)', fontWeight: 600,
                      fontFamily: FONT, marginTop: '2px'
                    }}>
                      {m.ai_confidence > 0.7 ? '🎯 High'
                        : m.ai_confidence > 0.4 ? '📊 Medium' : '⚠️ Low'} conf.
                    </p>
                  )}
                </div>
              </div>
              {m.notes && (
                <p style={{
                  fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
                  fontFamily: FONT,
                  marginTop: '10px', fontStyle: 'italic'
                }}>
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

// ─── Main Account Page ─────────────────────────────────────────

export default function Account() {
  const navigate = useNavigate()
  const { profile, logout, fetchProfile, user } = useAuth()
  const [activeSection, setActiveSection] = useState(null)
  const [draft, setDraft] = useState({})
  const [modalSaving, setModalSaving] = useState(false)

  const [grocery, setGrocery] = useState(null)
  const [groceryLoading, setGroceryLoading] = useState(false)
  const [groceryRefreshing, setGroceryRefreshing] = useState(false)

  const menuItems = [
    { icon: '👤', label: 'Personal Info', sub: 'Name, age, city', key: 'personal' },
    { icon: '📊', label: 'Body Stats', sub: 'Weight, height, BMI', key: 'body' },
    { icon: '🎯', label: 'Goals & Diet', sub: 'Goal, diet preference', key: 'goals' },
    { icon: '🏋️', label: 'Gym & Activity', sub: 'Gym, health time', key: 'gym' },
    { icon: '🍔', label: 'Cheat Meal History', sub: 'Past cheat meals', key: 'cheat' },
    { icon: '🛒', label: 'Grocery List', sub: 'Weekly ingredients', key: 'grocery' },
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
    <div style={S.pageWrap}>

      {/* Profile Header */}
      <div style={S.profileHeader}>
        <div style={S.avatarLarge}>
          {profile?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div>
          <h2 style={S.profileName}>{profile?.name || 'User'}</h2>
          <p style={S.profileGoal}>
            {profile?.goal?.replace('_', ' ') || 'Goal not set'} •{' '}
            {profile?.diet_preference || 'Diet not set'}
          </p>
        </div>
      </div>

      {/* Stats Row */}
      <div style={S.statsRow}>
        {[
          { label: 'Weight', value: profile?.weight_kg ? `${profile.weight_kg}kg` : '—' },
          { label: 'Target', value: profile?.target_weight_kg ? `${profile.target_weight_kg}kg` : '—' },
          { label: 'BMI', value: profile?.bmi ? parseFloat(profile.bmi).toFixed(1) : '—' },
        ].map(({ label, value }) => (
          <div key={label} style={S.statBox}>
            <span style={S.statVal}>{value}</span>
            <span style={S.statLabel}>{label}</span>
          </div>
        ))}
      </div>

      {/* Menu Items */}
      <div style={S.menuCard}>
        {menuItems.map(({ icon, label, sub, key }, i, arr) => (
          <button
            key={key}
            onClick={() => handleMenuClick(key)}
            type="button"
            style={{
              ...S.menuItem,
              borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none',
            }}
          >
            <div style={S.menuIcon}>{icon}</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={S.menuLabel}>{label}</p>
              <p style={S.menuSub}>{sub}</p>
            </div>
            <span style={{ color: 'var(--color-text-faint)', fontSize: '1.2rem' }}>›</span>
          </button>
        ))}
      </div>

      {/* Inline Detail Modals */}
      {activeSection && (
        <div style={S.modalOverlay} onClick={closeModal} role="dialog" aria-modal="true">
          <div style={S.modalCard} onClick={(e) => e.stopPropagation()}>
            {activeSection !== 'grocery' && (
              <h3 style={S.modalTitle}>
                {menuItems.find((x) => x.key === activeSection)?.label || 'Details'}
              </h3>
            )}

            {activeSection === 'personal' && (
              <div>
                <p style={S.modalDesc}>Update your basic profile info.</p>

                <label style={S.fieldLabel}>Name</label>
                <input
                  type="text"
                  value={draft?.name || ''}
                  disabled
                  style={{ ...S.modalInput, opacity: 0.6, cursor: 'not-allowed' }}
                />

                <label style={{ ...S.fieldLabel, marginTop: '14px' }}>Age</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 25"
                  value={draft?.age ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))}
                  style={S.modalInput}
                />

                <label style={{ ...S.fieldLabel, marginTop: '14px' }}>City</label>
                <input
                  type="text"
                  placeholder="e.g. Mumbai"
                  value={draft?.city ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, city: e.target.value }))}
                  style={S.modalInput}
                />

                <div style={S.modalActions}>
                  <button type="button" onClick={closeModal} style={S.modalSecondaryBtn}>
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
                        await authService.updateProfile({ age: ageNum, city: draft?.city ?? '' })
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
                    style={S.modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'body' && (
              <div>
                <p style={S.modalDesc}>Update weight and height. BMI updates automatically.</p>

                <label style={S.fieldLabel}>Weight (kg)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 68.5"
                  value={draft?.weight_kg ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, weight_kg: e.target.value }))}
                  style={S.modalInput}
                />

                <label style={{ ...S.fieldLabel, marginTop: '14px' }}>Height (cm)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  placeholder="e.g. 175"
                  value={draft?.height_cm ?? ''}
                  onChange={(e) => setDraft((d) => ({ ...d, height_cm: e.target.value }))}
                  style={S.modalInput}
                />

                <div style={S.modalActions}>
                  <button type="button" onClick={closeModal} style={S.modalSecondaryBtn}>
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
                        await authService.updateProfile({ weight_kg: weightNum, height_cm: heightNum })
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
                    style={S.modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'goals' && (
              <div>
                <p style={S.modalDesc}>Update your goal and diet preference.</p>

                <label style={S.fieldLabel}>Goal</label>
                <select
                  value={draft?.goal ?? 'maintenance'}
                  onChange={(e) => setDraft((d) => ({ ...d, goal: e.target.value }))}
                  style={S.modalSelect}
                >
                  {goalOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <label style={{ ...S.fieldLabel, marginTop: '14px' }}>Diet Preference</label>
                <select
                  value={draft?.diet_preference ?? 'veg'}
                  onChange={(e) => setDraft((d) => ({ ...d, diet_preference: e.target.value }))}
                  style={S.modalSelect}
                >
                  {dietOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>

                <div style={S.modalActions}>
                  <button type="button" onClick={closeModal} style={S.modalSecondaryBtn}>
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
                    style={S.modalPrimaryBtn}
                  >
                    {modalSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            )}

            {activeSection === 'gym' && (
              <div>
                <p style={S.modalDesc}>Update your gym schedule preference.</p>

                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                  <input
                    type="checkbox"
                    checked={!!draft?.has_gym}
                    onChange={(e) => setDraft((d) => ({ ...d, has_gym: e.target.checked }))}
                  />
                  <span style={{ fontFamily: FONT, fontWeight: 700, color: 'var(--color-text)' }}>
                    I have a gym routine
                  </span>
                </label>

                <label style={{ ...S.fieldLabel, marginTop: '16px' }}>Health time (minutes)</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="e.g. 60"
                  value={draft?.health_time_minutes ?? 60}
                  onChange={(e) => setDraft((d) => ({ ...d, health_time_minutes: e.target.value }))}
                  disabled={!draft?.has_gym}
                  style={{ ...S.modalInput, opacity: draft?.has_gym ? 1 : 0.6, cursor: draft?.has_gym ? 'text' : 'not-allowed' }}
                />

                <div style={S.modalActions}>
                  <button type="button" onClick={closeModal} style={S.modalSecondaryBtn}>
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
                    style={S.modalPrimaryBtn}
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
                <h3 style={S.modalTitle}>Grocery List</h3>
                <p style={S.modalDesc}>
                  Check off items as you use them. ({grocery?.checked_items ?? 0}/{grocery?.total_items ?? 0})
                </p>

                {groceryLoading && (
                  <p style={{ ...S.modalDesc, marginTop: '20px' }}>Loading your grocery list...</p>
                )}

                {!groceryLoading && grocery?.items?.length ? (
                  <div style={{
                    display: 'flex', flexDirection: 'column', gap: '10px',
                    marginTop: '16px', overflowY: 'auto',
                    maxHeight: '48dvh', paddingRight: '4px',
                  }}>
                    {grocery.items.map((it) => (
                      <label key={it.id} style={S.groceryRow}>
                        <input
                          type="checkbox"
                          checked={!!it.is_checked}
                          style={{ width: '18px', height: '18px' }}
                          onChange={async (e) => {
                            try {
                              await groceryService.checkItem(it.id, { is_checked: e.target.checked })
                              const res = await groceryService.getList()
                              setGrocery(res.data)
                            } catch {
                              toast.error('Failed to update item')
                            }
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{
                            ...S.groceryName,
                            color: it.is_checked ? 'var(--color-text-faint)' : 'var(--color-text)',
                            textDecoration: it.is_checked ? 'line-through' : 'none'
                          }}>{it.ingredient_name}</div>
                          <div style={S.grocerySub}>
                            {it.quantity} {it.unit}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (!groceryLoading && (
                  <p style={{ ...S.modalDesc, marginTop: '20px' }}>
                    No grocery list found yet. Generate a meal plan to create your list.
                  </p>
                ))}

                <div style={{
                  display: 'flex', gap: '10px',
                  marginTop: '16px', paddingTop: '16px',
                  borderTop: '1px solid rgba(0,0,0,0.05)',
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
                    style={{ ...S.modalSecondaryBtn, padding: '14px' }}
                  >
                    {groceryRefreshing ? 'Refreshing...' : 'Refresh List'}
                  </button>
                  <button type="button" onClick={closeModal} style={S.modalPrimaryBtn}>
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* App Info */}
      <div style={S.infoCard}>
        <p style={S.infoText}>NutriAI v1.0</p>
        <p style={S.infoText}>AI-powered diet & training planner 🥗</p>
      </div>

      {/* Logout */}
      <button onClick={handleLogout} style={S.logoutBtn}>
        <LogOut size={20} color="#FF3B30" />
        <span style={{
          fontSize: '1rem', fontWeight: 800,
          color: '#FF3B30', fontFamily: FONT
        }}>
          Log Out
        </span>
      </button>

      <div style={{ height: '16px' }} />

      {/* Global CSS mapped to Theme */}
      <style>{`
        :root {
          --color-accent: #34C759;
          --color-text: #1C1C1E;
          --color-text-muted: #636366;
          --color-text-faint: #8E8E93;
        }
      `}</style>
    </div>
  )
}

// ─── Styles ────────────────────────────────────────────────────────
const S = {
  pageWrap: {
    display: 'flex', flexDirection: 'column',
    gap: '16px', padding: '16px',
  },
  profileHeader: {
    display: 'flex', alignItems: 'center', gap: '16px',
    ...GLASS_WHITE,
    borderRadius: '24px', padding: '24px 20px',
  },
  avatarLarge: {
    width: '64px', height: '64px',
    background: 'var(--color-accent)', borderRadius: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.8rem', fontWeight: 800,
    color: '#ffffff', fontFamily: FONT,
    flexShrink: 0, boxShadow: '0 4px 12px rgba(52,199,89,0.3)',
  },
  profileName: {
    fontFamily: FONT,
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)', letterSpacing: '-0.3px',
  },
  profileGoal: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '4px',
    textTransform: 'capitalize',
  },
  statsRow: {
    display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
  },
  statBox: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '16px 10px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '6px',
  },
  statVal: {
    fontFamily: FONT,
    fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-accent)',
  },
  statLabel: {
    fontSize: '0.7rem', fontWeight: 700,
    color: 'var(--color-text-muted)', fontFamily: FONT,
    letterSpacing: '0.5px', textTransform: 'uppercase',
  },
  menuCard: {
    ...GLASS_WHITE,
    borderRadius: '24px', overflow: 'hidden',
  },
  menuItem: {
    width: '100%', display: 'flex',
    alignItems: 'center', gap: '14px',
    padding: '16px 20px', background: 'transparent',
    cursor: 'pointer', transition: 'background 180ms ease',
  },
  menuIcon: {
    width: '44px', height: '44px',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '1.3rem', flexShrink: 0,
  },
  menuLabel: {
    fontSize: '1rem', fontWeight: 700,
    color: 'var(--color-text)', fontFamily: FONT,
  },
  menuSub: {
    fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '2px',
  },
  infoCard: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '16px',
    display: 'flex', flexDirection: 'column', gap: '4px',
    alignItems: 'center',
  },
  infoText: {
    fontSize: '0.8rem', color: 'var(--color-text-faint)', fontWeight: 600,
    fontFamily: FONT,
  },
  logoutBtn: {
    width: '100%', padding: '18px',
    background: 'rgba(255, 59, 48, 0.08)',
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: '20px',
    display: 'flex', alignItems: 'center',
    justifyContent: 'center', gap: '10px',
    cursor: 'pointer', transition: 'all 180ms ease',
  },

  // ── Modals ──
  modalOverlay: {
    position: 'fixed', inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 200, animation: 'fadeUp 0.2s ease-out'
  },
  modalCard: {
    width: '90%', maxWidth: '420px', maxHeight: '85dvh',
    ...GLASS_WHITE, background: 'rgba(255,255,255,0.85)',
    borderRadius: '28px', padding: '24px',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
    display: 'flex', flexDirection: 'column',
  },
  modalTitle: {
    fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800,
    color: 'var(--color-text)', marginBottom: '8px',
  },
  modalDesc: {
    fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginBottom: '20px', lineHeight: 1.5
  },
  modalInput: {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px',
    color: 'var(--color-text)', fontSize: '1rem', fontWeight: 500,
    fontFamily: FONT, boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)', outline: 'none'
  },
  modalSelect: {
    width: '100%', padding: '14px 16px',
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.05)', borderRadius: '16px',
    color: 'var(--color-text)', fontSize: '1rem', fontWeight: 500,
    fontFamily: FONT, outline: 'none', appearance: 'none'
  },
  fieldLabel: {
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-muted)',
    fontFamily: FONT, marginTop: '12px', marginBottom: '8px', display: 'block',
    textTransform: 'uppercase', letterSpacing: '0.5px'
  },
  modalActions: {
    display: 'flex', gap: '12px', marginTop: '24px',
  },
  modalPrimaryBtn: {
    flex: 1, padding: '16px',
    background: 'var(--color-accent)', border: 'none', borderRadius: '16px',
    color: '#ffffff', fontWeight: 800, fontSize: '1rem',
    cursor: 'pointer', fontFamily: FONT, boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
  },
  modalSecondaryBtn: {
    flex: 1, padding: '16px',
    background: 'rgba(0,0,0,0.04)', border: 'none', borderRadius: '16px',
    color: 'var(--color-text)', fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', fontFamily: FONT,
  },
  groceryRow: {
    display: 'flex', alignItems: 'center', gap: '14px',
    padding: '16px', border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px', background: 'rgba(255,255,255,0.6)',
    cursor: 'pointer', transition: 'all 150ms ease'
  },
  groceryName: {
    fontFamily: FONT, fontWeight: 700,
    fontSize: '1rem', lineHeight: 1.3,
  },
  grocerySub: {
    fontFamily: FONT, color: 'var(--color-text-muted)', fontWeight: 600,
    fontSize: '0.85rem', marginTop: '4px',
  },
}