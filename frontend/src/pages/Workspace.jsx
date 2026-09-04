import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import Toolbar from '../components/workspace/Toolbar'
import FormattingToolbar from '../components/workspace/FormattingToolbar'
import FloatingMiniToolbar from '../components/workspace/FloatingMiniToolbar'
import BlockRenderer from '../components/workspace/BlockRenderer'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import WorkspaceLoading from '../components/workspace/WorkspaceLoading'

const PALETTES = [
  { name: 'Cocoa Classic', primary: '#7C6B5D', secondary: '#F5EAD3', accent: '#FCF7EC' },
  { name: 'Berry Study', primary: '#C08A97', secondary: '#F7DCE2', accent: '#FCF2F5' },
  { name: 'Powder Calm', primary: '#6E9FC4', secondary: '#D6E9F4', accent: '#F1F7FB' },
  { name: 'Mint Fresh', primary: '#6FA287', secondary: '#D7EADC', accent: '#F1F7F2' },
]

const PAPER_SIZES = {
  Letter: { label: '8.5 × 11 in', width: 816, height: 1056 },
  A4: { label: '210 × 297 mm', width: 794, height: 1123 },
  Legal: { label: '8.5 × 14 in', width: 816, height: 1344 },
}

const EXAM_LABELS = { prelim: 'Prelim', midterm: 'Midterm', final: 'Finals' }

const localId = () => `local-${Date.now()}-${Math.floor(Math.random() * 1e6)}`

const blockToText = (block) => {
  const data = block.contentData || {}
  switch (block.blockType) {
    case 'lesson_banner':
      return [data.heading, data.subtitle].filter(Boolean).join(' ')
    case 'topic_banner':
    case 'sub_topic_banner':
    case 'main_title':
      return [data.heading, data.subtitle].filter(Boolean).join(' ')
    case 'content_block':
      return [data.heading, data.body].filter(Boolean).join(' ')
    case 'table': {
      const head = (data.headers || []).join(' | ')
      const rows = (data.rows || []).map((r) => r.join(' | '))
      return [head, ...rows].filter(Boolean).join(' ')
    }
    case 'terms_card':
      return [(data.title || ''), ...((data.terms || []).map((t) => `${t.term || ''}: ${t.definition || ''}`))].filter(Boolean).join(' ')
    case 'image':
      return data.caption || 'Image'
    case 'two_column':
      return [data.left, data.right].filter(Boolean).join(' ')
    default:
      return ''
  }
}

const estimateBlock = (block) => {
  const data = block.contentData || {}
  switch (block.blockType) {
    case 'lesson_banner':
      return 104
    case 'topic_banner':
      return 56
    case 'sub_topic_banner':
      return 52
    case 'divider':
      return 30
    case 'page_break':
      return 0
    case 'table':
      return 84 + (data.rows?.length || 1) * 34
    case 'image':
      return data.src ? 260 : 90
    case 'terms_card':
      return 92 + (data.terms?.length || 1) * 60
    case 'content_block':
      return 64 + Math.ceil(((data.body || '').length + (data.heading || '').length) / 110) * 20
    case 'main_title':
      return 100
    case 'two_column':
      return 150
    default:
      return 90
  }
}

// Split blocks into bounded, printable pages. `page_break` blocks force a new page.
const paginateBlocks = (blocks, paperKey) => {
  const paper = PAPER_SIZES[paperKey] || PAPER_SIZES.A4
  const budget = (pageIdx) => (pageIdx === 0 ? paper.height - 64 - 170 - 60 : paper.height - 64 - 60)
  const pages = [[]]
  const breakBefore = [false]
  let used = 0
  blocks.forEach((b) => {
    if (b.blockType === 'page_break') {
      pages.push([])
      breakBefore.push(true)
      used = 0
      return
    }
    const est = estimateBlock(b)
    const idx = pages.length - 1
    if (pages[idx].length > 0 && used + est > budget(idx)) {
      pages.push([b])
      breakBefore.push(false)
      used = est + 16
    } else {
      pages[idx].push(b)
      used += est + 16
    }
  })
  return { pages, breakBefore }
}

