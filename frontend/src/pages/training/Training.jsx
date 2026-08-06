import { useState, useEffect, useRef } from 'react';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';

import API from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { getDateStr, formatDisplayDate, formatFullDate } from '../../utils/date';
import { exportTrainingPdf } from '../../utils/training/exportTrainingPdf';
import { S, FONT, GLASS_WHITE } from '../../utils/training/constants';

import GlobalStyles from '../../components/training/GlobalStyles';
import LoadingSkeleton from '../../components/training/LoadingSkeleton';
import OnboardingBlocker from '../../components/training/OnboardingBlocker';
import WeekStrip from '../../components/training/WeekStrip';
import DayDetail from '../../components/training/DayDetail';
import HealthTimeEditor from '../../components/training/HealthTimeEditor';
import GeneratePlanCard from '../../components/training/GeneratePlanCard';
import GenerateNextPlanCard from '../../components/training/GenerateNextPlanCard';
import ExportPdfModal from '../../components/training/ExportPdfModal';

const TRAINING_LOG_PREFIX = '[TrainingPage]';
const CACHE_TTL = 60 * 1000;

// ─── Main Export ───────────────────────────────────────────────
export default function Training() {
  const { fetchProfile, user, profile } = useAuth();

  const cacheUserKey = user?.id ?? profile?.id ?? user?.username ?? profile?.username ?? null;
  const PLAN_CACHE_KEY = cacheUserKey ? `training_plan:${cacheUserKey}` : null;

  // ── Plan state ──
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [regenPulse] = useState(false);
  const [generatingNextPlan, setGeneratingNextPlan] = useState(false);
  const [nextPlanExists, setNextPlanExists] = useState(false);
  const [latestPlanEndDate, setLatestPlanEndDate] = useState(null);

  // ── Date strip state ──
  const [selectedDate, setSelectedDate] = useState(getDateStr(0));
  const [expandedEx, setExpandedEx] = useState(null);

  // ── Health time editor ──
  const [healthTimeZero, setHealthTimeZero] = useState(false);
  const [showTimeEditor, setShowTimeEditor] = useState(false);
  const [newHealthTime, setNewHealthTime] = useState('');
  const [savingHealthTime, setSavingHealthTime] = useState(false);

  // ── UI overlays ──
  const [showOnboardingBlocker, setShowOnboardingBlocker] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportPdfLoading, setExportPdfLoading] = useState(false);

  // ── Export date range ──
  const [exportStartDate, setExportStartDate] = useState(() => {
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

  const weekStripRef = useRef(null);
  const lastFetchTime = useRef(null);

  const selectedDay = plan?.day_trainings?.find(d => d.date === selectedDate) ?? null;

  // ── Helpers ───────────────────────────────────────────────────

  const logTraining = (...args) => console.info(TRAINING_LOG_PREFIX, ...args);

  const scrollToSelectedDay = (behavior = 'instant', delay = 200) => {
    if (!weekStripRef.current) return;
    setTimeout(() => {
      const selected = weekStripRef.current?.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ behavior, inline: 'center', block: 'nearest' });
      }
    }, delay);
  };

  const applyPlanResponse = (planData, source = 'unknown', jumpToFirstDay = false) => {
    if (!planData) return;

    logTraining('Applying plan from', source, {
      dayCount: planData.day_trainings?.length || 0,
      weekStartDate: planData.week_start_date || null,
      weekEndDate: planData.week_end_date || null,
      jumpToFirstDay,
    });

    setPlan(planData);
    if (planData.week_end_date) setLatestPlanEndDate(planData.week_end_date);

    if (jumpToFirstDay) {
      const firstDay = planData.day_trainings?.[0] || null;
      if (firstDay) setSelectedDate(firstDay.date);
    }
  };

  // ── Effects ───────────────────────────────────────────────────

  // Reset when cache scope changes (user switch)
  useEffect(() => {
    logTraining('Cache scope changed', { cacheKey: PLAN_CACHE_KEY, hasPlan: !!plan, selectedDate });
    setPlan(null);
    setSelectedDate(getDateStr(0));
    lastFetchTime.current = null;
  }, [PLAN_CACHE_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Initial fetch
  useEffect(() => {
    fetchPlan();
    checkNextPlan();
  }, [PLAN_CACHE_KEY]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug render state
  useEffect(() => {
    logTraining('Render state', {
      hasPlan: !!plan, loading, generating, generatingNextPlan, selectedDate,
      planDays: plan?.day_trainings?.length || 0,
    });
  }, [plan, loading, generating, generatingNextPlan, selectedDate]);

  // Scroll to selected day & collapse exercise on date change
  useEffect(() => {
    scrollToSelectedDay('instant', 200);
    setExpandedEx(null);
  }, [selectedDate, plan, loading]);

  // ── API calls ─────────────────────────────────────────────────

  const fetchPlan = async (jumpToFirstDay = false) => {
    const now = Date.now();
    let cachedPlan = null;

    logTraining('fetchPlan start', { jumpToFirstDay, cacheKey: PLAN_CACHE_KEY });

    if (!jumpToFirstDay && PLAN_CACHE_KEY) {
      const cached = sessionStorage.getItem(PLAN_CACHE_KEY);
      if (cached) {
        try {
          cachedPlan = JSON.parse(cached);
          if (cachedPlan) applyPlanResponse(cachedPlan, 'sessionStorage', false);
        } catch {
          sessionStorage.removeItem(PLAN_CACHE_KEY);
        }
      }
    }

    const isFresh =
      !jumpToFirstDay &&
      lastFetchTime.current &&
      now - lastFetchTime.current < CACHE_TTL;

    if (isFresh && (plan || cachedPlan)) {
      setLoading(false);
      return;
    }

    if (!cachedPlan) setLoading(true);

    try {
      const [res, profileRes] = await Promise.all([
        API.get('/training/all-days/'),
        API.get('/auth/profile/').catch(() => null),
      ]);

      applyPlanResponse(res.data, 'GET /training/all-days/', jumpToFirstDay);

      if (PLAN_CACHE_KEY) sessionStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(res.data));

      if (profileRes?.data) {
        setHealthTimeZero(parseInt(profileRes.data.health_time_minutes, 10) === 0);
      }

      lastFetchTime.current = Date.now();
    } catch (e) {
      if (e?.response?.status === 404) {
        setPlan(null);
        if (PLAN_CACHE_KEY) sessionStorage.removeItem(PLAN_CACHE_KEY);
      } else {
        toast.error('Failed to load training plan');
      }
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
    logTraining('Generate training plan requested');
    try {
      const res = await API.post('/training/generate/');
      logTraining('Generate training plan response received', {
        status: res.status, dayCount: res.data?.day_trainings?.length || 0,
      });

      applyPlanResponse(res.data, 'POST /training/generate/', true);
      if (PLAN_CACHE_KEY) sessionStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(res.data));

      void checkNextPlan();
      void fetchProfile();
      scrollToSelectedDay('smooth', 300);
      toast.success('Training plan generated! 🏋️‍♂️');
      if (navigator.vibrate) navigator.vibrate([40, 20, 40]);
    } catch (err) {
      console.error(TRAINING_LOG_PREFIX, 'Generate training plan failed', err);
      const detail = err?.response?.data?.detail;
      if (detail === 'PROFILE_INCOMPLETE') {
        setShowOnboardingBlocker(true);
      } else if (detail === 'HEALTH_TIME_ZERO') {
        setHealthTimeZero(true);
      } else {
        toast.error('Failed to generate training plan');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateNextPlan = async () => {
    setGeneratingNextPlan(true);
    logTraining('Generate next plan requested');
    try {
      const res = await API.post('/training/generate/');
      const firstDateOfNewPlan = res.data?.day_trainings?.[0]?.date;

      logTraining('Generate next plan response received', {
        status: res.status, dayCount: res.data?.day_trainings?.length || 0, firstDateOfNewPlan,
      });

      applyPlanResponse(res.data, 'POST /training/generate/ next plan', true);
      if (PLAN_CACHE_KEY) sessionStorage.setItem(PLAN_CACHE_KEY, JSON.stringify(res.data));

      void checkNextPlan();
      void fetchProfile();
      setNextPlanExists(false);
      toast.success('Next 3 days plan ready! 💪', {
        duration: 3500,
        style: { fontFamily: FONT, fontWeight: 700 },
      });
    } catch (e) {
      console.error(TRAINING_LOG_PREFIX, 'Generate next plan failed', e);
      if (e?.response?.status === 400) {
        toast.error(e.response.data?.message || 'Cannot generate plan.');
      } else {
        toast.error('Failed to generate next plan. Try again.');
      }
    } finally {
      setGeneratingNextPlan(false);
    }
  };

  const handleSaveHealthTime = async () => {
    const val = parseInt(newHealthTime);
    if (!val || val < 1 || val > 300) {
      toast.error('Please enter a valid time between 1–300 minutes');
      return;
    }
    setSavingHealthTime(true);
    try {
      await API.patch('/auth/profile/', { health_time_minutes: val });
      await fetchProfile();
      setHealthTimeZero(false);
      setShowTimeEditor(false);
      toast.success('Updated! Now generate your training plan', {
        duration: 3500,
        style: { fontFamily: FONT, fontWeight: 700 },
      });
    } catch {
      toast.error('Failed to save. Please try again.');
    } finally {
      setSavingHealthTime(false);
    }
  };

  const handleExportPdf = async () => {
    setShowExportModal(false);
    await exportTrainingPdf({
      exportStartDate,
      exportEndDate,
      currentPlan: plan,
      setLoading: setExportPdfLoading,
    });
  };

  const shiftSelectedDate = (offset) => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    date.setDate(date.getDate() + offset);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const handlePrevDay = () => shiftSelectedDate(-1);

  const handleNextDay = () => shiftSelectedDate(1);

  const handleDateSelect = (d) => {
    setSelectedDate(d);
    setExpandedEx(null);
  };

  // ── Render: Loading ───────────────────────────────────────────
  if (loading && !plan) return <LoadingSkeleton />;

  // ── Render: Onboarding Blocker ────────────────────────────────
  if (showOnboardingBlocker) {
    return (
      <>
        <OnboardingBlocker onDismiss={() => setShowOnboardingBlocker(false)} />
        <GlobalStyles />
      </>
    );
  }

  // ── Render: No Plan ───────────────────────────────────────────
  if (!plan) return (
    <div style={S.page}>
      <div style={{ position: 'relative', zIndex: 2, padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Zero health-time banner / editor */}
        {healthTimeZero && (
          <HealthTimeEditor
            showEditor={showTimeEditor}
            onOpen={() => setShowTimeEditor(true)}
            onClose={() => setShowTimeEditor(false)}
            newHealthTime={newHealthTime}
            setNewHealthTime={setNewHealthTime}
            onSave={handleSaveHealthTime}
            saving={savingHealthTime}
            bannerSize="large"
          />
        )}

        {/* Normal no-plan card (only when health time is valid) */}
        {!healthTimeZero && (
          <GeneratePlanCard
            onGenerate={generatePlan}
            generating={generating}
            regenPulse={regenPulse}
          />
        )}

      </div>
      <GlobalStyles />
    </div>
  );

  // ── Render: Plan exists ───────────────────────────────────────
  return (
    <div style={S.page}>

      {/* Next Plan Generation Overlay */}
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
            This may take upto 1 minute, Please be patient while magic happens⚡
          </p>
        </div>
      )}

      {/* Content */}
      <div style={{ position: 'relative', zIndex: 2 }}>
        <div style={S.body}>

          {/* Week Date Strip */}
          <WeekStrip
            ref={weekStripRef}
            selectedDate={selectedDate}
            onSelect={handleDateSelect}
          />

          {/* Date Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 8px' }}>
            <button onClick={handlePrevDay} style={S.navBtn}>
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
            <button onClick={handleNextDay} style={S.navBtn}>
              <ChevronRight size={20} color="var(--color-text)" />
            </button>
          </div>

          {/* No plan for this specific date */}
          {!selectedDay && plan && (
            <div style={S.glassCard}>
              <span style={{ fontSize: '2.5rem' }}>📅</span>
              <p style={S.noPlanTitle}>No Plan for This Day</p>
              <p style={S.noPlanSub}>No training plan was generated for this date.</p>
            </div>
          )}

          {/* Day detail */}
          {selectedDay && (
            <DayDetail
              key={selectedDay.id}
              day={selectedDay}
              expandedEx={expandedEx}
              setExpandedEx={setExpandedEx}
            />
          )}

          <div style={{ height: '20px' }} />

          {/* Zero health-time banner / editor */}
          {healthTimeZero && (
            <HealthTimeEditor
              showEditor={showTimeEditor}
              onOpen={() => setShowTimeEditor(true)}
              onClose={() => setShowTimeEditor(false)}
              newHealthTime={newHealthTime}
              setNewHealthTime={setNewHealthTime}
              onSave={handleSaveHealthTime}
              saving={savingHealthTime}
              bannerSize="small"
            />
          )}

          {/* Generate Next 3 Days */}
          {!healthTimeZero && (
            <GenerateNextPlanCard
              nextPlanExists={nextPlanExists}
              latestPlanEndDate={latestPlanEndDate}
              generatingNextPlan={generatingNextPlan}
              onGenerate={handleGenerateNextPlan}
            />
          )}

          {/* Export PDF button */}
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
              : <ChevronRight size={20} color="var(--color-text-faint)" style={{ flexShrink: 0 }} />
            }
          </button>

          <div style={{ height: '16px' }} />
        </div>
      </div>

      {/* Export PDF Modal */}
      {showExportModal && (
        <ExportPdfModal
          exportStartDate={exportStartDate}
          exportEndDate={exportEndDate}
          onStartDateChange={setExportStartDate}
          onEndDateChange={setExportEndDate}
          onExport={handleExportPdf}
          onClose={() => setShowExportModal(false)}
        />
      )}

      <GlobalStyles />
    </div>
  );
}
