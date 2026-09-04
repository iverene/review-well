export const EXAM_LABELS = { prelim: 'Prelim', midterm: 'Midterm', final: 'Finals' }

// Strict naming convention: `[Exam Period] Course Description.pdf`
export const reviewerPdfFilename = (reviewer) => {
  const exam = EXAM_LABELS[reviewer?.examType] || reviewer?.examType || 'Reviewer'
  const desc = reviewer?.courseDescription || reviewer?.title || 'Untitled'
  return `${exam} ${desc}`.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 120) + '.pdf'
}

// Rasterize rendered sheet elements so the PDF preserves the exact on-screen
// colors, fonts, page dimensions, and layout. Tall sheets are sliced across
// multiple PDF pages at exact page size.
export const exportSheetsToPdf = async ({ rootId, pageSelector, filename, format = 'a4' }) => {
  const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
  const html2canvas = html2canvasModule.default || html2canvasModule
  const root = document.getElementById(rootId)
  const sheets = root ? Array.from(root.querySelectorAll(pageSelector)) : []
  if (sheets.length === 0) {
    throw new Error('Nothing to export yet.')
  }
  const doc = new jsPDF({ unit: 'pt', format: String(format).toLowerCase(), compress: true })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let first = true
  for (const sheet of sheets) {
    const canvas = await html2canvas(sheet, {
      scale: 2,
      backgroundColor: '#FFFFFF',
      useCORS: true,
      logging: false,
      ignoreElements: (el) => el.classList?.contains('no-print'),
    })
    const pxPerPt = canvas.width / pageWidth
    const slicePx = Math.max(1, Math.floor(pageHeight * pxPerPt))
    for (let y = 0; y < canvas.height; y += slicePx) {
      const h = Math.min(slicePx, canvas.height - y)
      const part = document.createElement('canvas')
      part.width = canvas.width
      part.height = h
      part.getContext('2d').drawImage(canvas, 0, y, canvas.width, h, 0, 0, canvas.width, h)
      if (!first) doc.addPage()
      first = false
      doc.addImage(part.toDataURL('image/png'), 'PNG', 0, 0, pageWidth, h / pxPerPt)
    }
  }
  doc.save(filename)
}
