import toast from 'react-hot-toast';
import API from '../../services/api';

/**
 * Exports the training plan as a PDF for the given date range.
 * Uses jsPDF loaded via CDN (window.jspdf).
 *
 * @param {object} opts
 * @param {string}  opts.exportStartDate  - ISO date string "YYYY-MM-DD"
 * @param {string}  opts.exportEndDate    - ISO date string "YYYY-MM-DD"
 * @param {object|null} opts.currentPlan  - current plan object (fallback if API unavailable)
 * @param {Function} opts.setLoading      - setter to show/hide loading state
 */
export async function exportTrainingPdf({ exportStartDate, exportEndDate, currentPlan, setLoading }) {
  setLoading(true);
  try {
    // ── Fetch ALL day trainings across ALL plans in the date range ──
    let allDays = [];
    try {
      const res = await API.get(
        `/training/days-range/?start=${exportStartDate}&end=${exportEndDate}`
      );
      allDays = res.data;
    } catch {
      // Fallback: use current plan's days filtered by date
      const parseLocal = (s) => {
        const [yr, mo, dy] = s.split('-').map(Number);
        return new Date(yr, mo - 1, dy);
      };
      allDays = (currentPlan?.day_trainings || []).filter(d => {
        if (!d.date) return true;
        const dt = parseLocal(d.date);
        return dt >= parseLocal(exportStartDate) && dt <= parseLocal(exportEndDate);
      });
    }

    if (!allDays.length) {
      toast.error('No training data found for selected dates');
      setLoading(false);
      return;
    }

    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
      toast.error('PDF library not loaded. Please refresh and try again.');
      setLoading(false);
      return;
    }

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    const pageW = 210, pageH = 297, M = 14, CW = pageW - M * 2;

    const GREEN  = [34, 197, 94];
    const DARK   = [17, 24, 39];
    const MUTED  = [107, 114, 128];
    const FAINT  = [209, 213, 219];
    const BG     = [248, 250, 252];
    const WHITE  = [255, 255, 255];
    const ORANGE = [234, 88, 12];
    const BLUE   = [37, 99, 235];
    const PURPLE = [124, 58, 237];
    const RED    = [220, 38, 38];

    const catColor = {
      strength:    GREEN,
      cardio:      ORANGE,
      flexibility: PURPLE,
      bodyweight:  BLUE,
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

    const totalWorkoutDays = allDays.filter(d => !d.is_rest_day).length;
    const totalCals  = allDays.reduce((s, d) => s + (d.total_calories_burned || 0), 0);
    const totalMins  = allDays.reduce((s, d) => s + (d.total_duration || 0), 0);

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
    const d0 = allDays[0]?.date, dN = allDays[allDays.length - 1]?.date;
    const fmt = (s) => new Date(s).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    if (d0 && dN) doc.text(`${fmt(d0)}  -  ${fmt(dN)}`, M + 6, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GREEN);
    doc.text(
      `${totalWorkoutDays} workout days   ${totalMins} mins total   ${totalCals} kcal burned`,
      M + 6, y + 28
    );
    y += 42;

    // ── Green divider ──
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.6);
    doc.line(M, y, pageW - M, y);
    y += 10;

    // ── Days loop ──
    for (const day of allDays) {
      const dateLabel = new Date(day.date).toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long',
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
      doc.text(
        `${day.total_duration}min  ${day.total_calories_burned}kcal`,
        pageW - M - 4, y + 7.5, { align: 'right' }
      );
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

        // Meta: duration — bottom left
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...MUTED);
        doc.text(`${ex.duration_minutes} min`, M + 7, y + cardH - 4);

        // Macro pills — right side
        const pills = [
          { label: 'min',  value: String(ex.duration_minutes || 0), c: BLUE },
          { label: 'kcal', value: String(calsBurned),                c: RED  },
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
    setLoading(false);
  }
}
