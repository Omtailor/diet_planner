import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, RefreshCw, ShoppingCart, Loader2, X, CheckSquare, Square } from 'lucide-react'
import toast from 'react-hot-toast'
import { mealService } from '../../services/mealService'
import { groceryService } from '../../services/groceryService'
import API from '../../services/api'

// ─── Helpers ───────────────────────────────────────────────────

function getDateStr(offset = 0) {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr)
  const today = new Date()
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1)
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  })
}

function getWeekDays(centerDate) {
  const center = new Date(centerDate)
  const days = []
  for (let i = -3; i <= 3; i++) {
    const d = new Date(center)
    d.setDate(center.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

// ─── Skeleton ─────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div style={{
      width, height, background: 'var(--bg-surface-3)',
      borderRadius: radius, overflow: 'hidden', position: 'relative'
    }}>
      <div style={shimmerStyle} />
      <style>{`@keyframes shimmer{0%{transform:translateX(-100%)}100%{transform:translateX(100%)}}`}</style>
    </div>
  )
}
const shimmerStyle = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.06) 50%,transparent 100%)',
  animation: 'shimmer 1.5s ease-in-out infinite',
}

// ─── Swipe Card ────────────────────────────────────────────────

function SwipeMealCard({ meal, slot, onViewDetail, onRegenerate, regenerating }) {
  const dragRef = useRef(null)
  const startX = useRef(0)
  const currentX = useRef(0)
  const isDragging = useRef(false)
  const cardRef = useRef(null)

  const icons = { breakfast: '🌅', lunch: '☀️', dinner: '🌙' }
  const slotColors = {
    breakfast: 'rgba(255,167,38,0.15)',
    lunch: 'rgba(200,241,53,0.1)',
    dinner: 'rgba(96,184,255,0.12)',
  }
  const slotAccents = {
    breakfast: '#FFA726',
    lunch: '#C8F135',
    dinner: '#60B8FF',
  }

  const icon = icons[slot] || '🍽️'
  const bg = slotColors[slot] || 'transparent'
  const accent = slotAccents[slot] || 'var(--accent)'
  const label = slot.charAt(0).toUpperCase() + slot.slice(1)

  const name = meal?.food_item?.name || 'No meal assigned'
  const calories = meal?.calories || 0
  const protein = meal?.protein_g || 0
  const carbs = meal?.carbs_g || 0
  const fats = meal?.fats_g || 0

  // Drag handlers
  const onPointerDown = (e) => {
    isDragging.current = true
    startX.current = e.clientX || e.touches?.[0]?.clientX || 0
    cardRef.current.style.transition = 'none'
  }

  const onPointerMove = (e) => {
    if (!isDragging.current) return
    const x = (e.clientX || e.touches?.[0]?.clientX || 0) - startX.current
    currentX.current = x
    const rotate = x * 0.05
    cardRef.current.style.transform = `translateX(${x}px) rotate(${rotate}deg)`
  }

  const onPointerUp = () => {
    if (!isDragging.current) return
    isDragging.current = false
    cardRef.current.style.transition = 'transform 300ms cubic-bezier(0.16,1,0.3,1)'
    cardRef.current.style.transform = 'translateX(0) rotate(0deg)'
    currentX.current = 0
  }

  return (
    <div
      ref={cardRef}
      onMouseDown={onPointerDown}
      onMouseMove={onPointerMove}
      onMouseUp={onPointerUp}
      onMouseLeave={onPointerUp}
      onTouchStart={onPointerDown}
      onTouchMove={onPointerMove}
      onTouchEnd={onPointerUp}
      style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border)',
        borderRadius: '22px',
        overflow: 'hidden',
        userSelect: 'none',
        touchAction: 'pan-y',
        cursor: 'grab',
        willChange: 'transform',
        transition: 'transform 300ms cubic-bezier(0.16,1,0.3,1)',
      }}
    >
      {/* Card top accent area */}
      <div style={{
        background: bg, padding: '24px 20px 20px',
        display: 'flex', alignItems: 'center', gap: '16px',
      }}>
        <div style={{
          width: '64px', height: '64px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: accent, letterSpacing: '1px',
              textTransform: 'uppercase', fontFamily: 'Satoshi, sans-serif',
            }}>{label}</span>
            {meal?.food_item?.is_fasting_friendly && (
              <span style={tagStyle}>🙏 Fasting</span>
            )}
          </div>
          <h3 style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '1.25rem', fontWeight: 600,
            color: 'var(--text-primary)', letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}>{name}</h3>
          {meal?.food_item?.serving_size && (
            <p style={{
              fontSize: '0.8rem', color: 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', marginTop: '4px'
            }}>
              {meal.quantity} × {meal.food_item.serving_size}
              {meal.food_item.serving_unit}
            </p>
          )}
        </div>
      </div>

      {/* Macro pills */}
      <div style={{
        display: 'flex', gap: '8px', padding: '14px 20px',
        borderBottom: '1px solid var(--border)', flexWrap: 'wrap'
      }}>
        {[
          { label: 'Calories', value: `${calories}`, unit: 'kcal', color: accent },
          { label: 'Protein', value: `${protein}`, unit: 'g', color: '#60B8FF' },
          { label: 'Carbs', value: `${carbs}`, unit: 'g', color: 'var(--warning)' },
          { label: 'Fats', value: `${fats}`, unit: 'g', color: 'var(--error)' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{
            background: 'var(--bg-surface-2)',
            border: '1px solid var(--border)',
            borderRadius: '10px', padding: '8px 12px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '64px', flex: 1,
          }}>
            <span style={{
              fontSize: '1rem', fontWeight: 700,
              color, fontFamily: 'Satoshi, sans-serif', lineHeight: 1
            }}>
              {value}<span style={{ fontSize: '0.65rem', marginLeft: '1px' }}>{unit}</span>
            </span>
            <span style={{
              fontSize: '0.65rem', color: 'var(--text-faint)',
              fontFamily: 'Satoshi, sans-serif', marginTop: '3px',
              letterSpacing: '0.3px', textTransform: 'uppercase'
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Ingredients preview */}
      {meal?.food_item?.ingredients?.length > 0 && (
        <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
          <p style={{
            fontSize: '0.7rem', color: 'var(--text-faint)',
            fontFamily: 'Satoshi, sans-serif', letterSpacing: '0.5px',
            textTransform: 'uppercase', fontWeight: 600, marginBottom: '8px'
          }}>
            Ingredients
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {meal.food_item.ingredients.slice(0, 5).map((ing, i) => (
              <span key={i} style={ingTag}>
                {typeof ing === 'object' ? ing.name : ing}
              </span>
            ))}
            {meal.food_item.ingredients.length > 5 && (
              <span style={ingTag}>+{meal.food_item.ingredients.length - 5} more</span>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: '10px', padding: '14px 20px' }}>
        <button
          onClick={onViewDetail}
          style={{
            flex: 1, padding: '12px',
            background: accent, color: '#0A0A0A',
            border: 'none', borderRadius: '12px',
            fontSize: '0.875rem', fontWeight: 700,
            fontFamily: 'Satoshi, sans-serif', cursor: 'pointer',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}>
          View Nutrition 🌸
        </button>
      </div>
    </div>
  )
}

const tagStyle = {
  fontSize: '0.65rem', fontWeight: 600,
  color: 'var(--text-secondary)',
  background: 'var(--bg-surface-3)',
  border: '1px solid var(--border)',
  borderRadius: '999px', padding: '2px 8px',
  fontFamily: 'Satoshi, sans-serif',
}
const ingTag = {
  fontSize: '0.75rem', color: 'var(--text-secondary)',
  background: 'var(--bg-surface-2)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '3px 10px',
  fontFamily: 'Satoshi, sans-serif',
}

// ─── Grocery Mini Card ─────────────────────────────────────────

function GroceryCard({ onView }) {
  return (
    <button onClick={onView} style={{
      width: '100%',
      background: 'rgba(200,241,53,0.06)',
      border: '1px solid rgba(200,241,53,0.2)',
      borderRadius: '16px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '12px',
      cursor: 'pointer', transition: 'all 180ms ease',
    }}>
      <div style={{
        width: '44px', height: '44px',
        background: 'rgba(200,241,53,0.12)', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0
      }}>
        🛒
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif'
        }}>
          Weekly Grocery List
        </p>
        <p style={{
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          fontFamily: 'Satoshi, sans-serif', marginTop: '2px'
        }}>
          View & check ingredients
        </p>
      </div>
      <ChevronRight size={18} color="var(--accent)" />
    </button>
  )
}

// ─── Cheat Meal Button ─────────────────────────────────────────

function CheatMealButton({ onLog }) {
  return (
    <button onClick={onLog} style={{
      width: '100%',
      background: 'rgba(255,77,77,0.06)',
      border: '1px solid rgba(255,77,77,0.2)',
      borderRadius: '16px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '12px',
      cursor: 'pointer', transition: 'all 180ms ease',
    }}>
      <div style={{
        width: '44px', height: '44px',
        background: 'rgba(255,77,77,0.12)', borderRadius: '12px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.25rem', flexShrink: 0
      }}>
        🍔
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontSize: '0.875rem', fontWeight: 600,
          color: 'var(--text-primary)', fontFamily: 'Satoshi, sans-serif'
        }}>
          Log Cheat Meal
        </p>
        <p style={{
          fontSize: '0.75rem', color: 'var(--text-secondary)',
          fontFamily: 'Satoshi, sans-serif', marginTop: '2px'
        }}>
          AI detects food & adjusts plan
        </p>
      </div>
      <span style={{
        fontSize: '0.75rem', fontWeight: 700,
        color: 'var(--error)', background: 'rgba(255,77,77,0.1)',
        borderRadius: '999px', padding: '3px 10px',
        fontFamily: 'Satoshi, sans-serif'
      }}>+ Log</span>
    </button>
  )
}

