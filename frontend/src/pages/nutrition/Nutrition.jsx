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
  // Use local date parts instead of toISOString
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
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
  for (let i = -15; i <= 29; i++) {
    const d = new Date(center)
    d.setDate(center.getDate() + i)
    days.push(d.toISOString().split('T')[0])
  }
  return days
}

// ─── Style Tokens (Matching Training Page) ─────────────────────
const FONT = "'General Sans', sans-serif";

const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

// ─── Skeleton ─────────────────────────────────────────────────

function Skeleton({ width = '100%', height = '16px', radius = '8px' }) {
  return (
    <div style={{
      width, height, background: 'rgba(0,0,0,0.06)',
      borderRadius: radius, overflow: 'hidden', position: 'relative'
    }}>
      <div style={shimmerStyle} />
    </div>
  )
}
const shimmerStyle = {
  position: 'absolute', inset: 0,
  background: 'linear-gradient(90deg,transparent 0%,rgba(255,255,255,0.4) 50%,transparent 100%)',
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
  // Apple Light Theme Accent Colors
  const slotColors = {
    breakfast: 'rgba(255, 149, 0, 0.12)', // Orange
    lunch: 'rgba(52, 199, 89, 0.12)',    // Green
    dinner: 'rgba(0, 122, 255, 0.12)',   // Blue
  }
  const slotAccents = {
    breakfast: '#FF9500',
    lunch: '#34C759',
    dinner: '#007AFF',
  }

  const icon = icons[slot] || '🍽️'
  const bg = slotColors[slot] || 'transparent'
  const accent = slotAccents[slot] || 'var(--color-accent)'
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
        ...GLASS_WHITE,
        borderRadius: '24px',
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
          background: 'rgba(255,255,255,0.6)',
          borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '2rem', flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{
              fontSize: '0.65rem', fontWeight: 800,
              color: accent, letterSpacing: '1px',
              textTransform: 'uppercase', fontFamily: FONT,
            }}>{label}</span>
            {meal?.food_item?.is_fasting_friendly && (
              <span style={tagStyle}>🙏 Fasting</span>
            )}
          </div>
          <h3 style={{
            fontFamily: FONT,
            fontSize: '1.3rem', fontWeight: 800,
            color: 'var(--color-text)', letterSpacing: '-0.3px',
            lineHeight: 1.2,
          }}>{name}</h3>
          {meal?.food_item?.serving_size && (
            <p style={{
              fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
              fontFamily: FONT, marginTop: '4px'
            }}>
              {meal.quantity} × {meal.food_item.serving_size} {meal.food_item.serving_unit}
            </p>
          )}
        </div>
      </div>

      {/* Macro pills */}
      <div style={{
        display: 'flex', gap: '8px', padding: '16px 20px',
        borderBottom: '1px solid rgba(0,0,0,0.04)', flexWrap: 'wrap'
      }}>
        {[
          { label: 'Calories', value: `${calories}`, unit: 'kcal', color: accent },
          { label: 'Protein', value: `${protein}`, unit: 'g', color: '#007AFF' },
          { label: 'Carbs', value: `${carbs}`, unit: 'g', color: '#FF9500' },
          { label: 'Fats', value: `${fats}`, unit: 'g', color: '#FF3B30' },
        ].map(({ label, value, unit, color }) => (
          <div key={label} style={{
            background: 'rgba(0,0,0,0.02)',
            border: '1px solid rgba(0,0,0,0.04)',
            borderRadius: '12px', padding: '10px 8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            minWidth: '64px', flex: 1,
          }}>
            <span style={{
              fontSize: '1.1rem', fontWeight: 800,
              color, fontFamily: FONT, lineHeight: 1
            }}>
              {value}<span style={{ fontSize: '0.65rem', marginLeft: '1px' }}>{unit}</span>
            </span>
            <span style={{
              fontSize: '0.65rem', color: 'var(--color-text-faint)', fontWeight: 600,
              fontFamily: FONT, marginTop: '4px',
              letterSpacing: '0.3px', textTransform: 'uppercase'
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Ingredients preview */}
      {meal?.food_item?.ingredients?.length > 0 && (
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
          <p style={{
            fontSize: '0.7rem', color: 'var(--color-text-faint)',
            fontFamily: FONT, letterSpacing: '0.5px',
            textTransform: 'uppercase', fontWeight: 700, marginBottom: '10px'
          }}>
            Ingredients
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
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
      <div style={{ display: 'flex', gap: '10px', padding: '16px 20px' }}>
        <button
          onClick={onViewDetail}
          style={{
            flex: 1, padding: '14px',
            background: 'var(--color-accent)', color: '#ffffff',
            border: 'none', borderRadius: '16px',
            fontSize: '0.9rem', fontWeight: 700,
            fontFamily: FONT, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(52,199,89,0.3)',
            transition: 'opacity 180ms ease, transform 180ms ease',
          }}>
          View Nutrition Details
        </button>
      </div>
    </div>
  )
}

const tagStyle = {
  fontSize: '0.65rem', fontWeight: 700,
  color: 'var(--color-text-muted)',
  background: 'rgba(0,0,0,0.04)',
  border: '1px solid rgba(0,0,0,0.05)',
  borderRadius: '999px', padding: '3px 10px',
  fontFamily: FONT,
}
const ingTag = {
  fontSize: '0.75rem', color: 'var(--color-text)', fontWeight: 500,
  background: 'rgba(255,255,255,0.6)',
  border: '1px solid rgba(0,0,0,0.06)',
  borderRadius: '10px', padding: '5px 12px',
  fontFamily: FONT,
}

// ─── Grocery Mini Card ─────────────────────────────────────────

function GroceryCard({ onView }) {
  return (
    <button onClick={onView} style={{
      width: '100%',
      ...GLASS_WHITE,
      borderRadius: '20px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '14px',
      cursor: 'pointer', transition: 'all 180ms ease',
    }}>
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(52,199,89,0.15)', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0
      }}>
        🛒
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-text)', fontFamily: FONT
        }}>
          Grocery List
        </p>
        <p style={{
          fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
          fontFamily: FONT, marginTop: '2px'
        }}>
          View & check ingredients
        </p>
      </div>
      <ChevronRight size={20} color="var(--color-text-muted)" />
    </button>
  )
}

