import { useState } from 'react'
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react'

const TEXT_STYLES = [
  { value: 'lesson_banner', label: 'Lesson' },
  { value: 'topic_banner', label: 'Main Topic' },
  { value: 'sub_topic_banner', label: 'Sub-Topic' },
]

const FONTS = ['Nunito', 'Arial', 'Times New Roman', 'Poppins', 'Plus Jakarta Sans', 'Fredoka']

const TEXT_SWATCHES = [
  '#1F1B16', '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#FFFFFF', '#F3F3F3',
  '#980000', '#CC0000', '#E69138', '#F1C232', '#38761D', '#6AA84F', '#134F5C', '#45818E',
  '#1155CC', '#3C78D8', '#351C75', '#674EA7', '#C96A83', '#A64D79', '#604A3A', '#8B7768',
]

const HIGHLIGHT_SWATCHES = [
  '#FEF08A', '#FFF2CC', '#FFE599', '#F9E4A8', '#FCE5CD', '#F9CB9C', '#F6C6D2', '#EAD1DC',
  '#C9E6F2', '#CFE2F3', '#CDE8D2', '#D9EAD3', '#D5A6BD', '#B4A7D6', '#FFFFFF', 'transparent',
]

// Wrap the highlighted range (inside the sheets) in a sized span.
// Returns true when a selection was styled, false when there is nothing to style.
const wrapSelectionWithFontSize = (px) => {
  const sel = window.getSelection()
  if (!sel || sel.isCollapsed || sel.rangeCount === 0) return false
  const root = document.getElementById('sheet-export-root')
  if (!root || !root.contains(sel.anchorNode) || !root.contains(sel.focusNode)) return false
  const range = sel.getRangeAt(0).cloneRange()
  const span = document.createElement('span')
  span.style.fontSize = `${px}px`
  try {
    range.surroundContents(span)
  } catch {
    try {
      span.appendChild(range.extractContents())
      range.insertNode(span)
    } catch {
      return false
    }
  }
  sel.removeAllRanges()
  return true
}

const SwatchPanel = ({ swatches, value, onPick, label }) => (
  <div className="w-60 rounded-xl border border-gray-200 bg-white p-3 shadow-lg">
    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-wide text-gray-400">{label}</p>
    <div className="grid grid-cols-8 gap-1.5">
      {swatches.map((color) => (
        <button
          key={color}
          type="button"
          onClick={() => onPick(color)}
          title={color}
          aria-label={`Pick ${color}`}
          aria-pressed={value === color}
          className={`h-6 w-6 rounded-full border border-gray-300 hover:scale-110 ${value === color ? 'ring-2 ring-blue-500 ring-offset-1' : ''}`}
          style={{ background: color === 'transparent' ? 'linear-gradient(135deg, #fff 45%, #f87171 45%, #f87171 55%, #fff 55%)' : color }}
        />
      ))}
    </div>
    <label className="mt-2 flex cursor-pointer items-center gap-2 rounded-lg bg-gray-50 px-2 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100">
      <input type="color" value={value && value !== 'transparent' ? value : '#1f1b16'} onChange={(e) => onPick(e.target.value)} className="h-5 w-8 cursor-pointer bg-transparent" aria-label="Custom color" />
      Custom…
    </label>
  </div>
)