// ─── Main Nutrition Page ───────────────────────────────────────

function Nutrition() {
  const navigate = useNavigate()
  const [dateOffset, setDateOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(getDateStr(0))
  const [dayMeal, setDayMeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [activeSlot, setActiveSlot] = useState(0)
  const [showGrocery, setShowGrocery] = useState(false)
  const [grocery, setGrocery] = useState(null)
  const [groceryLoading, setGroceryLoading] = useState(false)
  const slots = ['breakfast', 'lunch', 'dinner']

  useEffect(() => {
    fetchDayMeal(selectedDate)
  }, [selectedDate])

  const fetchDayMeal = async (date) => {
    setLoading(true)
    try {
      const res = await mealService.getDayMeal(date)
      setDayMeal(res.data)
    } catch {
      setDayMeal(null)
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (dir) => {
    const newOffset = dateOffset + dir
    setDateOffset(newOffset)
    setSelectedDate(getDateStr(newOffset))
    setActiveSlot(0)
  }

  const handleRegenerate = async () => {
    setRegenerating(true)
    try {
      await mealService.regenerateDay(selectedDate)
      await fetchDayMeal(selectedDate)
      toast.success('Day meals regenerated! 🔄')
    } catch {
      toast.error('Failed to regenerate')
    } finally {
      setRegenerating(false)
    }
  }

  const getMealSlot = (slot) =>
    dayMeal?.meal_slots?.find(m => m.slot === slot)

  const fetchGrocery = async () => {
    setGroceryLoading(true)
    try {
      const res = await API.get('/grocery/')
      setGrocery(res.data)
    } catch {
      toast.error('Could not load grocery list')
    } finally {
      setGroceryLoading(false)
    }
  }

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

  const weekDays = getWeekDays(selectedDate)

  return (
    <div style={pageWrap}>

      {/* ── Week Strip ── */}
      <div style={weekStrip}>
        {weekDays.map((d) => {
          const isSelected = d === selectedDate
          const isToday = d === getDateStr(0)
          const dayLabel = new Date(d).toLocaleDateString('en-IN', { weekday: 'short' })
          const dayNum = new Date(d).getDate()
          return (
            <button key={d}
              onClick={() => { setSelectedDate(d); setDateOffset(0); setActiveSlot(0) }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '4px',
                padding: '8px 6px', borderRadius: '12px',
                border: 'none', cursor: 'pointer', minWidth: '36px',
                background: isSelected ? 'var(--accent)' : 'transparent',
                transition: 'all 180ms ease',
              }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 600,
                color: isSelected ? '#0A0A0A' : 'var(--text-faint)',
                fontFamily: 'Satoshi, sans-serif',
                textTransform: 'uppercase', letterSpacing: '0.3px'
              }}>
                {dayLabel}
              </span>
              <span style={{
                fontSize: '0.9rem', fontWeight: 700,
                color: isSelected ? '#0A0A0A' : isToday ? 'var(--accent)' : 'var(--text-primary)',
                fontFamily: 'Satoshi, sans-serif'
              }}>
                {dayNum}
              </span>
              {isToday && !isSelected && (
                <div style={{
                  width: '4px', height: '4px',
                  background: 'var(--accent)', borderRadius: '50%'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Date Header ── */}
      <div style={dateHeader}>
        <button onClick={() => handleDateChange(-1)} style={navBtn}>
          <ChevronLeft size={18} color="var(--text-primary)" />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: 'Clash Display, sans-serif',
            fontSize: '1.1rem', fontWeight: 600,
            color: 'var(--text-primary)', letterSpacing: '-0.2px'
          }}>
            {formatDisplayDate(selectedDate)}
          </p>
          <p style={{
            fontSize: '0.75rem', color: 'var(--text-secondary)',
            fontFamily: 'Satoshi, sans-serif'
          }}>
            {formatFullDate(selectedDate)}
          </p>
        </div>
        <button onClick={() => handleDateChange(1)} style={navBtn}>
          <ChevronRight size={18} color="var(--text-primary)" />
        </button>
      </div>

      {/* ── Slot Tabs ── */}
      <div style={slotTabs}>
        {slots.map((slot, i) => (
          <button key={slot}
            onClick={() => setActiveSlot(i)}
            style={{
              flex: 1, padding: '10px 4px',
              background: activeSlot === i ? 'var(--accent)' : 'var(--bg-surface)',
              border: '1px solid',
              borderColor: activeSlot === i ? 'var(--accent)' : 'var(--border)',
              borderRadius: '12px',
              fontSize: '0.8125rem', fontWeight: activeSlot === i ? 700 : 500,
              color: activeSlot === i ? '#0A0A0A' : 'var(--text-secondary)',
              fontFamily: 'Satoshi, sans-serif', cursor: 'pointer',
              transition: 'all 200ms ease',
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '5px',
            }}>
            {slot === 'breakfast' ? '🌅' : slot === 'lunch' ? '☀️' : '🌙'}
            {slot.charAt(0).toUpperCase() + slot.slice(1)}
          </button>
        ))}
      </div>

      {/* ── Regenerate Bar ── */}
      <div style={regenBar}>
        <p style={{
          fontSize: '0.8rem', color: 'var(--text-secondary)',
          fontFamily: 'Satoshi, sans-serif'
        }}>
          {dayMeal?.is_fasting_day ? '🙏 Fasting day' : '📅 Regular day'}
        </p>
        <button onClick={handleRegenerate} disabled={regenerating} style={regenBtn}>
          {regenerating
            ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
            : <RefreshCw size={14} />}
          <span style={{ fontSize: '0.75rem', fontFamily: 'Satoshi, sans-serif' }}>
            Regenerate Day
          </span>
        </button>
      </div>

      {/* ── Meal Swipe Card ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="280px" radius="22px" />
        </div>
      ) : dayMeal ? (
        <SwipeMealCard
          key={`${selectedDate}-${activeSlot}`}
          slot={slots[activeSlot]}
          meal={getMealSlot(slots[activeSlot])}
          onViewDetail={() => navigate(`/nutrition/${selectedDate}`, {
            state: { slot: slots[activeSlot] }
          })}
          regenerating={regenerating}
        />
      ) : (
        <div style={emptyState}>
          <span style={{ fontSize: '3rem' }}>🍽️</span>
          <p style={{
            fontSize: '1rem', color: 'var(--text-secondary)',
            fontFamily: 'Satoshi, sans-serif', textAlign: 'center'
          }}>
            No meal plan for this day
          </p>
          <p style={{
            fontSize: '0.8rem', color: 'var(--text-faint)',
            fontFamily: 'Satoshi, sans-serif', textAlign: 'center'
          }}>
            Navigate to a day within your current week
          </p>
        </div>
      )}

      {/* ── Slot Dots ── */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '6px' }}>
        {slots.map((_, i) => (
          <button key={i} onClick={() => setActiveSlot(i)} style={{
            width: activeSlot === i ? '20px' : '6px',
            height: '6px',
            background: activeSlot === i ? 'var(--accent)' : 'var(--bg-surface-3)',
            borderRadius: '999px', border: 'none', cursor: 'pointer',
            transition: 'all 200ms ease', padding: 0,
          }} />
        ))}
      </div>

      {/* ── Grocery + Cheat Meal ── */}
      <GroceryCard onView={() => { setShowGrocery(true); fetchGrocery() }} />
      <CheatMealButton onLog={() => navigate('/cheat-meal')} />
      <div style={{ height: '8px' }} />

      {/* ── Grocery Modal ── */}
      {showGrocery && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'flex-end',
          backdropFilter: 'blur(4px)',
        }}
          onClick={() => setShowGrocery(false)}>

          <div style={{
            width: '100%', maxHeight: '85dvh',
            background: 'var(--bg-surface)',
            borderRadius: '24px 24px 0 0',
            padding: '20px',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 -8px 32px rgba(0,0,0,0.4)',
          }}
            onClick={e => e.stopPropagation()}>

            {/* Handle bar */}
            <div style={{
              width: '40px', height: '4px', borderRadius: '2px',
              background: 'var(--border)', margin: '0 auto 16px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '16px',
            }}>
              <div>
                <p style={{
                  fontFamily: 'Clash Display, sans-serif',
                  fontSize: '1.2rem', fontWeight: 700,
                  color: 'var(--text-primary)',
                }}>🛒 Weekly Grocery List</p>
                {grocery && (
                  <p style={{
                    fontSize: '0.75rem', color: 'var(--text-faint)',
                    fontFamily: 'Satoshi, sans-serif', marginTop: '2px',
                  }}>
                    {grocery.checked_items}/{grocery.total_items} items checked
                  </p>
                )}
              </div>
              <button onClick={() => setShowGrocery(false)} style={{
                background: 'var(--bg-surface-2)', border: '1px solid var(--border)',
                borderRadius: '50%', width: '34px', height: '34px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <X size={16} color="var(--text-secondary)" />
              </button>
            </div>

            {/* Content */}
            {groceryLoading ? (
              <div style={{
                display: 'flex', justifyContent: 'center',
                padding: '40px', color: 'var(--text-faint)',
              }}>
                <Loader2 size={28} color="var(--accent)"
                  style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : !grocery?.items?.length ? (
              <p style={{
                textAlign: 'center', padding: '40px',
                color: 'var(--text-faint)',
                fontFamily: 'Satoshi, sans-serif', fontSize: '0.9rem',
              }}>No grocery list found. Generate your meal plan first.</p>
            ) : (
              <div style={{
                overflowY: 'auto', flex: 1,
                display: 'flex', flexDirection: 'column', gap: '8px',
                paddingRight: '4px',
              }}>
                {grocery.items.map(item => (
                  <button key={item.id}
                    onClick={() => toggleItem(item.id, item.is_checked)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px 14px',
                      background: item.is_checked
                        ? 'rgba(109,170,69,0.08)'
                        : 'var(--bg-surface-2)',
                      border: `1px solid ${item.is_checked
                        ? 'rgba(109,170,69,0.3)'
                        : 'var(--border)'}`,
                      borderRadius: '12px', cursor: 'pointer',
                      transition: 'all 180ms ease', textAlign: 'left',
                    }}>
                    {item.is_checked
                      ? <CheckSquare size={18} color="#6daa45" />
                      : <Square size={18} color="var(--text-faint)" />}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: 'Satoshi, sans-serif', fontWeight: 600,
                        fontSize: '0.9rem',
                        color: item.is_checked
                          ? 'var(--text-faint)' : 'var(--text-primary)',
                        textDecoration: item.is_checked ? 'line-through' : 'none',
                      }}>{item.ingredient_name}</p>
                    </div>
                    <span style={{
                      fontSize: '0.75rem', color: 'var(--text-faint)',
                      fontFamily: 'Satoshi, sans-serif', flexShrink: 0,
                    }}>
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Done button */}
            <button onClick={() => setShowGrocery(false)} style={{
              marginTop: '14px', padding: '14px',
              background: 'var(--accent)', border: 'none',
              borderRadius: '14px', color: '#0A0A0A',
              fontFamily: 'Satoshi, sans-serif', fontWeight: 800,
              fontSize: '0.9375rem', cursor: 'pointer', flexShrink: 0,
            }}>
              Done
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

const pageWrap = {
  display: 'flex', flexDirection: 'column',
  gap: '14px', padding: '12px 16px',
}
const weekStrip = {
  display: 'flex', justifyContent: 'space-between',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '16px', padding: '8px',
}
const dateHeader = {
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between', padding: '0 4px',
}
const navBtn = {
  width: '38px', height: '38px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  cursor: 'pointer',
}
const slotTabs = {
  display: 'flex', gap: '8px',
}
const regenBar = {
  display: 'flex', alignItems: 'center',
  justifyContent: 'space-between',
}
const regenBtn = {
  display: 'flex', alignItems: 'center', gap: '5px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '8px', padding: '7px 12px',
  color: 'var(--text-secondary)', cursor: 'pointer',
  transition: 'all 180ms ease',
}
const emptyState = {
  display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  gap: '12px', padding: '48px 20px',
  background: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '22px',
}

export default Nutrition