// ─── Cheat Meal Button ─────────────────────────────────────────

function CheatMealButton({ onLog }) {
  return (
    <button onClick={onLog} style={{
      width: '100%',
      ...GLASS_WHITE,
      borderRadius: '20px', padding: '16px',
      display: 'flex', alignItems: 'center', gap: '14px',
      cursor: 'pointer', transition: 'all 180ms ease',
    }}>
      <div style={{
        width: '48px', height: '48px',
        background: 'rgba(255,59,48,0.15)', borderRadius: '14px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '1.4rem', flexShrink: 0
      }}>
        🍔
      </div>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <p style={{
          fontSize: '1rem', fontWeight: 700,
          color: 'var(--color-text)', fontFamily: FONT
        }}>
          Log Cheat Meal
        </p>
        <p style={{
          fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
          fontFamily: FONT, marginTop: '2px'
        }}>
          AI detects food & adjusts plan
        </p>
      </div>
      <span style={{
        fontSize: '0.8rem', fontWeight: 700,
        color: '#FF3B30', background: 'rgba(255,59,48,0.1)',
        borderRadius: '999px', padding: '4px 12px',
        fontFamily: FONT
      }}>+ Log</span>
    </button>
  )
}

// ─── Main Nutrition Page ───────────────────────────────────────