const FormattingToolbar = ({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  textStyle,
  onTextStyleChange,
  fontFamily,
  onFontChange,
  fontSize,
  onFontSizeChange,
  onFormatCommand,
  textColor,
  highlightColor,
  onTextColorChange,
  onHighlightColorChange,
  align,
  onAlignChange,
  lineSpacing,
  onLineSpacingChange,
}) => {
  const [colorOpen, setColorOpen] = useState(null)

  const btn = (active) =>
    `ribbon-btn px-1.5 ${active ? 'bg-blue-100 text-blue-900' : 'text-gray-700 hover:bg-gray-100'}`

  const exec = (cmd, value = null) => {
    try {
      document.execCommand('styleWithCSS', false, true)
    } catch {
      // unsupported — continue to the requested command
    }
    try {
      document.execCommand(cmd, false, value)
    } catch {
      // No-op: contentEditable may not be focused; parent state still applies
    }
    onFormatCommand?.(cmd, value)
  }

  const applyFontSize = (next) => {
    wrapSelectionWithFontSize(next)
    onFontSizeChange?.(next)
  }

  const pickTextColor = (color) => {
    onTextColorChange?.(color)
    exec('foreColor', color)
    setColorOpen(null)
  }

  const pickHighlight = (color) => {
    onHighlightColorChange?.(color)
    exec('hiliteColor', color)
    setColorOpen(null)
  }

  return (
    <div className="no-print shrink-0 border-b border-gray-200 bg-white" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <div className="flex flex-wrap items-center gap-1 px-3 py-1.5 md:px-4">
        <button type="button" className={btn(false)} title="Undo (Ctrl+Z)" disabled={!canUndo} onClick={onUndo} aria-label="Undo">
          <Undo2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <button type="button" className={btn(false)} title="Redo (Ctrl+Y)" disabled={!canRedo} onClick={onRedo} aria-label="Redo">
          <Redo2 className="h-4 w-4" aria-hidden="true" />
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />

        <button
          type="button"
          className="rounded px-2 py-1 text-sm text-gray-800 hover:bg-gray-100"
          title="Zoom document"
          onClick={() => onZoomChange?.(zoom >= 150 ? 100 : zoom + 25)}
          aria-label={`Zoom ${zoom} percent. Activate to change zoom.`}
        >
          {zoom}%
        </button>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />

        <select
          value={textStyle || 'lesson_banner'}
          onChange={(e) => onTextStyleChange?.(e.target.value)}
          className="max-w-[140px] rounded border border-gray-200 bg-white px-1 py-1 text-sm text-gray-800"
          aria-label="Text style"
        >
          {TEXT_STYLES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>

        <select
          value={fontFamily || 'Nunito'}
          onChange={(e) => onFontChange?.(e.target.value)}
          className="max-w-[170px] rounded border border-gray-200 bg-white px-1 py-1 text-sm text-gray-800"
          aria-label="Font"
        >
          {FONTS.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>

        <div className="flex items-center rounded border border-gray-200">
          <button type="button" className="px-2 py-1 text-sm hover:bg-gray-100" onClick={() => applyFontSize(Math.max(8, (fontSize || 11) - 1))} aria-label="Decrease font size">−</button>
          <span className="w-8 text-center text-sm" aria-live="polite">{fontSize || 11}</span>
          <button type="button" className="px-2 py-1 text-sm hover:bg-gray-100" onClick={() => applyFontSize(Math.min(36, (fontSize || 11) + 1))} aria-label="Increase font size">+</button>
        </div>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />

        <button type="button" className={btn(false)} title="Bold (Ctrl+B)" onClick={() => exec('bold')} aria-label="Bold"><Bold className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(false)} title="Italic (Ctrl+I)" onClick={() => exec('italic')} aria-label="Italic"><Italic className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(false)} title="Underline (Ctrl+U)" onClick={() => exec('underline')} aria-label="Underline"><Underline className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(false)} title="Strikethrough" onClick={() => exec('strikeThrough')} aria-label="Strikethrough"><Strikethrough className="h-4 w-4" aria-hidden="true" /></button>

        <div className="relative">
          <button type="button" className={btn(false)} title="Text color" onClick={() => setColorOpen((v) => (v === 'text' ? null : 'text'))} aria-label="Text color" aria-expanded={colorOpen === 'text'}>
            <span className="flex flex-col items-center leading-none">
              <span className="text-sm font-extrabold">A</span>
              <span className="mt-0.5 inline-block h-1 w-4 rounded" style={{ background: textColor || '#1f1b16' }} />
            </span>
          </button>
          {colorOpen === 'text' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setColorOpen(null)} />
              <div className="absolute z-50 mt-1">
                <SwatchPanel swatches={TEXT_SWATCHES} value={textColor} onPick={pickTextColor} label="Font color" />
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button type="button" className={btn(false)} title="Highlight color" onClick={() => setColorOpen((v) => (v === 'hl' ? null : 'hl'))} aria-label="Highlight color" aria-expanded={colorOpen === 'hl'}>
            <Highlighter className="h-4 w-4" aria-hidden="true" />
          </button>
          {colorOpen === 'hl' && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setColorOpen(null)} />
              <div className="absolute z-50 mt-1">
                <SwatchPanel swatches={HIGHLIGHT_SWATCHES} value={highlightColor} onPick={pickHighlight} label="Highlight color" />
              </div>
            </>
          )}
        </div>
        <span className="mx-1 h-5 w-px bg-gray-200" aria-hidden="true" />

        <button type="button" className={btn(align === 'left')} title="Align left" onClick={() => { exec('justifyLeft'); onAlignChange?.('left') }} aria-label="Align left"><AlignLeft className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(align === 'center')} title="Align center" onClick={() => { exec('justifyCenter'); onAlignChange?.('center') }} aria-label="Align center"><AlignCenter className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(align === 'right')} title="Align right" onClick={() => { exec('justifyRight'); onAlignChange?.('right') }} aria-label="Align right"><AlignRight className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(align === 'justify')} title="Justify" onClick={() => { exec('justifyFull'); onAlignChange?.('justify') }} aria-label="Justify"><AlignJustify className="h-4 w-4" aria-hidden="true" /></button>

        <select
          value={String(lineSpacing || 1.5)}
          onChange={(e) => onLineSpacingChange?.(Number(e.target.value))}
          className="rounded border border-gray-200 bg-white px-1 py-1 text-sm"
          aria-label="Line spacing"
          title="Line and paragraph spacing"
        >
          <option value="1">Single</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2">Double</option>
        </select>

        <button type="button" className={btn(false)} title="Bulleted list" onClick={() => exec('insertUnorderedList')} aria-label="Bulleted list"><List className="h-4 w-4" aria-hidden="true" /></button>
        <button type="button" className={btn(false)} title="Numbered list" onClick={() => exec('insertOrderedList')} aria-label="Numbered list"><ListOrdered className="h-4 w-4" aria-hidden="true" /></button>
      </div>
    </div>
  )
}

export default FormattingToolbar
