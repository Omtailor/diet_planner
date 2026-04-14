import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight, RotateCcw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';

// ── Date helpers (same as Nutrition.jsx) ──
function getDateStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function formatDisplayDate(dateStr) {
  const d = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(); tomorrow.setDate(today.getDate() + 1);
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

function formatFullDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
}

function getWeekDays(centerDate) {
  const center = new Date(centerDate);
  const days = [];
  for (let i = -15; i < 29; i++) {
    const d = new Date(center);
    d.setDate(center.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    days.push(`${yyyy}-${mm}-${dd}`);
  }
  return days;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const CATEGORY_META = {
  strength: { icon: '🏋️‍♂️', color: '#34C759', glow: 'rgba(52,199,89,0.4)', bg: 'rgba(52,199,89,0.1)' },
  cardio: { icon: '🏃', color: '#FF9500', glow: 'rgba(255,149,0,0.4)', bg: 'rgba(255,149,0,0.1)' },
  flexibility: { icon: '🤸‍♂️', color: '#AF52DE', glow: 'rgba(175,82,222,0.4)', bg: 'rgba(175,82,222,0.1)' },
  bodyweight: { icon: '💪', color: '#007AFF', glow: 'rgba(0,122,255,0.4)', bg: 'rgba(0,122,255,0.1)' },
};

// ─── Count-Up Hook ─────────────────────────────────────────────
function useCountUp(target, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!target) return;
    let startTime = null;
    const step = (ts) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration]);
  return value;
}

// ─── Needle Bar ────────────────────────────────────────────────
function NeedleBar({ value, max, color, glow }) {
  const [animated, setAnimated] = useState(0);
  const pct = Math.min((value / (max || 1)) * 100, 100);
  useEffect(() => {
    const t = setTimeout(() => setAnimated(pct), 120);
    return () => clearTimeout(t);
  }, [pct]);

  return (
    <div style={{
      height: '6px', background: 'rgba(0,0,0,0.06)',
      borderRadius: '6px', overflow: 'visible', marginTop: '8px',
    }}>
      <div style={{
        height: '100%', width: `${animated}%`,
        background: color, borderRadius: '6px',
        boxShadow: `0 0 8px ${glow}`,
        transition: 'width 800ms cubic-bezier(0.34,1.56,0.64,1)',
        position: 'relative',
      }}>
        {animated > 3 && (
          <div style={{
            position: 'absolute', right: '-2px', top: '50%',
            transform: 'translateY(-50%)',
            width: '4px', height: '12px',
            background: '#ffffff',
            borderRadius: '2px', boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
          }} />
        )}
      </div>
    </div>
  );
}

