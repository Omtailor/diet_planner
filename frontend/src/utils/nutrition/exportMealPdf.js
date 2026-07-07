import toast from 'react-hot-toast'

export async function exportMealPdf(exportStartDate, exportEndDate, mealService, setExportPdfLoading) {
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

    if (!window.jspdf) {
      toast.error('PDF library not loaded. Please refresh and try again.')
      setExportPdfLoading(false)
      return
    }
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