export default function Nutrition() {
  const navigate = useNavigate()
  const weekStripRef = useRef(null)
  const [dateOffset, setDateOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState(getDateStr(0))
  const [dayMeal, setDayMeal] = useState(null)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [activeSlot, setActiveSlot] = useState(0)
  const [displaySlot, setDisplaySlot] = useState(0)
  const [cardVisible, setCardVisible] = useState(true)
  const autoPlayRef = useRef(null)
  const transitioningRef = useRef(false)

  const switchSlot = (i) => {
    if (transitioningRef.current || i === displaySlot) return
    transitioningRef.current = true
    setCardVisible(false) // fade out
    setTimeout(() => {
      setDisplaySlot(i)
      setActiveSlot(i)
      setCardVisible(true) // fade in
      transitioningRef.current = false
    }, 280) // matches transition duration
  }

  useEffect(() => {
    autoPlayRef.current = setInterval(() => {
      setActiveSlot(prev => {
        const next = (prev + 1) % 3
        switchSlot(next)
        return prev // actual update happens inside switchSlot
      })
    }, 3000)
    return () => clearInterval(autoPlayRef.current)
  }, [displaySlot])

  const handleSlotChange = (i) => {
    clearInterval(autoPlayRef.current)
    switchSlot(i)
    autoPlayRef.current = setInterval(() => {
      setActiveSlot(prev => {
        const next = (prev + 1) % 3
        switchSlot(next)
        return prev
      })
    }, 3000)
  }
  const [showGrocery, setShowGrocery] = useState(false)
  const [grocery, setGrocery] = useState(null)
  const [groceryLoading, setGroceryLoading] = useState(false)
  const [generatingNextWeek, setGeneratingNextWeek] = useState(false)
  const [nextWeekExists, setNextWeekExists] = useState(false)
  const [latestPlanEndDate, setLatestPlanEndDate] = useState(null)  // always latest plan's end
  const [exportPdfLoading, setExportPdfLoading] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [exportStartDate, setExportStartDate] = useState(getDateStr(0))
  const [exportEndDate, setExportEndDate] = useState(getDateStr(6))
  const [showGroceryRangeModal, setShowGroceryRangeModal] = useState(false);
  const [groceryStartDate, setGroceryStartDate] = useState(getDateStr(0));
  const [groceryEndDate, setGroceryEndDate] = useState(getDateStr(6));
  const slots = ['breakfast', 'lunch', 'dinner']

  useEffect(() => {
    fetchDayMeal(selectedDate)
  }, [selectedDate])

  useEffect(() => {
    checkNextWeekPlan()
  }, [])

  useEffect(() => {
    if (!weekStripRef.current) return
    const selected = weekStripRef.current.querySelector('[data-selected="true"]')
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' })
    }
  }, [selectedDate])

  const checkNextWeekPlan = async () => {
    try {
      // Always fetch LATEST plan — not necessarily the current week
      const res = await mealService.getLatestPlan()
      const endDateStr = res.data?.week_end_date   // e.g. "2026-04-11"
      setLatestPlanEndDate(endDateStr || null)

      // Check if next week plan already exists
      if (endDateStr) {
        const nextStartDate = new Date(endDateStr)
        nextStartDate.setDate(nextStartDate.getDate() + 1)
        const nextStartStr = nextStartDate.toISOString().split('T')[0]
        try {
          await mealService.getDayMeal(nextStartStr)
          setNextWeekExists(true)
        } catch {
          setNextWeekExists(false)
        }
      }
    } catch {
      setLatestPlanEndDate(null)
      setNextWeekExists(false)
    }
  }

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

  const handleGenerateNextWeek = async () => {
    setGeneratingNextWeek(true)
    try {
      await mealService.generateNextWeek()
      setNextWeekExists(true)
      toast.success('Next week plan generated! 🗓️')
    } catch (err) {
      const msg = err?.response?.data?.detail || 'Failed to generate next week plan'
      toast.error(msg)
    } finally {
      setGeneratingNextWeek(false)
    }
  }

  const getMealSlot = (slot) =>
    dayMeal?.meal_slots?.find(m => m.slot === slot)

  const fetchGrocery = async (startDate = null, endDate = null) => {
    setGroceryLoading(true);
    try {
      let url = 'grocery';
      if (startDate && endDate) {
        url = `grocery?start_date=${startDate}&end_date=${endDate}`;
      }
      const res = await API.get(url);
      setGrocery(res.data);
    } catch {
      toast.error('Could not load grocery list');
    } finally {
      setGroceryLoading(false);
    }
  };

  const handleGroceryRangeConfirm = () => {
    setShowGroceryRangeModal(false);
    setShowGrocery(true);
    fetchGrocery(groceryStartDate, groceryEndDate);
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
    setExportPdfLoading(true)

    try {
      // Build array of all dates in range
      const allDates = []
      const parseLocalDate = (s) => {
        const [yyyy, mm, dd] = s.split('-').map(Number)
        return new Date(yyyy, mm - 1, dd)
      }
      let current = parseLocalDate(exportStartDate)
      const end = parseLocalDate(exportEndDate)
      while (current <= end) {
        const yyyy = current.getFullYear()
        const mm = String(current.getMonth() + 1).padStart(2, '0')
        const dd = String(current.getDate()).padStart(2, '0')
        allDates.push(`${yyyy}-${mm}-${dd}`)
        current.setDate(current.getDate() + 1)
      }

      // Fetch each day — null if 404
      const dayResults = await Promise.all(
        allDates.map(async (dateStr) => {
          try {
            const res = await mealService.getDayMeal(dateStr)
            return { date: dateStr, data: res.data }
          } catch {
            return { date: dateStr, data: null }
          }
        })
      )

      const { jsPDF } = window.jspdf
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = 210
      const pageH = 297
      const M = 14
      const CW = pageW - M * 2

      const GREEN = [34, 197, 94]
      const DARK = [17, 24, 39]
      const MUTED = [107, 114, 128]
      const FAINT = [209, 213, 219]
      const BG = [248, 250, 252]
      const WHITE = [255, 255, 255]
      const ORANGE = [234, 88, 12]
      const BLUE = [37, 99, 235]
      const PURPLE = [124, 58, 237]
      const RED = [220, 38, 38]
      const EMPTY_BG = [254, 242, 242]
      const EMPTY_BORDER = [252, 165, 165]

      const slotAccent = { breakfast: ORANGE, lunch: GREEN, dinner: BLUE }

      let y = 0
      let pageNum = 0

      const newPage = () => {
        if (pageNum > 0) doc.addPage()
        pageNum++
        doc.setFillColor(...GREEN)
        doc.rect(0, 0, pageW, 14, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(...WHITE)
        doc.text('WEEKLY MEAL PLAN', M, 9.5)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.text(`Page ${pageNum}`, pageW - M, 9.5, { align: 'right' })
        y = 22
      }

      const needsBreak = (h) => { if (y + h > pageH - 16) newPage() }

      newPage()

      // Cover block
      doc.setFillColor(...BG)
      doc.roundedRect(M, y, CW, 30, 3, 3, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(...DARK)
      doc.text('Your Meal Plan', M + 6, y + 12)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.setTextColor(...MUTED)
      const fmt = s => {
        const [yyyy, mm, dd] = s.split('-').map(Number)
        return new Date(yyyy, mm - 1, dd).toLocaleDateString('en-IN', {
          day: 'numeric', month: 'long', year: 'numeric'
        })
      }
      doc.text(`${fmt(exportStartDate)} – ${fmt(exportEndDate)}`, M + 6, y + 19)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.setTextColor(...GREEN)
      doc.text(`${allDates.length} days · 3 meals/day · Personalised by AI`, M + 6, y + 26)
      y += 38

      // Legend
      const legend = [
        { label: 'Calories', c: RED },
        { label: 'Protein', c: BLUE },
        { label: 'Carbs', c: ORANGE },
        { label: 'Fats', c: PURPLE },
      ]
      legend.forEach((l, i) => {
        const lx = M + i * (CW / 4)
        doc.setFillColor(...l.c)
        doc.circle(lx + 3, y + 2.5, 2, 'F')
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(8)
        doc.setTextColor(...MUTED)
        doc.text(l.label, lx + 7, y + 5)
      })
      y += 12

      doc.setDrawColor(...GREEN)
      doc.setLineWidth(0.6)
      doc.line(M, y, pageW - M, y)
      y += 10

      // Each day
      for (const { date: dateStr, data: day } of dayResults) {
        const dateLabel = (() => {
          const [yyyy, mm, dd] = dateStr.split('-').map(Number)
          return new Date(yyyy, mm - 1, dd).toLocaleDateString('en-IN', {
            weekday: 'long', day: 'numeric', month: 'long'
          })
        })()

        needsBreak(14)

        // Day banner
        doc.setFillColor(...DARK)
        doc.roundedRect(M, y, CW, 11, 2, 2, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(...WHITE)
        doc.text(dateLabel, M + 4, y + 7.5)
        if (day?.is_fasting_day) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...GREEN)
          doc.text('Fasting Day', pageW - M - 4, y + 7.5, { align: 'right' })
        }
        y += 15

        // No plan state
        if (!day) {
          needsBreak(24)
          doc.setFillColor(...EMPTY_BG)
          doc.setDrawColor(...EMPTY_BORDER)
          doc.setLineWidth(0.4)
          doc.roundedRect(M, y, CW, 18, 3, 3, 'FD')
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(9)
          doc.setTextColor(185, 28, 28)
          doc.text('No meal plan generated for this day.', M + CW / 2, y + 7, { align: 'center' })
          doc.setFontSize(7.5)
          doc.setTextColor(...MUTED)
          doc.text('Open the app to generate a plan for this date.', M + CW / 2, y + 13, { align: 'center' })
          y += 24
          continue
        }

        // Day notes
        if (day.day_notes) {
          needsBreak(12)
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(8)
          doc.setTextColor(...MUTED)
          const noteLines = doc.splitTextToSize(`Note: ${day.day_notes}`, CW - 4)
          noteLines.forEach(line => { needsBreak(5); doc.text(line, M + 2, y); y += 4.5 })
          y += 3
        }

        // Meal slots
        for (const slotKey of ['breakfast', 'lunch', 'dinner']) {
          const slot = day.meal_slots?.find(s => s.slot === slotKey)
          if (!slot) continue

          const accent = slotAccent[slotKey]
          const mealName = slot.food_item?.name || 'No meal'
          const nameLines = doc.splitTextToSize(mealName, CW - 14)
          const cardH = Math.max(38, 20 + nameLines.length * 6)

          needsBreak(cardH + 4)

          doc.setFillColor(...WHITE)
          doc.setDrawColor(...FAINT)
          doc.setLineWidth(0.3)
          doc.roundedRect(M, y, CW, cardH, 3, 3, 'FD')
          doc.setFillColor(...accent)
          doc.roundedRect(M, y, 3.5, cardH, 2, 2, 'F')

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(7)
          doc.setTextColor(...accent)
          doc.text(slotKey.toUpperCase(), M + 7, y + 7)

          doc.setFont('helvetica', 'bold')
          doc.setFontSize(11)
          doc.setTextColor(...DARK)
          nameLines.forEach((line, li) => doc.text(line, M + 7, y + 14 + li * 6))

          const afterName = y + 14 + nameLines.length * 6
          if (slot.food_item?.serving_size) {
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(7.5)
            doc.setTextColor(...MUTED)
            doc.text(
              `${slot.quantity > 1 ? slot.quantity + ' x ' : ''}${slot.food_item.serving_size} ${slot.food_item.serving_unit}`,
              M + 7, afterName + 4
            )
          }

          const pills = [
            { label: 'kcal', value: String(slot.calories || 0), c: RED },
            { label: 'P', value: `${slot.protein_g || 0}g`, c: BLUE },
            { label: 'C', value: `${slot.carbs_g || 0}g`, c: ORANGE },
            { label: 'F', value: `${slot.fats_g || 0}g`, c: PURPLE },
          ]
          const pillW = 24, pillH = 14, pillGap = 3
          const totalPillsW = pills.length * pillW + (pills.length - 1) * pillGap
          let px = pageW - M - totalPillsW - 2
          const py = y + cardH - pillH - 4

          pills.forEach(p => {
            doc.setFillColor(
              Math.round(p.c[0] * 0.1 + 255 * 0.9),
              Math.round(p.c[1] * 0.1 + 255 * 0.9),
              Math.round(p.c[2] * 0.1 + 255 * 0.9)
            )
            doc.roundedRect(px, py, pillW, pillH, 2, 2, 'F')
            doc.setFont('helvetica', 'bold')
            doc.setFontSize(8.5)
            doc.setTextColor(...p.c)
            doc.text(p.value, px + pillW / 2, py + 6.5, { align: 'center' })
            doc.setFont('helvetica', 'normal')
            doc.setFontSize(6.5)
            doc.setTextColor(...MUTED)
            doc.text(p.label, px + pillW / 2, py + 11.5, { align: 'center' })
            px += pillW + pillGap
          })
          y += cardH + 5
        }

        // Day total bar
        needsBreak(12)
        const totalCal = day.meal_slots?.reduce((s, m) => s + (m.calories || 0), 0) || 0
        const totalPro = day.meal_slots?.reduce((s, m) => s + (m.protein_g || 0), 0).toFixed(1) || 0
        const totalCarbs = day.meal_slots?.reduce((s, m) => s + (m.carbs_g || 0), 0).toFixed(1) || 0
        const totalFats = day.meal_slots?.reduce((s, m) => s + (m.fats_g || 0), 0).toFixed(1) || 0

        doc.setFillColor(...BG)
        doc.setDrawColor(...FAINT)
        doc.setLineWidth(0.3)
        doc.roundedRect(M, y, CW, 11, 2, 2, 'FD')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8.5)
        doc.setTextColor(...DARK)
        doc.text(`Day Total  ${totalCal} kcal`, M + 4, y + 7.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(...MUTED)
        doc.text(`P ${totalPro}g`, M + 54, y + 7.5)
        doc.text(`C ${totalCarbs}g`, M + 78, y + 7.5)
        doc.text(`F ${totalFats}g`, M + 102, y + 7.5)
        y += 18
      }

      // Footer
      doc.setFontSize(7)
      doc.setTextColor(...FAINT)
      doc.text(
        `Generated by NutriAI · ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        pageW / 2, pageH - 7, { align: 'center' }
      )

      doc.save(`meal-plan-${exportStartDate}-to-${exportEndDate}.pdf`)
      toast.success('PDF exported!')

    } catch (err) {
      console.error(err)
      toast.error('Export failed. Please try again.')
    } finally {
      setExportPdfLoading(false)
    }
  }

  const weekDays = getWeekDays(selectedDate)

  // Compute activation date = latestPlanEndDate + 1 day at 12 AM
  const nextWeekButtonActive = !nextWeekExists

  return (
    <div style={S.pageWrap}>

      {/* ── Week Strip ── */}
      <div ref={weekStripRef} style={S.weekStrip} className="week-strip">
        {weekDays.map((d) => {
          const isSelected = d === selectedDate
          const isToday = d === getDateStr(0)
          const dayLabel = new Date(d).toLocaleDateString('en-IN', { weekday: 'short' })
          const dayNum = new Date(d).getDate()
          return (
            <button key={d}
              data-selected={isSelected}
              onClick={() => { setSelectedDate(d); setDateOffset(0); setActiveSlot(0) }}
              style={{
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', gap: '6px',
                padding: '10px 8px', borderRadius: '16px',
                border: 'none', cursor: 'pointer',
                minWidth: '44px', flexShrink: 0,
                scrollSnapAlign: 'center',
                background: isSelected ? 'var(--color-accent)' : 'transparent',
                boxShadow: isSelected ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
                transition: 'all 200ms ease',
              }}>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700,
                color: isSelected ? '#ffffff' : 'var(--color-text-faint)',
                fontFamily: FONT,
                textTransform: 'uppercase', letterSpacing: '0.5px'
              }}>
                {dayLabel}
              </span>
              <span style={{
                fontSize: '1rem', fontWeight: 800,
                color: isSelected ? '#ffffff' : isToday ? 'var(--color-accent)' : 'var(--color-text)',
                fontFamily: FONT
              }}>
                {dayNum}
              </span>
              {isToday && !isSelected && (
                <div style={{
                  width: '5px', height: '5px', marginTop: '2px',
                  background: 'var(--color-accent)', borderRadius: '50%'
                }} />
              )}
            </button>
          )
        })}
      </div>

      {/* ── Date Header ── */}
      <div style={S.dateHeader}>
        <button onClick={() => handleDateChange(-1)} style={S.navBtn}>
          <ChevronLeft size={20} color="var(--color-text)" />
        </button>
        <div style={{ textAlign: 'center' }}>
          <p style={{
            fontFamily: FONT,
            fontSize: '1.2rem', fontWeight: 800,
            color: 'var(--color-text)', letterSpacing: '-0.2px'
          }}>
            {formatDisplayDate(selectedDate)}
          </p>
          <p style={{
            fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500,
            fontFamily: FONT, marginTop: '2px'
          }}>
            {formatFullDate(selectedDate)}
          </p>
        </div>
        <button onClick={() => handleDateChange(1)} style={S.navBtn}>
          <ChevronRight size={20} color="var(--color-text)" />
        </button>
      </div>

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

      {/* ── Meal Swipe Card ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Skeleton height="320px" radius="24px" />
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
            onRegenerate={handleRegenerate}
            regenerating={regenerating}
          />
        </div>
      ) : (
        <div style={S.emptyState}>
          <span style={{ fontSize: '3.5rem' }}>🍽️</span>
          <p style={{
            fontSize: '1.2rem', color: 'var(--color-text)', fontWeight: 700,
            fontFamily: FONT, textAlign: 'center', marginTop: '8px'
          }}>
            No meal plan generated
          </p>
          <p style={{
            fontSize: '0.9rem', color: 'var(--color-text-muted)', fontWeight: 500,
            fontFamily: FONT, textAlign: 'center', maxWidth: '24ch', lineHeight: 1.5
          }}>
            Navigate to a day within your current week or generate a new plan.
          </p>
        </div>
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
      {latestPlanEndDate && (
        nextWeekExists ? (
          <div style={{
            ...GLASS_WHITE,
            borderRadius: '20px', padding: '14px 16px',
            display: 'flex', alignItems: 'center', gap: '12px',
            border: '1px solid rgba(52,199,89,0.2)',
          }}>
            <span style={{ fontSize: '1.2rem' }}>✅</span>
            <p style={{
              fontSize: '0.9rem', fontWeight: 600,
              color: 'var(--color-text-muted)', fontFamily: FONT,
            }}>
              Next week plan is ready
            </p>
          </div>
        ) : (
          <button
            onClick={nextWeekButtonActive ? handleGenerateNextWeek : undefined}
            disabled={!nextWeekButtonActive || generatingNextWeek}
            style={{
              width: '100%', ...GLASS_WHITE,
              borderRadius: '20px', padding: '16px',
              display: 'flex', alignItems: 'center', gap: '14px',
              cursor: nextWeekButtonActive && !generatingNextWeek ? 'pointer' : 'not-allowed',
              border: `1px solid ${nextWeekButtonActive ? 'rgba(52,199,89,0.25)' : 'rgba(0,0,0,0.06)'}`,
              opacity: nextWeekButtonActive ? 1 : 0.55,
              transition: 'all 180ms ease',
            }}
          >
            <div style={{
              width: '48px', height: '48px',
              background: nextWeekButtonActive ? 'rgba(52,199,89,0.15)' : 'rgba(0,0,0,0.05)',
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
                Generate Next Week Plan
              </p>
              <p style={{
                fontSize: '0.8rem', fontWeight: 500,
                fontFamily: FONT, marginTop: '2px',
                color: nextWeekButtonActive ? 'var(--color-text-muted)' : '#FF9500',
              }}>
                {nextWeekButtonActive
                  ? `Starts ${(() => {
                    if (!latestPlanEndDate) return 'today'
                    const d = new Date(latestPlanEndDate)
                    d.setDate(d.getDate() + 1)
                    const today = new Date(); today.setHours(0, 0, 0, 0)
                    const start = d > today ? d : today
                    return start.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  })()} · 7 day meal + training plan`
                  : 'Next week plan already generated'}
              </p>
            </div>
            {generatingNextWeek
              ? <Loader2 size={20} color="var(--color-accent)"
                style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              : <ChevronRight size={20}
                color={nextWeekButtonActive ? 'var(--color-accent)' : 'var(--color-text-faint)'}
                style={{ flexShrink: 0 }} />
            }
          </button>
        )
      )}

      {/* ── Bottom Action Buttons ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <GroceryCard onView={() => setShowGroceryRangeModal(true)} />
        <CheatMealButton onLog={() => navigate('/cheat-meal')} />

        {/* Export PDF */}
        <button onClick={() => setShowExportModal(true)} disabled={exportPdfLoading}
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

      {/* Export PDF Modal */}
      {showGroceryRangeModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeUp 0.3s ease-out',
          }}
          onClick={() => setShowGroceryRangeModal(false)}
        >
          <div
            style={{
              width: '100%', maxHeight: '90dvh', overflowY: 'auto',
              ...GLASS_WHITE,
              background: 'rgba(255,255,255,0.95)',
              borderRadius: '32px 32px 0 0',
              padding: '24px',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px' }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  Weekly Grocery List
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4 }}>
                  Choose the date range to view ingredients
                </p>
              </div>
              <button
                onClick={() => setShowGroceryRangeModal(false)}
                style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Start Date
                </p>
                <input
                  type="date"
                  value={groceryStartDate}
                  onChange={e => setGroceryStartDate(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none' }}
                />
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  End Date
                </p>
                <input
                  type="date"
                  value={groceryEndDate}
                  min={groceryStartDate}
                  onChange={e => setGroceryEndDate(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none' }}
                />
              </div>
            </div>
            {groceryStartDate && groceryEndDate && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ display: 'inline-block', background: 'rgba(52,199,89,0.12)', color: 'var(--color-accent)', fontFamily: FONT, fontWeight: 700, fontSize: '0.85rem', borderRadius: 999, padding: '6px 16px' }}>
                  {Math.max(0, Math.round((new Date(groceryEndDate) - new Date(groceryStartDate)) / (1000 * 60 * 60 * 24) + 1))} days selected
                </span>
              </div>
            )}
            <button
              onClick={handleGroceryRangeConfirm}
              disabled={!groceryStartDate || !groceryEndDate || groceryStartDate > groceryEndDate}
              style={{
                width: '100%', padding: '16px',
                background: groceryStartDate > groceryEndDate ? 'rgba(0,0,0,0.1)' : 'var(--color-accent)',
                border: 'none', borderRadius: 16,
                color: groceryStartDate > groceryEndDate ? 'var(--color-text-muted)' : '#ffffff',
                fontFamily: FONT, fontWeight: 800, fontSize: '1rem',
                cursor: groceryStartDate > groceryEndDate ? 'not-allowed' : 'pointer',
                boxShadow: groceryStartDate > groceryEndDate ? 'none' : '0 8px 24px rgba(52,199,89,0.3)',
                transition: 'all 180ms ease',
              }}
            >
              🛒 View Grocery List
            </button>
          </div>
        </div>
      )}

      {/* Export PDF Modal */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'flex-end',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'fadeUp 0.3s ease-out',
        }} onClick={() => setShowExportModal(false)}>
          <div style={{
            width: '100%',
            maxHeight: '90dvh',
            overflowY: 'auto',
            ...GLASS_WHITE,
            background: 'rgba(255,255,255,0.95)',
            borderRadius: '32px 32px 0 0',
            padding: '24px',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
          }} onClick={e => e.stopPropagation()}>

            {/* Handle bar */}
            <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  Export as PDF
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4 }}>
                  Choose the date range to include
                </p>
              </div>
              <button onClick={() => setShowExportModal(false)} style={{
                background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%',
                width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>

            {/* Date Pickers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              {/* Start Date */}
              <div>
                <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Start Date
                </p>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={e => setExportStartDate(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 16, fontFamily: FONT,
                    fontSize: '1rem', fontWeight: 600,
                    color: 'var(--color-text)', outline: 'none',
                  }}
                />
              </div>

              {/* End Date */}
              <div>
                <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  End Date
                </p>
                <input
                  type="date"
                  value={exportEndDate}
                  min={exportStartDate}
                  onChange={e => setExportEndDate(e.target.value)}
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: 'rgba(0,0,0,0.04)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    borderRadius: 16, fontFamily: FONT,
                    fontSize: '1rem', fontWeight: 600,
                    color: 'var(--color-text)', outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Days count pill */}
            {exportStartDate && exportEndDate && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{
                  display: 'inline-block',
                  background: 'rgba(34,197,94,0.12)',
                  color: 'var(--color-accent)',
                  fontFamily: FONT, fontWeight: 700,
                  fontSize: '0.85rem', borderRadius: 999,
                  padding: '6px 16px',
                }}>
                  {Math.max(0, Math.round((new Date(exportEndDate) - new Date(exportStartDate)) / (1000 * 60 * 60 * 24)) + 1)} days selected
                </span>
              </div>
            )}

            {/* Export Button */}
            <button
              onClick={handleExportPdf}
              disabled={!exportStartDate || !exportEndDate || exportStartDate > exportEndDate}
              style={{
                width: '100%', padding: '16px',
                background: exportStartDate > exportEndDate ? 'rgba(0,0,0,0.1)' : 'var(--color-accent)',
                border: 'none', borderRadius: 16,
                color: exportStartDate > exportEndDate ? 'var(--color-text-muted)' : '#ffffff',
                fontFamily: FONT, fontWeight: 800, fontSize: '1rem',
                cursor: exportStartDate > exportEndDate ? 'not-allowed' : 'pointer',
                boxShadow: exportStartDate > exportEndDate ? 'none' : '0 8px 24px rgba(34,199,89,0.3)',
                transition: 'all 180ms ease',
              }}
            >
              Export PDF
            </button>
          </div>
        </div>
      )}
      {/* ── Grocery Modal ── */}
      {showGrocery && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 999,
          background: 'rgba(0,0,0,0.4)', // Softer dark overlay
          display: 'flex', alignItems: 'flex-end',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          animation: 'fadeUp 0.3s ease-out'
        }}
          onClick={() => setShowGrocery(false)}>

          <div style={{
            width: '100%', maxHeight: '85dvh',
            ...GLASS_WHITE, // Glass modal!
            background: 'rgba(255, 255, 255, 0.85)',
            borderRadius: '32px 32px 0 0',
            padding: '24px',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.1)',
          }}
            onClick={e => e.stopPropagation()}>

            {/* Handle bar */}
            <div style={{
              width: '48px', height: '5px', borderRadius: '3px',
              background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px',
            }} />

            {/* Header */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: '20px',
            }}>
              <div>
                <p style={{
                  fontFamily: FONT,
                  fontSize: '1.4rem', fontWeight: 800,
                  color: 'var(--color-text)',
                }}>🛒 Grocery List</p>
                {grocery && (
                  <p style={{
                    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
                    fontFamily: FONT, marginTop: '4px',
                  }}>
                    {grocery.checked_items}/{grocery.total_items} items checked
                  </p>
                )}
              </div>
              <button onClick={() => setShowGrocery(false)} style={{
                background: 'rgba(0,0,0,0.05)', border: 'none',
                borderRadius: '50%', width: '36px', height: '36px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}>
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>

            {/* Content */}
            {groceryLoading ? (
              <div style={{
                display: 'flex', justifyContent: 'center',
                padding: '60px 40px', color: 'var(--color-text-faint)',
              }}>
                <Loader2 size={32} color="var(--color-accent)"
                  style={{ animation: 'spin 0.8s linear infinite' }} />
              </div>
            ) : !grocery?.items?.length ? (
              <p style={{
                textAlign: 'center', padding: '60px 40px',
                color: 'var(--color-text-muted)', fontWeight: 500,
                fontFamily: FONT, fontSize: '1rem',
              }}>No grocery list found. Generate your meal plan first.</p>
            ) : (
              <div style={{
                overflowY: 'auto', flex: 1,
                display: 'flex', flexDirection: 'column', gap: '10px',
                paddingRight: '4px',
              }}>
                {grocery.items.map(item => (
                  <button key={item.id}
                    onClick={() => toggleItem(item.id, item.is_checked)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '16px',
                      background: item.is_checked
                        ? 'rgba(52,199,89,0.08)'
                        : 'rgba(255,255,255,0.6)',
                      border: `1px solid ${item.is_checked
                        ? 'rgba(52,199,89,0.3)'
                        : 'rgba(0,0,0,0.05)'}`,
                      borderRadius: '16px', cursor: 'pointer',
                      transition: 'all 180ms ease', textAlign: 'left',
                    }}>
                    {item.is_checked
                      ? <CheckSquare size={22} color="var(--color-accent)" />
                      : <Square size={22} color="var(--color-text-faint)" />}
                    <div style={{ flex: 1 }}>
                      <p style={{
                        fontFamily: FONT, fontWeight: 700,
                        fontSize: '1rem',
                        color: item.is_checked
                          ? 'var(--color-text-muted)' : 'var(--color-text)',
                        textDecoration: item.is_checked ? 'line-through' : 'none',
                      }}>{item.ingredient_name}</p>
                    </div>
                    <span style={{
                      fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 600,
                      fontFamily: FONT, flexShrink: 0,
                    }}>
                      {item.quantity} {item.unit}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Done button */}
            <button onClick={() => setShowGrocery(false)} style={{
              marginTop: '20px', padding: '16px',
              background: 'var(--color-accent)', border: 'none',
              borderRadius: '16px', color: '#ffffff',
              fontFamily: FONT, fontWeight: 800,
              fontSize: '1rem', cursor: 'pointer', flexShrink: 0,
              boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
            }}>
              Done
            </button>
          </div>
        </div>
      )}

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
  weekStrip: {
    ...GLASS_WHITE,
    display: 'flex',
    borderRadius: '24px', padding: '10px',
    overflowX: 'auto',
    gap: '4px',
    scrollbarWidth: 'none',         // Firefox
    msOverflowStyle: 'none',        // IE
    scrollSnapType: 'x mandatory',
  },
  dateHeader: {
    display: 'flex', alignItems: 'center',
    justifyContent: 'space-between', padding: '4px 8px',
  },
  navBtn: {
    width: '44px', height: '44px',
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '14px',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
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
  emptyState: {
    ...GLASS_WHITE,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    gap: '8px', padding: '60px 24px',
    borderRadius: '24px',
  }
}