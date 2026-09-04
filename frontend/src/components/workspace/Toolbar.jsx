import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import {
  AlertTriangle,
  BookOpen,
  BookOpenCheck,
  Check,
  CheckCheck,
  Columns2,
  Download,
  FilePlus,
  FilePlus2,
  FolderOpen,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Info,
  Keyboard,
  Loader2,
  Minus,
  Printer,
  Rows2,
  Sparkles,
  Table as TableIcon,
} from 'lucide-react'

const EXAM_LABELS = { prelim: 'Prelim', midterm: 'Midterm', final: 'Finals' }

const Toolbar = ({
  reviewer,
  saving,
  extracting,
  lastSavedAt,
  saveError,
  onSave,
  onAddBlock,
  onDocTitleChange,
  onAiExtract,
  onNew,
  onOpenReviewer,
  onDownloadPdf,
  onInsertImage,
  palettes = [],
  paletteName,
  onPalettePick,
  paperSize,
  paperSizes = {},
  onPaperSizeChange,
  columns,
  onColumnsChange,
  onSaveAsPdf,
}) => {
  const navigate = useNavigate()
  const [fileOpen, setFileOpen] = useState(false)
  const [insertOpen, setInsertOpen] = useState(false)
  const [formatOpen, setFormatOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [helpModal, setHelpModal] = useState(null)
  const [newModalOpen, setNewModalOpen] = useState(false)
  const [openModalOpen, setOpenModalOpen] = useState(false)
  const [library, setLibrary] = useState([])
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryError, setLibraryError] = useState(null)

  const closeAllMenus = () => {
    setFileOpen(false)
    setInsertOpen(false)
    setFormatOpen(false)
    setHelpOpen(false)
  }

  const docTitle = reviewer?.courseDescription || reviewer?.title || ''
  const examLabel = EXAM_LABELS[reviewer?.examType] || reviewer?.examType || '—'
  const semesterLabel = reviewer?.semester || '—'

  useEffect(() => {
    if (!openModalOpen) return
    let cancelled = false
    setLibraryLoading(true)
    setLibraryError(null)
    axios
      .get('/api/reviewers/my', { withCredentials: true })
      .then((res) => {
        if (!cancelled) setLibrary(res.data?.reviewers || [])
      })
      .catch(() => {
        if (!cancelled) setLibraryError('Could not load your reviewers.')
      })
      .finally(() => {
        if (!cancelled) setLibraryLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [openModalOpen])

  const handleOpenReviewer = (id) => {
    setOpenModalOpen(false)
    if (onOpenReviewer) {
      onOpenReviewer(id)
    } else {
      navigate(`/workspace/${id}`)
    }
  }

  const savedTime = lastSavedAt
    ? new Date(lastSavedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null

  const menuBtn = 'rounded px-2 py-1 text-sm text-gray-700 hover:bg-gray-100'
  const dropItem =
    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-800 hover:bg-gray-100'

  return (
    <div className="no-print shrink-0 border-b border-gray-200 bg-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Row 1: Document bar */}
      <div className="flex items-center gap-3 px-3 pt-2 md:px-4">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <Link to="/" aria-label="Back to Review Well" className="flex shrink-0 items-center">
            <img src="/logo.png" alt="Review Well" className="h-9 w-9 rounded-md object-contain" />
          </Link>
          <div className="min-w-0 flex-1">
            <input
              value={docTitle}
              onChange={(e) => onDocTitleChange?.(e.target.value)}
              aria-label="Document title"
              placeholder="Fundamentals of Enterprise Data Management"
              className="w-full truncate bg-transparent text-base font-bold text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-300 md:text-lg"
            />
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span aria-live="polite" className="inline-flex items-center">
                {saving ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-bold text-amber-800">
                    <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" /> Saving…
                  </span>
                ) : saveError ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 font-bold text-red-800">
                    <AlertTriangle className="h-3 w-3" aria-hidden="true" /> Needs attention
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-bold text-emerald-800">
                    <CheckCheck className="h-3 w-3" aria-hidden="true" /> Saved{savedTime ? ` · ${savedTime}` : ''}
                  </span>
                )}
              </span>
              <span className="hidden truncate sm:inline">
                {examLabel} · {semesterLabel}
              </span>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {extracting && (
            <span className="hidden items-center gap-2 text-xs font-semibold text-amber-700 sm:flex" role="status">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              AI working…
            </span>
          )}
          <button
            type="button"
            onClick={onAiExtract}
            disabled={!!extracting}
            title="Upload lecture slides (.pdf, .pptx) to auto-structure notes"
            className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-extrabold text-gray-900 shadow-sm transition-colors hover:brightness-95 disabled:opacity-60"
            style={{ backgroundColor: '#FDE68A', borderColor: '#F59E0B' }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" /> AI Extract
          </button>
        </div>
      </div>

      {/* Row 2: Menu bar */}
      <div className="relative flex items-center gap-1 px-3 pb-1 md:px-4">
        <div className="relative">
          <button type="button" className={menuBtn} onClick={() => { closeAllMenus(); setFileOpen((v) => !v) }} aria-haspopup="menu" aria-expanded={fileOpen}>
            File
          </button>
          {fileOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFileOpen(false)} />
              <div className="absolute left-0 z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu">
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setFileOpen(false); setNewModalOpen(true) }}>
                  <FilePlus className="h-4 w-4 text-gray-500" aria-hidden="true" /> New
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setFileOpen(false); setOpenModalOpen(true) }}>
                  <FolderOpen className="h-4 w-4 text-gray-500" aria-hidden="true" /> Open…
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setFileOpen(false); onSave?.() }}>
                  <CheckCheck className="h-4 w-4 text-gray-500" aria-hidden="true" /> Save
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setFileOpen(false); onSaveAsPdf?.() }}>
                  <Download className="h-4 w-4 text-gray-500" aria-hidden="true" /> Save as PDF
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setFileOpen(false); onDownloadPdf?.() }}>
                  <Printer className="h-4 w-4 text-gray-500" aria-hidden="true" /> Print
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button type="button" className={menuBtn} onClick={() => { closeAllMenus(); setInsertOpen((v) => !v) }} aria-haspopup="menu" aria-expanded={insertOpen}>
            Insert
          </button>
          {insertOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setInsertOpen(false)} />
              <div className="absolute left-0 z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu">
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('page_break') }}>
                  <FilePlus2 className="h-4 w-4 text-gray-500" aria-hidden="true" /> Blank Page
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onInsertImage?.() }}>
                  <ImageIcon className="h-4 w-4 text-gray-500" aria-hidden="true" /> Image…
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('table') }}>
                  <TableIcon className="h-4 w-4 text-gray-500" aria-hidden="true" /> Table
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('divider') }}>
                  <Minus className="h-4 w-4 text-gray-500" aria-hidden="true" /> Horizontal line
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('lesson_banner') }}>
                  <BookOpen className="h-4 w-4 text-gray-500" aria-hidden="true" /> Lesson banner
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('topic_banner') }}>
                  <Heading1 className="h-4 w-4 text-gray-500" aria-hidden="true" /> Main Topic
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('sub_topic_banner') }}>
                  <Heading2 className="h-4 w-4 text-gray-500" aria-hidden="true" /> Sub-Topic
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setInsertOpen(false); onAddBlock?.('terms_card') }}>
                  <BookOpenCheck className="h-4 w-4 text-gray-500" aria-hidden="true" /> Terms and Definitions Card
                </button>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button type="button" className={menuBtn} onClick={() => { closeAllMenus(); setFormatOpen((v) => !v) }} aria-haspopup="menu" aria-expanded={formatOpen}>
            Format
          </button>
          {formatOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setFormatOpen(false)} />
              <div className="absolute left-0 z-50 mt-1 w-72 rounded-lg border border-gray-200 bg-white py-2 shadow-lg" role="menu">
                <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Theme</p>
                {palettes.map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    role="menuitemradio"
                    aria-checked={paletteName === p.name}
                    className={dropItem}
                    onClick={() => onPalettePick?.(p.name)}
                  >
                    <span className="flex items-center" aria-hidden="true">
                      <span className="inline-block h-4 w-4 rounded-full border border-gray-300" style={{ background: p.primary }} />
                      <span className="-ml-1 inline-block h-4 w-4 rounded-full border border-gray-300" style={{ background: p.secondary }} />
                    </span>
                    <span className="flex-1">{p.name}</span>
                    {paletteName === p.name && <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                  </button>
                ))}
                <div className="my-1 border-t border-gray-100" />
                <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Layout</p>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={columns === '1'}
                  className={dropItem}
                  onClick={() => onColumnsChange?.('1')}
                >
                  <Rows2 className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  <span className="flex-1">1-column</span>
                  {columns === '1' && <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                </button>
                <button
                  type="button"
                  role="menuitemradio"
                  aria-checked={columns === '2'}
                  className={dropItem}
                  onClick={() => onColumnsChange?.('2')}
                >
                  <Columns2 className="h-4 w-4 text-gray-500" aria-hidden="true" />
                  <span className="flex-1">2-column</span>
                  {columns === '2' && <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                </button>
                <div className="my-1 border-t border-gray-100" />
                <p className="px-3 pb-1 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">Paper size</p>
                {Object.entries(paperSizes).map(([key, size]) => (
                  <button
                    key={key}
                    type="button"
                    role="menuitemradio"
                    aria-checked={paperSize === key}
                    className={dropItem}
                    onClick={() => onPaperSizeChange?.(key)}
                  >
                    <span className="flex-1">{key} <span className="text-xs text-gray-400">· {size.label}</span></span>
                    {paperSize === key && <Check className="h-4 w-4 text-emerald-600" aria-hidden="true" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button type="button" className={menuBtn} onClick={() => { closeAllMenus(); setHelpOpen((v) => !v) }} aria-haspopup="menu" aria-expanded={helpOpen}>
            Help
          </button>
          {helpOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setHelpOpen(false)} />
              <div className="absolute left-0 z-50 mt-1 w-64 rounded-lg border border-gray-200 bg-white py-1 shadow-lg" role="menu">
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setHelpOpen(false); setHelpModal('shortcuts') }}>
                  <Keyboard className="h-4 w-4 text-gray-500" aria-hidden="true" /> Keyboard shortcuts
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setHelpOpen(false); navigate('/guide') }}>
                  <BookOpen className="h-4 w-4 text-gray-500" aria-hidden="true" /> Review Well guide
                </button>
                <button type="button" role="menuitem" className={dropItem} onClick={() => { setHelpOpen(false); navigate('/about') }}>
                  <Info className="h-4 w-4 text-gray-500" aria-hidden="true" /> About
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* New document modal (in-app, no native popups) */}
      {newModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => setNewModalOpen(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Start a new document">
            <div className="flex items-center gap-2">
              <FilePlus className="h-5 w-5 text-gray-700" aria-hidden="true" />
              <h3 className="text-base font-extrabold text-gray-900">Start a new document?</h3>
            </div>
            <p className="mt-2 text-sm text-gray-600">
              This clears the current canvas and takes you back to the setup form to start a new reviewer.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={() => setNewModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => { setNewModalOpen(false); onNew?.() }}
                className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700"
              >
                Discard and go to setup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Open reviewer modal (database archive) */}
      {openModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => setOpenModalOpen(false)}>
          <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Open a reviewer">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-gray-700" aria-hidden="true" />
              <h3 className="text-base font-extrabold text-gray-900">Open a reviewer</h3>
            </div>
            <p className="mt-1 text-xs text-gray-500">Load an existing reviewer from your archive.</p>
            <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
              {libraryLoading && <p className="py-6 text-center text-sm text-gray-500">Loading your archive…</p>}
              {libraryError && <p className="py-6 text-center text-sm text-red-600">{libraryError}</p>}
              {!libraryLoading && !libraryError && library.length === 0 && (
                <p className="py-6 text-center text-sm text-gray-500">No reviewers in your archive yet.</p>
              )}
              {!libraryLoading && !libraryError && library.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => handleOpenReviewer(r.id)}
                  className="mb-2 flex w-full items-center gap-3 rounded-xl border border-gray-200 px-3 py-2.5 text-left hover:border-gray-400 hover:bg-gray-50"
                >
                  <BookOpen className="h-5 w-5 shrink-0 text-gray-400" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-gray-900">{r.courseDescription || r.title}</span>
                    <span className="block truncate text-xs text-gray-500">
                      {r.courseCode || 'No code'} · {EXAM_LABELS[r.examType] || r.examType || ''} · {r.semester || ''}
                    </span>
                  </span>
                </button>
              ))}
            </div>
            <div className="mt-3 flex justify-end">
              <button type="button" onClick={() => setOpenModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help modal: keyboard shortcuts (Guide and About live on full pages) */}
      {helpModal === 'shortcuts' && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={() => setHelpModal(null)}>
          <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Keyboard shortcuts</h3>
              <button type="button" className="rounded px-2 py-1 text-sm hover:bg-gray-100" onClick={() => setHelpModal(null)}>Close</button>
            </div>
              <ul className="space-y-1.5 text-sm text-gray-700">
                <li><b>Ctrl + B</b> — Bold · <b>Ctrl + I</b> — Italic · <b>Ctrl + U</b> — Underline</li>
                <li><b>Ctrl + Z</b> — Undo · <b>Ctrl + Y</b> — Redo</li>
                <li><b>Ctrl + S</b> — Save document</li>
                <li><b>Ctrl + A</b> — Select the document body</li>
                <li><b>Ctrl + Alt + L</b> — Insert a Lesson banner</li>
                <li><b>Ctrl + Alt + M</b> — Insert a Main Topic</li>
                <li><b>Ctrl + Alt + S</b> — Insert a Sub-Topic</li>
                <li><b>Double-click</b> the top or bottom margin of a page — edit header or footer</li>
                <li><b>Click any element</b> — edit it inline</li>
              </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default Toolbar