const Workspace = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [reviewer, setReviewer] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [extracting, setExtracting] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [error, setError] = useState(null)
  const [saveError, setSaveError] = useState(null)
  const [lastSavedAt, setLastSavedAt] = useState(null)
  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)
  const dragIdRef = useRef(null)

  // Ribbon / sheet state
  const [history, setHistory] = useState([])
  const [future, setFuture] = useState([])
  const [zoom, setZoom] = useState(100)
  const [textStyle, setTextStyle] = useState('lesson_banner')
  const [fontFamily, setFontFamily] = useState('Nunito')
  const [fontSize, setFontSize] = useState(11)
  const [textColor, setTextColor] = useState('#1f1b16')
  const [highlightColor, setHighlightColor] = useState('#FEF08A')
  const [align, setAlign] = useState('left')
  const [lineSpacing, setLineSpacing] = useState(1.5)
  const [headerEditing, setHeaderEditing] = useState(false)
  const [footerEditingPage, setFooterEditingPage] = useState(null)
  const [authorName, setAuthorName] = useState(() => localStorage.getItem('rw-author') || 'Iverene Grace Causapin')
  const [paletteName, setPaletteName] = useState('Cocoa Classic')
  const [paperSize, setPaperSize] = useState('A4')
  const [columns, setColumns] = useState('2')
  const [miniMenu, setMiniMenu] = useState(null)
  const [hasCopy, setHasCopy] = useState(false)
  const clipboardRef = useRef(null)

  const fetchReviewer = useCallback(async () => {
    try {
      const response = await axios.get(`/api/reviewers/${id}`, { withCredentials: true })
      const rev = response.data.reviewer
      setReviewer(rev)
      setBlocks(rev.blocks || [])
      if (rev?.colorPalette?.primary) {
        const match = PALETTES.find((p) => p.primary === rev.colorPalette.primary)
        if (match) setPaletteName(match.name)
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to load this reviewer.'))
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchReviewer()
  }, [fetchReviewer])

  useEffect(() => {
    localStorage.setItem('rw-author', authorName)
  }, [authorName])

  const pushHistory = (prev) => {
    setHistory((h) => [...h.slice(-49), prev])
    setFuture([])
  }

  const setBlocksTracked = (next) => {
    setBlocks((prev) => {
      pushHistory(prev)
      return typeof next === 'function' ? next(prev) : next
    })
  }

  const handleUndo = () => {
    setHistory((h) => {
      if (h.length === 0) return h
      const prev = h[h.length - 1]
      setBlocks((cur) => {
        setFuture((f) => [cur, ...f].slice(0, 50))
        return prev
      })
      return h.slice(0, -1)
    })
  }

  const handleRedo = () => {
    setFuture((f) => {
      if (f.length === 0) return f
      const [next, ...rest] = f
      setBlocks((cur) => {
        setHistory((h) => [...h.slice(-49), cur])
        return next
      })
      return rest
    })
  }

  const handleSave = async () => {
    if (!reviewer) return
    setSaving(true)
    setError(null)
    setSaveError(null)
    try {
      await axios.put(
        `/api/reviewers/${id}`,
        {
          title: reviewer.title,
          courseCode: reviewer.courseCode,
          courseDescription: reviewer.courseDescription,
          semester: reviewer.semester,
          examType: reviewer.examType,
          visibility: reviewer.visibility,
          colorPalette: reviewer.colorPalette,
        },
        { withCredentials: true }
      )
      for (const block of blocks) {
        if (String(block.id).startsWith('local-')) continue
        if (block.id) {
          await axios.put(`/api/reviewers/blocks/${block.id}`, block, { withCredentials: true })
        }
      }
      setLastSavedAt(new Date().toISOString())
    } catch (err) {
      const msg = getApiErrorMessage(err, 'Unable to save your changes.')
      setError(msg)
      setSaveError(msg)
    } finally {
      setSaving(false)
    }
  }

  // Clear selection indicators the moment anything outside a block is pressed
  useEffect(() => {
    const onPointerDown = (e) => {
      if (e.target.closest?.('[data-block-id], .no-print')) return
      setSelectedBlock(null)
      setMiniMenu(null)
    }
    window.addEventListener('pointerdown', onPointerDown)
    return () => window.removeEventListener('pointerdown', onPointerDown)
  }, [])

  // Keyboard: save + insert shortcuts + sheet-scoped select-all (no platform-specific key names in UI)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMiniMenu(null)
        return
      }
      const mod = e.ctrlKey || e.metaKey
      if (mod && !e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleSave()
      } else if (mod && !e.altKey && e.key.toLowerCase() === 'a') {
        const t = e.target
        if (t instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
        const root = document.getElementById('sheet-export-root')
        if (root && (root.contains(t) || t === document.body)) {
          e.preventDefault()
          const sel = window.getSelection()
          sel?.removeAllRanges()
          const range = document.createRange()
          range.selectNodeContents(root)
          sel?.addRange(range)
        }
      } else if (mod && e.altKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        handleAddBlock('lesson_banner')
      } else if (mod && e.altKey && e.key.toLowerCase() === 'm') {
        e.preventDefault()
        handleAddBlock('topic_banner')
      } else if (mod && e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault()
        handleAddBlock('sub_topic_banner')
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blocks, reviewer])

  const handleAiExtract = () => fileInputRef.current?.click()

  const mapAiBlock = (b, index) => {
    // Backend returns { block_type, content_data } — normalize to frontend shape
    const type = b.block_type || b.blockType || 'topic_banner'
    const data = b.content_data || b.contentData || {}
    const allowed = ['lesson_banner', 'topic_banner', 'sub_topic_banner', 'table', 'image', 'divider', 'terms_card', 'page_break', 'content_block']
    return {
      id: localId(),
      blockType: allowed.includes(type) ? type : 'topic_banner',
      columnIndex: 1,
      sortOrder: blocks.length + index,
      contentData: data,
      _local: true,
    }
  }

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    setSaveError(null)
    setExtracting(true)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('reviewerId', id)
      if (reviewer?.courseCode) form.append('courseCode', reviewer.courseCode)
      if (reviewer?.courseDescription) form.append('courseDescription', reviewer.courseDescription)
      const res = await axios.post('/api/ai/extract', form, { withCredentials: true })
      const returned = res.data?.blocks || []
      if (res.data?.saved) {
        await fetchReviewer()
      } else if (returned.length > 0) {
        setBlocksTracked((prev) => [...prev, ...returned.map((b, i) => mapAiBlock(b, i))])
      } else {
        await fetchReviewer()
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to extract study blocks.'))
    } finally {
      setExtracting(false)
    }
  }

  const getDefaultContent = (blockType) => {
    switch (blockType) {
      case 'lesson_banner':
        return { heading: 'LESSON — New Lesson', subtitle: 'Lesson overview…' }
      case 'topic_banner':
        return { heading: 'New Main Topic' }
      case 'sub_topic_banner':
        return { heading: 'New Sub-Topic' }
      case 'table':
        return { headers: ['Column 1', 'Column 2'], rows: [['', '']] }
      case 'image':
        return { src: '', caption: 'Add a caption…' }
      case 'divider':
        return {}
      case 'terms_card':
        return { title: 'Key Terms', terms: [{ term: 'Term 1', definition: 'Definition — click to edit.' }] }
      case 'page_break':
        return {}
      case 'content_block':
        return { heading: '', body: 'Paragraph — click to edit.' }
      case 'two_column':
        return { left: 'Left column — click to edit.', right: 'Right column — click to edit.' }
      default:
        return {}
    }
  }

  const handleAddBlock = async (blockType) => {
    setError(null)
    const payload = {
      blockType,
      columnIndex: 1,
      sortOrder: blocks.length,
      contentData: getDefaultContent(blockType),
    }
    // New elements always append directly below the previous element
    const temp = { ...payload, id: localId(), _local: true }
    setBlocksTracked((prev) => [...prev, temp])
    setSelectedBlock(temp.id)
    try {
      const response = await axios.post(`/api/reviewers/${id}/blocks`, payload, { withCredentials: true })
      const saved = response.data.block
      setBlocks((prev) => prev.map((b) => (b.id === temp.id ? saved : b)))
      setSelectedBlock(saved.id)
    } catch (err) {
      if (err?.response?.status === 400) {
        setError(getApiErrorMessage(err, 'Unable to add this block.'))
      }
    }
  }

  const handleUpdateBlock = (blockId, updates) => {
    setBlocks((prev) => prev.map((b) => (b.id === blockId ? { ...b, ...updates } : b)))
  }

  const handleSelectBlock = (blockId, e) => {
    setSelectedBlock(blockId)
    if (e && typeof e.clientX === 'number') {
      setMiniMenu({ blockId, x: e.clientX, y: e.clientY })
    }
  }

  // Alignment applies exclusively to the selected element; the sheet default
  // only changes when nothing is selected
  const handleAlignChange = (next) => {
    if (selectedBlock) {
      setBlocks((prev) => prev.map((b) => (
        b.id === selectedBlock
          ? { ...b, contentData: { ...(b.contentData || {}), align: next } }
          : b
      )))
    } else {
      setAlign(next)
    }
  }

  const insertBlockAt = async (blockType, contentData, index) => {
    const payload = { blockType, columnIndex: 1, sortOrder: index, contentData }
    const temp = { ...payload, id: localId(), _local: true }
    setBlocksTracked((prev) => {
      const next = [...prev]
      next.splice(Math.min(index, next.length), 0, temp)
      return next.map((b, i) => ({ ...b, sortOrder: i }))
    })
    setSelectedBlock(temp.id)
    try {
      const response = await axios.post(`/api/reviewers/${id}/blocks`, payload, { withCredentials: true })
      const saved = response.data.block
      setBlocks((prev) => prev.map((b) => (b.id === temp.id ? saved : b)))
      setSelectedBlock(saved.id)
    } catch {
      // local block persists
    }
  }

  const handleCopyBlock = async (blockId) => {
    const target = blocks.find((b) => b.id === (blockId || selectedBlock))
    if (!target) return
    clipboardRef.current = JSON.parse(JSON.stringify(target.contentData || {}))
    clipboardRef.current._blockType = target.blockType
    setHasCopy(true)
    try {
      await navigator.clipboard.writeText(blockToText(target))
    } catch {
      // clipboard API unavailable — internal clipboard still holds the copy
    }
  }

  const handlePasteBelow = async (blockId) => {
    const targetId = blockId || selectedBlock
    const targetIdx = blocks.findIndex((b) => b.id === targetId)
    const at = targetIdx >= 0 ? targetIdx + 1 : blocks.length
    const stored = clipboardRef.current
    if (stored) {
      const { _blockType, ...contentData } = stored
      await insertBlockAt(_blockType || 'topic_banner', contentData, at)
      return
    }
    try {
      const text = await navigator.clipboard.readText()
      if (text) await insertBlockAt('content_block', { heading: '', body: text }, at)
    } catch {
      setError('Copy something first, then paste it below the selected element.')
    }
  }

  const handleDuplicateBlock = async (blockId) => {
    const targetId = blockId || selectedBlock
    const idx = blocks.findIndex((b) => b.id === targetId)
    if (idx < 0) return
    const source = blocks[idx]
    await insertBlockAt(source.blockType, JSON.parse(JSON.stringify(source.contentData || {})), idx + 1)
  }

  const pdfFilename = () => {
    const exam = EXAM_LABELS[reviewer?.examType] || reviewer?.examType || 'Reviewer'
    const desc = reviewer?.courseDescription || reviewer?.title || 'Untitled'
    return `${exam} ${desc}`.replace(/[\\/:*?"<>|]/g, '').trim().slice(0, 120) + '.pdf'
  }

  const handleSaveAsPdf = async () => {
    if (!reviewer) return
    setError(null)
    try {
      const [{ jsPDF }, html2canvasModule] = await Promise.all([import('jspdf'), import('html2canvas')])
      const html2canvas = html2canvasModule.default || html2canvasModule
      const root = document.getElementById('sheet-export-root')
      const sheets = root ? Array.from(root.querySelectorAll('.sheet-page')) : []
      if (sheets.length === 0) {
        setError('Nothing to export yet. Add some blocks first.')
        return
      }
      const doc = new jsPDF({ unit: 'pt', format: paperSize.toLowerCase(), compress: true })
      for (let i = 0; i < sheets.length; i += 1) {
        const canvas = await html2canvas(sheets[i], {
          scale: 2,
          backgroundColor: '#FFFFFF',
          useCORS: true,
          logging: false,
          ignoreElements: (el) => el.classList?.contains('no-print'),
        })
        const imgData = canvas.toDataURL('image/png')
        const pageWidth = doc.internal.pageSize.getWidth()
        const pageHeight = doc.internal.pageSize.getHeight()
        if (i > 0) doc.addPage()
        // Exact page dimensions preserve the sheet's size, colors, fonts, and layout
        doc.addImage(imgData, 'PNG', 0, 0, pageWidth, pageHeight)
      }
      doc.save(pdfFilename())
    } catch (err) {
      console.error('Failed to compile PDF:', err)
      setError(getApiErrorMessage(err, 'Unable to compile the PDF.'))
    }
  }

  const handleDeleteBlock = async (blockId) => {
    setError(null)
    const target = blocks.find((b) => b.id === blockId)
    setBlocksTracked((prev) => prev.filter((b) => b.id !== blockId))
    if (selectedBlock === blockId) setSelectedBlock(null)
    if (!target || String(target.id).startsWith('local-') || target._local) return
    try {
      await axios.delete(`/api/reviewers/blocks/${blockId}`, { withCredentials: true })
    } catch (err) {
      setError(getApiErrorMessage(err, 'Unable to delete this block.'))
    }
  }

  // Image drag-and-drop reordering across the vertical flow
  const handleImageDragStart = (blockId) => (e) => {
    dragIdRef.current = blockId
    e.dataTransfer.effectAllowed = 'move'
    try {
      e.dataTransfer.setData('text/plain', blockId)
    } catch {
      // clipboard formats unsupported — ref fallback still applies
    }
  }

  const handleBlockDragOver = (e) => {
    if (!dragIdRef.current) return
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleBlockDrop = (targetId) => (e) => {
    const draggedId = dragIdRef.current
    if (!draggedId || draggedId === targetId) return
    e.preventDefault()
    e.stopPropagation()
    setBlocks((prev) => {
      const from = prev.findIndex((b) => b.id === draggedId)
      const to = prev.findIndex((b) => b.id === targetId)
      if (from < 0 || to < 0) return prev
      pushHistory(prev)
      const next = [...prev]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((b, i) => ({ ...b, sortOrder: i }))
    })
    dragIdRef.current = null
  }

  const handleFieldChange = (field, value) => {
    setReviewer((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  const handleDocTitleChange = (value) => {
    setReviewer((prev) => (prev ? { ...prev, courseDescription: value, title: value } : prev))
  }

  const handleNew = () => {
    pushHistory(blocks)
    setBlocks([])
    setSelectedBlock(null)
    setMiniMenu(null)
    navigate('/create')
  }

  const handleOpenReviewer = (reviewerId) => {
    navigate(`/workspace/${reviewerId}`)
  }

  const handleDownloadPdf = () => window.print()

  const handleInsertImage = () => imageInputRef.current?.click()

  const handleImagePicked = (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      handleAddBlockWithContent('image', { src: reader.result, caption: file.name })
    }
    reader.readAsDataURL(file)
  }

  const handleAddBlockWithContent = async (blockType, contentData) => {
    const payload = { blockType, columnIndex: 1, sortOrder: blocks.length, contentData }
    const temp = { ...payload, id: localId(), _local: true }
    setBlocksTracked((prev) => [...prev, temp])
    try {
      const response = await axios.post(`/api/reviewers/${id}/blocks`, payload, { withCredentials: true })
      const saved = response.data.block
      setBlocks((prev) => prev.map((b) => (b.id === temp.id ? saved : b)))
    } catch {
      // local block persists
    }
  }

  const handleTextStyleChange = (style) => {
    setTextStyle(style)
    handleAddBlock(style)
  }

  const handleFormatCommand = (cmd) => {
    if (cmd === 'justifyLeft') setAlign('left')
    else if (cmd === 'justifyCenter') setAlign('center')
    else if (cmd === 'justifyRight') setAlign('right')
    else if (cmd === 'justifyFull') setAlign('justify')
  }

  const handlePalettePick = (name) => {
    const pal = PALETTES.find((p) => p.name === name)
    if (!pal) return
    setPaletteName(name)
    setReviewer((prev) => (prev ? { ...prev, colorPalette: { primary: pal.primary, secondary: pal.secondary, accent: pal.accent } } : prev))
  }

  if (loading) {
    return <WorkspaceLoading />
  }

  if (!reviewer) {
    return (
      <div className="flex h-full items-center justify-center" style={{ width: '100vw', height: '100vh', background: '#F8F9FA' }}>
        <ErrorAlert>{error || 'Reviewer not found'}</ErrorAlert>
      </div>
    )
  }

  const activePalette = PALETTES.find((p) => p.name === paletteName) || PALETTES[0]
  const sheetPrimary = reviewer?.colorPalette?.primary || activePalette.primary
  const sheetSecondary = reviewer?.colorPalette?.secondary || activePalette.secondary
  const sheetTint = reviewer?.colorPalette?.accent || activePalette.accent
  const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4
  const examLabel = EXAM_LABELS[reviewer?.examType] || reviewer?.examType || ''
  const { pages, breakBefore } = paginateBlocks(blocks, paperSize)
  const styleProps = { fontFamily, fontSize, align, lineHeight: lineSpacing, textColor }
  const selectedEntry = blocks.find((b) => b.id === selectedBlock)
  const effectiveAlign = selectedEntry?.contentData?.align || align

  const renderHeader = () => (
    <div
      onDoubleClick={() => setHeaderEditing(true)}
      title={headerEditing ? 'Editing header' : undefined}
      className={`shrink-0 rounded-md ${headerEditing ? 'outline outline-2 outline-blue-300' : ''}`}
    >
      {headerEditing ? (
        <div className="space-y-2 rounded-lg p-3 text-white" style={{ background: 'var(--sheet-primary)' }}>
          <label className="block text-[11px] font-bold uppercase opacity-80">Course description
            <input value={reviewer.courseDescription || ''} onChange={(e) => handleFieldChange('courseDescription', e.target.value)} className="mt-1 w-full rounded border border-white/40 bg-white/10 px-2 py-1 text-sm font-normal normal-case text-white placeholder:text-white/60" placeholder="Course description" />
          </label>
          <div className="grid grid-cols-3 gap-2">
            <label className="block text-[11px] font-bold uppercase opacity-80">Code
              <input value={reviewer.courseCode || ''} onChange={(e) => handleFieldChange('courseCode', e.target.value)} className="mt-1 w-full rounded border border-white/40 bg-white/10 px-2 py-1 text-sm font-normal normal-case text-white" />
            </label>
            <label className="block text-[11px] font-bold uppercase opacity-80">Exam
              <select value={reviewer.examType || 'midterm'} onChange={(e) => handleFieldChange('examType', e.target.value)} className="mt-1 w-full rounded border border-white/40 bg-white/10 px-2 py-1 text-sm font-normal normal-case text-white">
                <option value="prelim">Prelim</option>
                <option value="midterm">Midterm</option>
                <option value="final">Finals</option>
              </select>
            </label>
            <label className="block text-[11px] font-bold uppercase opacity-80">Semester
              <input value={reviewer.semester || ''} onChange={(e) => handleFieldChange('semester', e.target.value)} className="mt-1 w-full rounded border border-white/40 bg-white/10 px-2 py-1 text-sm font-normal normal-case text-white" />
            </label>
          </div>
          <button type="button" onClick={() => setHeaderEditing(false)} className="no-print rounded bg-white px-3 py-1 text-xs font-bold" style={{ color: 'var(--sheet-primary)' }}>Done</button>
        </div>
      ) : (
        <div className="rounded-lg p-4 text-white" style={{ background: 'var(--sheet-primary)' }}>
          <div className="text-xl font-extrabold leading-tight">
            {reviewer.courseDescription || reviewer.title || 'Untitled reviewer'}
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {reviewer.courseCode && (
              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ background: 'var(--sheet-secondary)', color: '#1f1b16' }}>
                {reviewer.courseCode}
              </span>
            )}
            {examLabel && (
              <span className="rounded-full border border-white/50 px-2.5 py-0.5 text-[11px] font-extrabold">
                {examLabel}
              </span>
            )}
            {reviewer.semester && (
              <span className="rounded-full border border-white/50 px-2.5 py-0.5 text-[11px] font-extrabold">
                {reviewer.semester}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  )

  const renderFooter = (pageIndex) => {
    const editing = footerEditingPage === pageIndex
    return (
      <div
        onDoubleClick={() => setFooterEditingPage(pageIndex)}
        className={`relative mt-auto shrink-0 overflow-hidden rounded-md ${editing ? 'outline outline-2 outline-blue-300' : ''}`}
        style={{ background: 'var(--sheet-secondary)' }}
      >
        <img
          src="/word-logo.png"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-7 -translate-x-1/2 -translate-y-1/2 object-contain"
        />
        {editing ? (
          <div className="relative flex items-center gap-2 p-2">
            <span className="pl-1 text-xs font-bold text-gray-700">Page {pageIndex + 1}</span>
            <input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
              className="min-w-0 flex-1 rounded border border-gray-300 bg-white px-2 py-1 text-sm"
              aria-label="Author name"
            />
            <button type="button" onClick={() => setFooterEditingPage(null)} className="no-print shrink-0 rounded bg-gray-900 px-3 py-1 text-xs font-bold text-white">Done</button>
          </div>
        ) : (
          <div className="relative flex items-center justify-between text-sm font-bold">
            <span className="px-3 py-2 text-white" style={{ background: 'var(--sheet-primary)' }}>Page {pageIndex + 1}</span>
            <span className="truncate px-3 py-2" style={{ color: '#1f1b16' }}>{authorName}</span>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex h-full w-full flex-col" style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#F8F9FA', fontFamily: "'Nunito', sans-serif" }}>
      <Toolbar
        reviewer={reviewer}
        saving={saving}
        extracting={extracting}
        lastSavedAt={lastSavedAt}
        saveError={saveError}
        onSave={handleSave}
        onAddBlock={handleAddBlock}
        onDocTitleChange={handleDocTitleChange}
        onAiExtract={handleAiExtract}
        onNew={handleNew}
        onOpenReviewer={handleOpenReviewer}
        onDownloadPdf={handleDownloadPdf}
        onSaveAsPdf={handleSaveAsPdf}
        onInsertImage={handleInsertImage}
        palettes={PALETTES}
        paletteName={paletteName}
        onPalettePick={handlePalettePick}
        paperSize={paperSize}
        paperSizes={PAPER_SIZES}
        onPaperSizeChange={setPaperSize}
        columns={columns}
        onColumnsChange={setColumns}
      />

      <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt,.txt" onChange={handleFileSelected} className="hidden" aria-hidden="true" tabIndex={-1} />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImagePicked} className="hidden" aria-hidden="true" tabIndex={-1} />

      <FormattingToolbar
        canUndo={history.length > 0}
        canRedo={future.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        zoom={zoom}
        onZoomChange={setZoom}
        textStyle={textStyle}
        onTextStyleChange={handleTextStyleChange}
        fontFamily={fontFamily}
        onFontChange={setFontFamily}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        onFormatCommand={handleFormatCommand}
        textColor={textColor}
        highlightColor={highlightColor}
        onTextColorChange={setTextColor}
        onHighlightColorChange={setHighlightColor}
        align={effectiveAlign}
        onAlignChange={handleAlignChange}
        lineSpacing={lineSpacing}
        onLineSpacingChange={setLineSpacing}
      />

      {error && (
        <div className="no-print shrink-0 px-4 pt-2"><ErrorAlert>{error}</ErrorAlert></div>
      )}

      {/* Canvas scroll area — bounded, printable pages in vertical flow */}
      <style>{`@page { size: ${paperSize}; margin: 0; }`}</style>
      <div className="workspace-canvas-scroll" onClick={() => setSelectedBlock(null)}>
        <div className="px-4 pb-16 pt-4 md:px-8" onClick={(e) => e.stopPropagation()}>
          <div style={{ zoom: zoom / 100 }}>
            <div id="sheet-export-root" className="mx-auto flex w-fit flex-col items-center gap-6">
              {pages.map((pageBlocks, pageIndex) => (
                <div key={pageIndex}>
                  {breakBefore[pageIndex] && pageIndex > 0 && (
                    <div className="no-print mx-auto mb-2 text-center text-[11px] font-bold uppercase tracking-widest text-gray-400">
                      — Page break —
                    </div>
                  )}
                  <div
                    className="sheet-theme sheet-page flex flex-col p-8"
                    style={{
                      '--sheet-primary': sheetPrimary,
                      '--sheet-secondary': sheetSecondary,
                      '--sheet-tint': sheetTint,
                      width: paper.width,
                      maxWidth: 'calc(100vw - 32px)',
                      height: paper.height,
                      overflow: 'hidden',
                      fontFamily: `${fontFamily}, 'Nunito', sans-serif`,
                    }}
                  >
                    {pageIndex === 0 && renderHeader()}
                    <div className={`flex min-h-0 flex-1 flex-col ${pageIndex === 0 ? 'pt-4' : ''}`} style={{ overflow: 'hidden' }}>
                      {pageBlocks.length === 0 ? (
                        pageIndex === 0 && blocks.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-sm text-gray-500">
                            <p className="font-bold text-gray-700">Empty sheet</p>
                            <p className="mt-1">Use Insert to add Lesson banners, Main Topics, Sub-Topics, Terms cards, tables, or images.</p>
                            <p className="mt-1">Or press AI Extract to upload lecture slides.</p>
                          </div>
                        ) : null
                      ) : columns === '2' ? (
                        <div
                          className="w-full min-w-0"
                          style={{ columnCount: 2, columnGap: '1.5rem', columnRule: '1px solid #E5E7EB' }}
                        >
                          {pageBlocks.map((block) => (
                            <div key={block.id} style={{ breakInside: 'avoid', marginBottom: '1rem' }}>
                              <BlockRenderer
                                block={block}
                                selected={selectedBlock === block.id}
                                onSelect={(e) => handleSelectBlock(block.id, e)}
                                onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                                onDelete={() => handleDeleteBlock(block.id)}
                                styleProps={styleProps}
                                draggable={block.blockType === 'image'}
                                onDragStart={block.blockType === 'image' ? handleImageDragStart(block.id) : undefined}
                                onDragOver={handleBlockDragOver}
                                onDrop={handleBlockDrop(block.id)}
                              />
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex w-full min-w-0 flex-col gap-4">
                          {pageBlocks.map((block) => (
                            <BlockRenderer
                              key={block.id}
                              block={block}
                              selected={selectedBlock === block.id}
                              onSelect={(e) => handleSelectBlock(block.id, e)}
                              onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                              onDelete={() => handleDeleteBlock(block.id)}
                              styleProps={styleProps}
                              draggable={block.blockType === 'image'}
                              onDragStart={block.blockType === 'image' ? handleImageDragStart(block.id) : undefined}
                              onDragOver={handleBlockDragOver}
                              onDrop={handleBlockDrop(block.id)}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                    {renderFooter(pageIndex)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <FloatingMiniToolbar
        position={miniMenu}
        canPaste={hasCopy}
        onCopy={() => handleCopyBlock(miniMenu?.blockId)}
        onPaste={() => handlePasteBelow(miniMenu?.blockId)}
        onDuplicate={() => handleDuplicateBlock(miniMenu?.blockId)}
        onDelete={() => { handleDeleteBlock(miniMenu?.blockId); setMiniMenu(null) }}
        onClose={() => setMiniMenu(null)}
      />
    </div>
  )
}

export default Workspace