// ─── Main Export ───────────────────────────────────────────────
export default function Training() {
  const navigate = useNavigate()
  const { fetchProfile } = useAuth()
  const [plan, setPlan] = useState(null);
  const weekStripRef = useRef(null);
  const [exportPdfLoading, setExportPdfLoading] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showOnboardingBlocker, setShowOnboardingBlocker] = useState(false)
  const [exportStartDate, setExportStartDate] = useState(() => {
    // Default to plan start date if available, else today
    const d = plan?.day_trainings?.[0]?.date;
    return d || new Date().toISOString().split('T')[0];
  });
  const [exportEndDate, setExportEndDate] = useState(() => {
    const days = plan?.day_trainings;
    const d = days?.[days.length - 1]?.date;
    return d || (() => {
      const e = new Date(); e.setDate(e.getDate() + 6);
      return e.toISOString().split('T')[0];
    })();
  });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenPulse, setRegenPulse] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [expandedEx, setExpandedEx] = useState(null);
  const [generatingNextPlan, setGeneratingNextPlan] = useState(false);
  const [nextPlanExists, setNextPlanExists] = useState(false);
  const [latestPlanEndDate, setLatestPlanEndDate] = useState(null);
  const [healthTimeZero, setHealthTimeZero] = useState(false);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [newHealthTime, setNewHealthTime] = useState('');
  const [savingHealthTime, setSavingHealthTime] = useState(false);

  // ── Date strip state ──
  const [selectedDate, setSelectedDate] = useState(getDateStr(0));
  const [dateOffset, setDateOffset] = useState(0);

  const today = new Date();
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;

  useEffect(() => { fetchPlan(); checkNextPlan(); }, []);

  useEffect(() => {
    if (!weekStripRef.current || !selectedDay) return;
    const selected = weekStripRef.current.querySelector('[data-selected="true"]');
    if (selected) {
      selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [selectedDay]);

  useEffect(() => {
    if (!weekStripRef.current) return;
    // Small delay ensures DOM has rendered before scrolling
    const t = setTimeout(() => {
      const selected = weekStripRef.current?.querySelector('[data-selected="true"]');
      if (selected) selected.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }, 100);
    return () => clearTimeout(t);
  }, [selectedDate]);

  // Sync selectedDay with selectedDate
  useEffect(() => {
    if (!plan?.day_trainings) return;
    const matchingDay = plan.day_trainings.find(d => d.date === selectedDate);
    setSelectedDay(matchingDay || null);
    setExpandedEx(null);
  }, [selectedDate, plan]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const res = await API.get('/training/weekly/');
      setPlan(res.data);
      const todayDay = res.data.day_trainings?.find(d => d.day_of_week === todayDow);
      const initialDay = todayDay || res.data.day_trainings?.[0] || null;
      setSelectedDay(initialDay);

      // ✅ Sync date strip to today's actual date from the plan
      if (initialDay?.date) {
        setSelectedDate(initialDay.date);
      }

      // ── ADD THIS — set end date directly from weekly plan response
      if (res.data?.week_end_date) {
        setLatestPlanEndDate(res.data.week_end_date);
      }

      // ── NEW: check profile health_time_minutes
      try {
        const profileRes = await API.get('/auth/profile/');
        if (parseInt(profileRes.data.health_time_minutes) === 0) {
          setHealthTimeZero(true);
        }
      } catch (_) { }
    } catch (e) {
      if (e?.response?.status === 404) setPlan(null);
      else toast.error('Failed to load training plan');
    } finally {
      setLoading(false);
    }
  };

  const checkNextPlan = async () => {
    try {
      const res = await API.get('/training/latest/');
      setLatestPlanEndDate(res.data?.week_end_date || null);
      setNextPlanExists(false);
    } catch {
      setLatestPlanEndDate(null);
      setNextPlanExists(false);
    }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try {
      const res = await API.post('/training/generate/');
      setPlan(res.data);
      const todayDay = res.data.day_trainings?.find(d => d.day_of_week === todayDow);
      const initialDay = todayDay || res.data.day_trainings?.[0] || null;
      setSelectedDay(initialDay);

      // ✅ Sync date strip after generation too
      if (initialDay?.date) {
        setSelectedDate(initialDay.date);
      }
      toast.success('Training plan generated! 🏋️‍♂️');
      if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
    } catch (err) {
      const detail = err?.response?.data?.detail
      if (detail === 'PROFILE_INCOMPLETE') {
        setShowOnboardingBlocker(true)
      } else if (detail === 'HEALTH_TIME_ZERO') {
        setHealthTimeZero(true)
        // Banner UI handles the feedback — no toast needed
      } else {
        toast.error('Failed to generate training plan')
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDateChange = (dir) => {
    const newOffset = dateOffset + dir;
    setDateOffset(newOffset);
    setSelectedDate(getDateStr(newOffset));
  };

  const handleGenerateNextPlan = async () => {
    setGeneratingNextPlan(true);
    try {
      const nextStart = latestPlanEndDate
        ? (() => {
          const d = new Date(latestPlanEndDate);
          d.setDate(d.getDate() + 1);
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        })()
        : getDateStr(0);

      const res = await API.post('/training/generate/', { week_start: nextStart });

      await fetchPlan();
      await checkNextPlan();
      await fetchProfile();

      setNextPlanExists(false);

      toast.success('Next 3 days plan ready! 💪', {
        duration: 3500,
        style: { fontFamily: FONT, fontWeight: 700 },
      });
    } catch (e) {
      if (e?.response?.status === 400) {
        toast.error(e.response.data?.message || 'Cannot generate plan.')
      } else {
        toast.error('Failed to generate next plan. Try again.')
      }
    } finally {
      setGeneratingNextPlan(false);
    }
  };

  const handleSaveHealthTime = async () => {
    const val = parseInt(newHealthTime)
    if (!val || val < 1 || val > 300) {
      toast.error('Please enter a valid time between 1–300 minutes')
      return
    }
    setSavingHealthTime(true)
    try {
      await API.patch('/auth/profile/', { health_time_minutes: val })
      await fetchProfile()
      setHealthTimeZero(false)
      setShowTimeEditor(false)
      toast.success('Updated! Now generate your training plan', {
        duration: 3500,
        style: { fontFamily: FONT, fontWeight: 700 },
      })
    } catch {
      toast.error('Failed to save. Please try again.')
    } finally {
      setSavingHealthTime(false)
    }
  };

  const handleExportPdf = async () => {
    setShowExportModal(false);
    setExportPdfLoading(true);
    try {
      const { jsPDF } = window.jspdf;
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

      const pageW = 210, pageH = 297, M = 14, CW = pageW - M * 2;

      const GREEN = [34, 197, 94];
      const DARK = [17, 24, 39];
      const MUTED = [107, 114, 128];
      const FAINT = [209, 213, 219];
      const BG = [248, 250, 252];
      const WHITE = [255, 255, 255];
      const ORANGE = [234, 88, 12];
      const BLUE = [37, 99, 235];
      const PURPLE = [124, 58, 237];
      const RED = [220, 38, 38];

      const catColor = {
        strength: GREEN,
        cardio: ORANGE,
        flexibility: PURPLE,
        bodyweight: BLUE,
      };

      let y = 0, pageNum = 0;

      const newPage = () => {
        if (pageNum > 0) doc.addPage();
        pageNum++;
        doc.setFillColor(...GREEN);
        doc.rect(0, 0, pageW, 14, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(...WHITE);
        doc.text('WEEKLY TRAINING PLAN', M, 9.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(`Page ${pageNum}`, pageW - M, 9.5, { align: 'right' });
        y = 22;
      };

      const needsBreak = (h) => { if (y + h > pageH - 16) newPage(); };

      const parseLocal = (s) => {
        const [yr, mo, dy] = s.split('-').map(Number);
        return new Date(yr, mo - 1, dy);
      };
      const days = (plan.day_trainings || []).filter(d => {
        if (!d.date) return true;
        const dt = parseLocal(d.date);
        return dt >= parseLocal(exportStartDate) && dt <= parseLocal(exportEndDate);
      });
      const totalWorkoutDays = days.filter(d => !d.is_rest_day).length;
      const totalCals = days.reduce((s, d) => s + (d.total_calories_burned || 0), 0);
      const totalMins = days.reduce((s, d) => s + (d.total_duration || 0), 0);

      newPage();

      // ── Cover block ──
      doc.setFillColor(...BG);
      doc.roundedRect(M, y, CW, 34, 3, 3, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(...DARK);
      doc.text('Your Weekly Training Plan', M + 6, y + 12);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      const d0 = days[0]?.date, dN = days[days.length - 1]?.date;
      const fmt = (s) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
      if (d0 && dN) doc.text(`${fmt(d0)}  -  ${fmt(dN)}`, M + 6, y + 20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...GREEN);
      doc.text(`${totalWorkoutDays} workout days   ${totalMins} mins total   ${totalCals} kcal burned`, M + 6, y + 28);
      y += 42;

      // ── Green divider ──
      doc.setDrawColor(...GREEN);
      doc.setLineWidth(0.6);
      doc.line(M, y, pageW - M, y);
      y += 10;

      // ── Days loop ──
      for (const day of days) {
        const dateLabel = new Date(day.date).toLocaleDateString('en-IN', {
          weekday: 'long', day: 'numeric', month: 'long'
        });

        needsBreak(14);

        // Day banner
        doc.setFillColor(...DARK);
        doc.roundedRect(M, y, CW, 11, 2, 2, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.setTextColor(...WHITE);
        doc.text(dateLabel, M + 4, y + 7.5);

        if (day.is_rest_day) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...GREEN);
          doc.text('Rest Day', pageW - M - 4, y + 7.5, { align: 'right' });
          y += 14;

          // Rest day note
          needsBreak(12);
          doc.setFillColor(...BG);
          doc.roundedRect(M, y, CW, 11, 2, 2, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(...MUTED);
          doc.text('Active recovery: light stretching, hydration, 8h sleep', M + 4, y + 7.5);
          y += 18;
          continue;
        }

        // Workout day stats on banner right
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GREEN);
        doc.text(`${day.total_duration}min  ${day.total_calories_burned}kcal`, pageW - M - 4, y + 7.5, { align: 'right' });
        y += 15;

        // Day notes
        if (day.day_notes) {
          needsBreak(10);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...MUTED);
          const noteLines = doc.splitTextToSize(`Note: ${day.day_notes}`, CW - 4);
          noteLines.forEach(line => {
            needsBreak(5);
            doc.text(line, M + 2, y);
            y += 4.5;
          });
          y += 3;
        }

        // ── Exercises ──
        const exercises = day.exercises || [];
        for (const ex of exercises) {
          const accent = catColor[ex.category] || BLUE;
          const calsBurned = Math.round((ex.calories_burned_per_min || 0) * (ex.duration_minutes || 0));

          const nameLines = doc.splitTextToSize(ex.name, CW - 60);
          const cardH = Math.max(24, 10 + nameLines.length * 6 + 8);

          needsBreak(cardH + 4);

          // Card
          doc.setFillColor(...WHITE);
          doc.setDrawColor(...FAINT);
          doc.setLineWidth(0.3);
          doc.roundedRect(M, y, CW, cardH, 3, 3, 'FD');

          // Left accent strip
          doc.setFillColor(...accent);
          doc.roundedRect(M, y, 3.5, cardH, 2, 2, 'F');

          // Category label
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(6.5);
          doc.setTextColor(...accent);
          doc.text((ex.category || 'exercise').toUpperCase(), M + 7, y + 6);

          // Exercise name
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(...DARK);
          nameLines.forEach((line, li) => doc.text(line, M + 7, y + 13 + li * 6));

          // Meta: duration + calories — bottom left
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...MUTED);
          doc.text(`${ex.duration_minutes} min`, M + 7, y + cardH - 4);

          // Macro pills — right side (2 pills: duration + kcal)
          const pills = [
            { label: 'min', value: String(ex.duration_minutes || 0), c: BLUE },
            { label: 'kcal', value: String(calsBurned), c: RED },
          ];
          if (ex.sets) pills.push({ label: 'sets', value: String(ex.sets), c: GREEN });
          if (ex.reps) pills.push({ label: 'reps', value: String(ex.reps), c: ORANGE });

          const pillW = 22, pillH = 13, pillGap = 3;
          let px = pageW - M - (pills.length * (pillW + pillGap)) - 2;
          const py = y + (cardH - pillH) / 2;

          pills.forEach(p => {
            doc.setFillColor(
              Math.round(p.c[0] * 0.1 + 255 * 0.9),
              Math.round(p.c[1] * 0.1 + 255 * 0.9),
              Math.round(p.c[2] * 0.1 + 255 * 0.9)
            );
            doc.roundedRect(px, py, pillW, pillH, 2, 2, 'F');
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(...p.c);
            doc.text(p.value, px + pillW / 2, py + 5.5, { align: 'center' });
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(6);
            doc.setTextColor(...MUTED);
            doc.text(p.label, px + pillW / 2, py + 10.5, { align: 'center' });
            px += pillW + pillGap;
          });

          y += cardH + 4;
        }

        // Day total bar
        needsBreak(12);
        doc.setFillColor(...BG);
        doc.setDrawColor(...FAINT);
        doc.setLineWidth(0.3);
        doc.roundedRect(M, y, CW, 11, 2, 2, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(...DARK);
        doc.text(`Day Total: ${day.total_duration} min`, M + 4, y + 7.5);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...MUTED);
        doc.text(`Calories: ${day.total_calories_burned} kcal`, M + 56, y + 7.5);
        doc.text(`Exercises: ${exercises.length}`, M + 110, y + 7.5);
        y += 18;
      }

      // ── Footer ──
      doc.setFontSize(7);
      doc.setTextColor(...FAINT);
      doc.text(
        `Generated by NutriAI  |  ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`,
        pageW / 2, pageH - 7, { align: 'center' }
      );

      doc.save(`training-plan-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Training PDF exported! 💪');
    } catch (err) {
      console.error(err);
      toast.error('Export failed. Please try again.');
    } finally {
      setExportPdfLoading(false);
    }
  };

  const isRestDay = selectedDay?.is_rest_day ?? false;

  // ── Loading ────────────────────────────────────────────────────
  if (loading) return (
    <div style={S.page}>
      <div style={S.centeredContent}>
        <div style={S.spinnerRing} className="spin-ring" />
        <p style={S.loadingText}>Loading your training plan...</p>
      </div>
      <GlobalStyles />
    </div>
  );

  // ── Onboarding Blocker ─────────────────────────────────────────
  if (showOnboardingBlocker) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px', fontFamily: FONT,
        animation: 'fadeUp 0.3s ease-out',
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏋️</div>

        <h2 style={{
          fontFamily: FONT, fontSize: '1.5rem', fontWeight: 800,
          color: 'var(--color-text)', textAlign: 'center',
          letterSpacing: '-0.3px', marginBottom: '10px',
        }}>
          Complete Your Profile First
        </h2>

        <p style={{
          fontFamily: FONT, fontSize: '0.95rem', fontWeight: 500,
          color: 'var(--color-text-muted)', textAlign: 'center',
          maxWidth: '260px', lineHeight: 1.6, marginBottom: '32px',
        }}>
          We need your fitness details to build a personalised training plan tailored to your goals.
        </p>

        <div style={{
          width: '100%', maxWidth: '300px',
          background: 'rgba(52,199,89,0.06)',
          border: '1px solid rgba(52,199,89,0.2)',
          borderRadius: '16px', padding: '16px 20px',
          marginBottom: '28px',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {[
            { emoji: '👤', text: 'Basic info — age, gender, city' },
            { emoji: '⚖️', text: 'Body stats — height & weight' },
            { emoji: '🎯', text: 'Your goal — fat loss, muscle gain...' },
            { emoji: '💪', text: 'Activity level & gym preference' },
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

        <button
          onClick={() => navigate('/onboarding')}
          style={{
            width: '100%', maxWidth: '300px', padding: '16px',
            background: 'var(--color-accent)',
            border: 'none', borderRadius: '16px',
            color: '#ffffff', fontFamily: FONT,
            fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(52,199,89,0.35)',
            marginBottom: '12px',
          }}
        >
          Complete Onboarding →
        </button>

        <button
          onClick={() => setShowOnboardingBlocker(false)}
          style={{
            width: '100%', maxWidth: '300px', padding: '12px',
            background: 'transparent',
            border: '1px solid rgba(0,0,0,0.08)',
            borderRadius: '16px',
            color: 'var(--color-text-muted)',
            fontFamily: FONT, fontWeight: 600,
            fontSize: '0.9rem', cursor: 'pointer',
          }}
        >
          Maybe Later
        </button>
      </div>
    )
  }

  // ── No Plan ────────────────────────────────────────────────────
  if (!plan) return (
    <div style={S.page}>
      <div style={{ position: 'relative', zIndex: 2, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ── Zero Health Time Banner (shown instead of generate button when time is 0) ── */}
        {healthTimeZero && !showTimeEditor && (
          <button
            onClick={() => setShowTimeEditor(true)}
            style={{
              width: '100%', ...GLASS_WHITE, borderRadius: 20,
              padding: '18px 18px', display: 'flex', alignItems: 'center', gap: 14,
              border: '1.5px solid rgba(255,149,0,0.35)',
              background: 'rgba(255,149,0,0.06)', cursor: 'pointer', textAlign: 'left',
            }}
          >
            <div style={{
              width: 50, height: 50, borderRadius: 14, background: 'rgba(255,149,0,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.5rem', flexShrink: 0,
            }}>⏱️</div>
            <div style={{ flex: 1 }}>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                Your daily health time is set to 0
              </p>
              <p style={{ fontFamily: FONT, fontSize: '0.82rem', color: 'rgba(255,149,0,0.95)', fontWeight: 600, marginTop: 4 }}>
                Tap here to set it and unlock your training plan ✨
              </p>
            </div>
            <ChevronRight size={20} color="rgba(255,149,0,0.8)" style={{ flexShrink: 0 }} />
          </button>
        )}

        {/* ── Inline Time Editor ── */}
        {healthTimeZero && showTimeEditor && (
          <div style={{
            ...GLASS_WHITE, borderRadius: 20, padding: '20px 18px',
            border: '1.5px solid rgba(255,149,0,0.3)', background: 'rgba(255,149,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: 14,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.3rem' }}>⏱️</span>
              <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                How many minutes can you spare daily?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[20, 30, 45, 60].map(t => (
                <button key={t} onClick={() => setNewHealthTime(String(t))} style={{
                  flex: 1, padding: '10px 0', borderRadius: 12,
                  border: `1.5px solid ${newHealthTime === String(t) ? 'var(--color-accent)' : 'rgba(0,0,0,0.08)'}`,
                  background: newHealthTime === String(t) ? 'rgba(52,199,89,0.12)' : 'rgba(255,255,255,0.7)',
                  fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
                  color: newHealthTime === String(t) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                  cursor: 'pointer',
                }}>
                  {t}m
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type="number" placeholder="Or type custom (1–300)"
                value={newHealthTime} onChange={e => setNewHealthTime(e.target.value)}
                min={1} max={300}
                style={{
                  flex: 1, padding: '12px 14px', borderRadius: 12,
                  border: '1px solid rgba(0,0,0,0.1)', fontFamily: FONT, fontSize: '1rem',
                  background: 'rgba(255,255,255,0.8)', outline: 'none', color: 'var(--color-text)',
                }}
              />
              <button
                onClick={handleSaveHealthTime}
                disabled={savingHealthTime || !newHealthTime}
                style={{
                  padding: '12px 20px', borderRadius: 12,
                  background: !newHealthTime ? 'rgba(0,0,0,0.08)' : 'var(--color-accent)',
                  border: 'none',
                  color: !newHealthTime ? 'var(--color-text-muted)' : '#fff',
                  fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
                  cursor: !newHealthTime ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0,
                }}
              >
                {savingHealthTime ? <Loader2 size={16} className="spin" /> : 'Save ✓'}
              </button>
            </div>
            <button onClick={() => setShowTimeEditor(false)} style={{
              background: 'none', border: 'none', fontFamily: FONT, fontSize: '0.8rem',
              color: 'var(--color-text-faint)', cursor: 'pointer', textAlign: 'center',
            }}>
              Cancel
            </button>
          </div>
        )}

        {/* ── Normal No Plan card (only shown when health time is valid) ── */}
        {!healthTimeZero && (
          <div style={S.glassCard}>
            <span style={{ fontSize: '3.5rem' }}>🏋️</span>
            <p style={S.noPlanTitle}>No Training Plan Yet</p>
            <p style={S.noPlanSub}>Generate your personalized weekly workout plan based on your profile and goals.</p>
            <button onClick={generatePlan} disabled={generating}
              style={{ ...S.generateBtn, opacity: generating ? 0.8 : 1 }}
              className={regenPulse ? 'regen-pulse' : ''}>
              {generating
                ? <><Loader2 size={16} className="spin" style={{ marginRight: 6 }} />Generating...</>
                : 'Generate Training Plan'
              }
            </button>
          </div>
        )}

      </div>
      <GlobalStyles />
    </div>
  )

  const days = plan.day_trainings || [];
  const totalWorkoutDays = days.filter(d => !d.is_rest_day).length;
  const totalCalsBurned = days.reduce((s, d) => s + (d.total_calories_burned || 0), 0);
  const totalMinutes = days.reduce((s, d) => s + (d.total_duration || 0), 0);

  return (
    <div style={S.page}>
      {/* ── Next Plan Generation Overlay ── */}
      {generatingNextPlan && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(255,255,255,0.97)',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          gap: 12, padding: 32,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
        }}>
          <div style={{ fontSize: '3.5rem', animation: 'pulse 1.5s ease-in-out infinite' }}>🏋️</div>
          <p style={{ fontFamily: FONT, fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-text)', textAlign: 'center' }}>
            Building your next training plan...
          </p>
          <p style={{ fontFamily: FONT, fontSize: '0.9rem', color: 'var(--color-text-muted)', textAlign: 'center', maxWidth: 260 }}>
            Crafting 3 personalised workout days for you
          </p>
          <p style={{ fontFamily: FONT, fontSize: '0.75rem', color: 'var(--color-text-faint)', marginTop: 8, textAlign: 'center' }}>
            This only takes a few seconds ⚡
          </p>
        </div>
      )}

      {/* ── Content ── */}
      <div style={{ position: 'relative', zIndex: 2 }}>

        {/* Body */}
        <div style={S.body}>

          {/* ── Week Date Strip ── */}
          <div
            ref={weekStripRef}
            style={{
              ...GLASS_WHITE,
              display: 'flex',
              borderRadius: 24,
              padding: 10,
              overflowX: 'auto',
              gap: 4,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              scrollSnapType: 'x mandatory',
            }}
            className="week-strip"
          >
            {getWeekDays(getDateStr(0)).map(d => {
              const isSelected = d === selectedDate;
              const isToday = d === getDateStr(0);
              const dayLabel = new Date(d).toLocaleDateString('en-IN', { weekday: 'short' });
              const dayNum = new Date(d).getDate();
              return (
                <button
                  key={d}
                  data-selected={isSelected}
                  onClick={() => { setSelectedDate(d); setDateOffset(0); }}
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                    gap: 6, padding: '10px 8px', borderRadius: 16, border: 'none',
                    cursor: 'pointer', minWidth: 44, flexShrink: 0, scrollSnapAlign: 'center',
                    background: isSelected ? 'var(--color-accent)' : 'transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(52,199,89,0.3)' : 'none',
                    transition: 'all 200ms ease',
                  }}
                >
                  <span style={{
                    fontSize: '0.65rem', fontWeight: 700, fontFamily: FONT,
                    color: isSelected ? '#ffffff' : 'var(--color-text-faint)',
                    textTransform: 'uppercase', letterSpacing: '0.5px'
                  }}>
                    {dayLabel}
                  </span>
                  <span style={{
                    fontSize: '1rem', fontWeight: 800, fontFamily: FONT,
                    color: isSelected ? '#ffffff' : isToday ? 'var(--color-accent)' : 'var(--color-text)'
                  }}>
                    {dayNum}
                  </span>
                  {isToday && !isSelected && (
                    <div style={{ width: 5, height: 5, marginTop: 2, background: 'var(--color-accent)', borderRadius: '50%' }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Date Header ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
            <button onClick={() => handleDateChange(-1)} style={S.navBtn}>
              <ChevronLeft size={20} color="var(--color-text)" />
            </button>
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontFamily: FONT, fontSize: '1.2rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '-0.2px' }}>
                {formatDisplayDate(selectedDate)}
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 2 }}>
                {formatFullDate(selectedDate)}
              </p>
            </div>
            <button onClick={() => handleDateChange(1)} style={S.navBtn}>
              <ChevronRight size={20} color="var(--color-text)" />
            </button>
          </div>
          {!selectedDay && plan && (
            <div style={S.glassCard}>
              <span style={{ fontSize: '2.5rem' }}>📅</span>
              <p style={S.noPlanTitle}>No Plan for This Day</p>
              <p style={S.noPlanSub}>No training plan was generated for this date.</p>
            </div>
          )}
          {selectedDay && (
            <DayDetail
              key={selectedDay.id}
              day={selectedDay}
              expandedEx={expandedEx}
              setExpandedEx={setExpandedEx}
            />
          )}
          <div style={{ height: '20px' }} />

          {/* ── Zero Health Time Banner ── */}
          {healthTimeZero && !showTimeEditor && (
            <button
              onClick={() => setShowTimeEditor(true)}
              style={{
                width: '100%',
                ...GLASS_WHITE,
                borderRadius: 20,
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                border: '1.5px solid rgba(255, 149, 0, 0.35)',
                background: 'rgba(255,149,0,0.06)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 14,
                background: 'rgba(255,149,0,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.4rem', flexShrink: 0,
              }}>⏱️</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>
                  You set health time to 0 minutes
                </p>
                <p style={{ fontFamily: FONT, fontSize: '0.8rem', color: 'rgba(255,149,0,0.9)', fontWeight: 600, marginTop: 3 }}>
                  Tap here to update it and unlock training plans ✨
                </p>
              </div>
              <ChevronRight size={20} color="rgba(255,149,0,0.8)" style={{ flexShrink: 0 }} />
            </button>
          )}

          {/* ── Inline Time Editor (shown after tap) ── */}
          {healthTimeZero && showTimeEditor && (
            <div style={{
              ...GLASS_WHITE,
              borderRadius: 20,
              padding: '20px 18px',
              border: '1.5px solid rgba(255,149,0,0.3)',
              background: 'rgba(255,149,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: '1.3rem' }}>⏱️</span>
                <p style={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)' }}>
                  How many minutes can you spare daily?
                </p>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {[20, 30, 45, 60].map(t => (
                  <button
                    key={t}
                    onClick={() => setNewHealthTime(String(t))}
                    style={{
                      flex: 1, padding: '10px 0',
                      borderRadius: 12,
                      border: `1.5px solid ${newHealthTime === String(t) ? 'var(--color-accent)' : 'rgba(0,0,0,0.08)'}`,
                      background: newHealthTime === String(t) ? 'rgba(52,199,89,0.12)' : 'rgba(255,255,255,0.7)',
                      fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
                      color: newHealthTime === String(t) ? 'var(--color-accent)' : 'var(--color-text-muted)',
                      cursor: 'pointer',
                    }}
                  >
                    {t}m
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  type="number"
                  placeholder="Or type custom (1–300)"
                  value={newHealthTime}
                  onChange={e => setNewHealthTime(e.target.value)}
                  min={1} max={300}
                  style={{
                    flex: 1, padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid rgba(0,0,0,0.1)',
                    fontFamily: FONT, fontSize: '1rem',
                    background: 'rgba(255,255,255,0.8)',
                    outline: 'none',
                    color: 'var(--color-text)',
                  }}
                />
                <button
                  onClick={handleSaveHealthTime}
                  disabled={savingHealthTime || !newHealthTime}
                  style={{
                    padding: '12px 20px',
                    borderRadius: 12,
                    background: !newHealthTime ? 'rgba(0,0,0,0.08)' : 'var(--color-accent)',
                    border: 'none',
                    color: !newHealthTime ? 'var(--color-text-muted)' : '#fff',
                    fontFamily: FONT, fontWeight: 700, fontSize: '0.9rem',
                    cursor: !newHealthTime ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', gap: 6,
                    flexShrink: 0,
                  }}
                >
                  {savingHealthTime
                    ? <Loader2 size={16} className="spin" />
                    : 'Save ✓'
                  }
                </button>
              </div>
              <button
                onClick={() => setShowTimeEditor(false)}
                style={{
                  background: 'none', border: 'none',
                  fontFamily: FONT, fontSize: '0.8rem',
                  color: 'var(--color-text-faint)', cursor: 'pointer',
                  textAlign: 'center',
                }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* ── Generate Next 3 Days (shown only after health time is fixed) ── */}
          {!healthTimeZero && (
            nextPlanExists ? (
              <div style={{
                ...GLASS_WHITE,
                borderRadius: '20px', padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: '12px',
                border: '1px solid rgba(52,199,89,0.2)',
              }}>
                <span style={{ fontSize: '1.2rem' }}>✅</span>
                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text-muted)', fontFamily: FONT }}>
                  Next training plan is ready
                </p>
              </div>
            ) : (
              <button
                onClick={handleGenerateNextPlan}
                disabled={generatingNextPlan}
                style={{
                  width: '100%', ...GLASS_WHITE,
                  borderRadius: '20px', padding: '16px',
                  display: 'flex', alignItems: 'center', gap: '14px',
                  cursor: generatingNextPlan ? 'not-allowed' : 'pointer',
                  border: '1px solid rgba(52,199,89,0.25)',
                  transition: 'all 180ms ease',
                }}
              >
                <div style={{
                  width: '48px', height: '48px',
                  background: 'rgba(52,199,89,0.15)', borderRadius: '14px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.4rem', flexShrink: 0,
                }}>🗓️</div>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: FONT }}>
                    Generate Next 3 Days Plan
                  </p>
                  <p style={{ fontSize: '0.8rem', fontWeight: 500, fontFamily: FONT, marginTop: '2px', color: 'var(--color-text-muted)' }}>
                    {latestPlanEndDate
                      ? (() => {
                        const start = new Date(latestPlanEndDate);
                        start.setDate(start.getDate() + 1);
                        const end = new Date(start);
                        end.setDate(end.getDate() + 2);
                        const fmt = (d) => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                        return `${fmt(start)} – ${fmt(end)} · 3 day plan`;
                      })()
                      : 'Extend your training into the next 3 days'}
                  </p>
                </div>
                {generatingNextPlan
                  ? <Loader2 size={20} color="var(--color-accent)" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                  : <ChevronRight size={20} color="var(--color-accent)" style={{ flexShrink: 0 }} />
                }
              </button>
            )
          )}

          {/* ── Export PDF ── */}
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exportPdfLoading}
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
              background: 'rgba(52,199,89,0.12)', borderRadius: '14px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.4rem', flexShrink: 0,
            }}>📄</div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text)', fontFamily: FONT }}>
                Export Training Plan as PDF
              </p>
              <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: '2px' }}>
                Full training details — exercises, sets & calories
              </p>
            </div>
            {exportPdfLoading
              ? <Loader2 size={20} color="var(--color-text-faint)" style={{ animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
              : <ChevronRight size={20} color="var(--color-text-faint)" style={{ flexShrink: 0 }} />}
          </button>
          <div style={{ height: '16px' }} />
        </div>

      </div>

      {/* ── Export PDF Modal ── */}
      {showExportModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 999,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-end',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            animation: 'fadeUp 0.3s ease-out',
          }}
          onClick={() => setShowExportModal(false)}
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
            {/* Handle bar */}
            <div style={{ width: 48, height: 5, borderRadius: 3, background: 'rgba(0,0,0,0.15)', margin: '0 auto 20px' }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-text)' }}>
                  Export Training PDF
                </p>
                <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: 4 }}>
                  Choose the date range to include
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '50%', width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={20} color="var(--color-text-muted)" />
              </button>
            </div>

            {/* Date Pickers */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  Start Date
                </p>
                <input
                  type="date"
                  value={exportStartDate}
                  onChange={e => setExportStartDate(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none' }}
                />
              </div>
              <div>
                <p style={{ fontFamily: FONT, fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-faint)', letterSpacing: '0.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                  End Date
                </p>
                <input
                  type="date"
                  value={exportEndDate}
                  min={exportStartDate}
                  onChange={e => setExportEndDate(e.target.value)}
                  style={{ width: '100%', padding: '14px 16px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, fontFamily: FONT, fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)', outline: 'none' }}
                />
              </div>
            </div>

            {/* Days count pill */}
            {exportStartDate && exportEndDate && (
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <span style={{ display: 'inline-block', background: 'rgba(52,199,89,0.12)', color: 'var(--color-accent)', fontFamily: FONT, fontWeight: 700, fontSize: '0.85rem', borderRadius: 999, padding: '6px 16px' }}>
                  {Math.max(0, Math.round((new Date(exportEndDate) - new Date(exportStartDate)) / (1000 * 60 * 60 * 24) + 1))} days selected
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
                boxShadow: exportStartDate > exportEndDate ? 'none' : '0 8px 24px rgba(52,199,89,0.3)',
                transition: 'all 180ms ease',
              }}
            >
              Export PDF 💪
            </button>
          </div>
        </div>
      )}

      <GlobalStyles />
    </div>
  );
}



// ─── Day Strip ─────────────────────────────────────────────────
function DayStrip({ days, selectedDay, todayDow, onSelect, stripRef }) {
  return (
    <div
      ref={stripRef}
      className="week-strip"
      style={{
        display: 'flex', gap: '8px',
        overflowX: 'auto', paddingBottom: '8px',
        scrollbarWidth: 'none', msOverflowStyle: 'none',
        scrollSnapType: 'x mandatory',
      }}
    >
      {days.map((day) => {
        const isToday = day.day_of_week === todayDow;
        const isSelected = selectedDay?.id === day.id;
        const isRest = day.is_rest_day;

        return (
          <motion.button
            key={day.id}
            data-selected={selectedDay?.id === day.id}
            onClick={() => onSelect(day)}
            layout
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            style={{
              scrollSnapAlign: 'center',
              minWidth: '64px', height: '76px',
              borderRadius: '20px', flexShrink: 0,
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              gap: '6px', cursor: 'pointer', position: 'relative',
              background: isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.6)',
              border: `1px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.8)'}`,
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              boxShadow: isSelected ? '0 8px 24px rgba(52,199,89,0.4)' : '0 4px 12px rgba(0,0,0,0.03)',
            }}
          >
            <span style={{
              fontSize: '0.65rem', fontWeight: 700,
              color: isSelected ? '#ffffff' : 'var(--color-text-faint)',
              fontFamily: "'General Sans', sans-serif",
              letterSpacing: '0.5px', textTransform: 'uppercase', zIndex: 1,
            }}>
              {DAY_NAMES[day.day_of_week]}
            </span>
            <span style={{ fontSize: '1.2rem', zIndex: 1 }}>
              {isRest ? '😴' : '💪'}
            </span>
            {isToday && !isSelected && (
              <div style={{
                position: 'absolute', bottom: '8px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--color-accent)',
                boxShadow: '0 0 8px rgba(52,199,89,0.8)',
                zIndex: 1,
              }} />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

// ─── Day Detail ────────────────────────────────────────────────
function DayDetail({ day, expandedEx, setExpandedEx }) {
  const dayDate = new Date(day.date);
  const dateStr = dayDate.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'short',
  });

  // Rest Day
  if (day.is_rest_day) {
    const tips = [
      { emoji: '🧘', label: 'Light stretching & mobility' },
      { emoji: '💧', label: 'Stay hydrated (3L target)' },
      { emoji: '😴', label: '8h sleep for muscle recovery' },
    ];
    return (
      <motion.div
        style={S.glassCard}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        <span style={{ fontSize: '3.5rem' }}>😴</span>
        <p style={S.restTitle}>Active Recovery</p>
        <p style={S.restSub}>Rest days are just as important as training days. Allow your body to rebuild.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '16px', width: '100%' }}>
          {tips.map(({ emoji, label }, i) => (
            <motion.div
              key={label}
              style={S.restTip}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.1 }}
            >
              <span style={{ marginRight: '12px', fontSize: '1.3rem' }}>{emoji}</span>
              <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  // Workout Day
  const exercises = day.exercises || [];
  const grouped = exercises.reduce((acc, ex) => {
    const cat = ex.category || 'bodyweight';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(ex);
    return acc;
  }, {});

  const maxCals = Math.max(
    ...exercises.map(ex => Math.round((ex.calories_burned_per_min || 0) * (ex.duration_minutes || 0))),
    1
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} className="day-detail-enter">
      {/* Day Header */}
      <div style={S.dayHeaderCard}>
        <div>
          <p style={S.dayHeaderTitle}>{dateStr}</p>
          <p style={S.dayHeaderSub}>{day.total_duration} min &nbsp;•&nbsp; {day.total_calories_burned} kcal</p>
        </div>
        <div style={S.dayHeaderBadge}>{exercises.length} exercises</div>
      </div>

      {/* Exercise Groups */}
      {Object.entries(grouped).map(([cat, exList]) => {
        const meta = CATEGORY_META[cat] || CATEGORY_META.bodyweight;
        return (
          <div key={cat} style={S.exGroupCard}>
            <div style={S.exGroupHeader}>
              <span style={{ fontSize: '1.2rem' }}>{meta.icon}</span>
              <span style={{
                fontFamily: "'General Sans', sans-serif",
                fontWeight: 700, fontSize: '0.8rem',
                color: meta.color, textTransform: 'uppercase', letterSpacing: '1px',
              }}>{cat}</span>
              <span style={{
                fontSize: '0.75rem', color: 'var(--color-text-faint)',
                fontFamily: "'General Sans', sans-serif", marginLeft: 'auto', fontWeight: 500
              }}>
                {exList.length} exercise{exList.length > 1 ? 's' : ''}
              </span>
            </div>

            <AnimatePresence>
              {exList.map((ex, i) => {
                const isExpanded = expandedEx === ex.id;
                const calsBurned = Math.round((ex.calories_burned_per_min || 0) * (ex.duration_minutes || 0));
                return (
                  <motion.button
                    key={ex.id}
                    onClick={() => setExpandedEx(isExpanded ? null : ex.id)}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30, delay: i * 0.05 }}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'flex-start', gap: '16px',
                      padding: '16px',
                      background: isExpanded ? 'rgba(255,255,255,0.4)' : 'transparent',
                      border: 'none',
                      borderTop: i > 0 ? '1px solid rgba(0,0,0,0.04)' : 'none',
                      cursor: 'pointer', transition: 'background 200ms ease',
                    }}
                  >
                    <div style={{
                      width: '10px', height: '10px', borderRadius: '50%',
                      background: meta.color, flexShrink: 0, marginTop: '6px',
                      boxShadow: `0 0 8px ${meta.glow}`,
                    }} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <p style={S.exName}>{ex.name}</p>
                      <p style={S.exMeta}>{ex.duration_minutes} min &nbsp;•&nbsp; ~{calsBurned} kcal</p>
                      <NeedleBar value={calsBurned} max={maxCals} color={meta.color} glow={meta.glow} />
                      <AnimatePresence>
                        {isExpanded && ex.instructions && (
                          <motion.div
                            key="instr"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                            style={{ overflow: 'hidden' }}
                          >
                            <p style={S.exInstructions}>{ex.instructions}</p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 90 : 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      style={{ flexShrink: 0, marginTop: '2px' }}
                    >
                      <ChevronRight size={18} color="var(--color-text-faint)" />
                    </motion.div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}

// ─── Global Styles ─────────────────────────────────────────────
function GlobalStyles() {
  return (
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

      .week-strip::-webkit-scrollbar { display: none; }
      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      @keyframes regenPulse {
        0%   { box-shadow: 0 0 0 0 rgba(52,199,89,0.6); }
        70%  { box-shadow: 0 0 0 16px rgba(52,199,89,0); }
        100% { box-shadow: 0 0 0 0 rgba(52,199,89,0); }
      }
      @keyframes fadeUp {
        from { opacity:0; transform:translateY(16px); }
        to   { opacity:1; transform:translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.15); }
      }

      .spin       { animation: spin 0.8s linear infinite; }
      .spin-ring  { animation: spin 0.9s linear infinite; }
      .regen-pulse { animation: regenPulse 0.6s ease-out; }
      .day-detail-enter { animation: fadeUp 0.4s cubic-bezier(0.16,1,0.3,1) both; }
    `}</style>
  );
}

// ─── Style Tokens ──────────────────────────────────────────────
const FONT = "'General Sans', sans-serif";

// Apple Glass Morphism Theme
const GLASS_WHITE = {
  background: 'rgba(255, 255, 255, 0.65)',
  backdropFilter: 'blur(24px) saturate(180%)',
  WebkitBackdropFilter: 'blur(24px) saturate(180%)',
  border: '1px solid rgba(255, 255, 255, 0.8)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
};

const S = {
  page: {
    minHeight: '100dvh',
    position: 'relative',
    fontFamily: FONT,
    background: '#F2F2F7',
  },

  // ── Loading ──
  centeredContent: {
    position: 'relative', zIndex: 2,
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', gap: '16px',
  },
  spinnerRing: {
    width: '40px', height: '40px', borderRadius: '50%',
    border: '4px solid rgba(52,199,89,0.2)',
    borderTop: '4px solid var(--color-accent)',
  },
  loadingText: {
    fontFamily: FONT, fontSize: '1rem', fontWeight: 500,
    color: 'var(--color-text-muted)',
  },

  // ── Reusable Glass Card ──
  glassCard: {
    ...GLASS_WHITE,
    borderRadius: '24px', padding: '40px 24px',
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', gap: '16px', textAlign: 'center',
  },

  // ── No Plan ──
  noPlanTitle: {
    fontFamily: FONT, fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-text)',
  },
  noPlanSub: {
    fontSize: '0.95rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, maxWidth: '28ch', lineHeight: 1.5,
  },
  generateBtn: {
    marginTop: '12px', padding: '16px 32px',
    background: 'var(--color-accent)', border: 'none',
    borderRadius: '16px', color: '#ffffff',
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem',
    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
    boxShadow: '0 8px 24px rgba(52,199,89,0.3)',
    transition: 'transform 150ms ease',
  },

  // ── Body ──
  body: {
    padding: '0 16px',
    display: 'flex', flexDirection: 'column', gap: '16px',
  },

  // ── Day Header Card ──
  dayHeaderCard: {
    ...GLASS_WHITE,
    borderRadius: '20px', padding: '20px',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  },
  dayHeaderTitle: {
    fontFamily: FONT, fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)',
  },
  dayHeaderSub: {
    fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500,
    fontFamily: FONT, marginTop: '4px',
  },
  dayHeaderBadge: {
    background: 'rgba(52,199,89,0.15)',
    borderRadius: '999px', padding: '6px 14px',
    fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-accent)',
    fontFamily: FONT,
  },

  // ── Exercise Group ──
  exGroupCard: {
    ...GLASS_WHITE,
    borderRadius: '20px', overflow: 'hidden',
  },
  exGroupHeader: {
    display: 'flex', alignItems: 'center', gap: '10px',
    padding: '14px 20px',
    borderBottom: '1px solid rgba(0,0,0,0.04)',
    background: 'rgba(255,255,255,0.4)',
  },
  exName: {
    fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'var(--color-text)',
  },
  exMeta: {
    fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500, fontFamily: FONT, marginTop: '4px',
  },
  exInstructions: {
    fontSize: '0.9rem', color: 'var(--color-text)', fontFamily: FONT,
    marginTop: '12px', lineHeight: 1.6,
    padding: '14px',
    background: 'rgba(0,0,0,0.03)',
    borderRadius: '12px', textAlign: 'left',
  },

  // ── Rest Day Tips ──
  restTitle: {
    fontFamily: FONT, fontSize: '1.6rem', fontWeight: 800, color: 'var(--color-text)',
  },
  restSub: {
    fontSize: '0.95rem', color: 'var(--color-text-muted)',
    fontFamily: FONT, maxWidth: '30ch', lineHeight: 1.5,
  },
  restTip: {
    background: 'rgba(255,255,255,0.8)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: '16px', padding: '16px',
    fontSize: '0.95rem',
    fontFamily: FONT,
    display: 'flex', alignItems: 'center', width: '100%',
    cursor: 'default',
    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
  },

  navBtn: {
    width: 44, height: 44,
    background: 'rgba(255,255,255,0.6)',
    border: '1px solid rgba(0,0,0,0.04)',
    borderRadius: 14,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
};