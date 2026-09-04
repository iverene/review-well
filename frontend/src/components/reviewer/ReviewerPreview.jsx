import { BookOpen } from 'lucide-react'

import { EXAM_LABELS } from '../../utils/exportPdf'
import { paginateBlocks } from '../../utils/paginate'

const FALLBACK_THEME = { primary: '#7C6B5D', secondary: '#F5EAD3', accent: '#FCF7EC' }

const PreviewBlock = ({ block }) => {
  const content = block.contentData || {}

  if (block.blockType === 'lesson_banner') {
    return (
      <div className="rounded-lg px-4 py-3 text-white" style={{ background: 'var(--sheet-primary)' }}>
        <p className="truncate text-sm font-extrabold uppercase tracking-wide">{content.heading || 'Lesson'}</p>
        {content.subtitle && <p className="truncate text-xs opacity-90">{content.subtitle}</p>}
      </div>
    )
  }

  if (block.blockType === 'topic_banner') {
    return (
      <div className="rounded-full border-2 px-4 py-1.5" style={{ background: 'var(--sheet-secondary)', borderColor: 'var(--sheet-primary)' }}>
        <p className="truncate text-sm font-extrabold">{content.heading || 'Main Topic'}</p>
      </div>
    )
  }

  if (block.blockType === 'sub_topic_banner') {
    return (
      <div className="rounded-full border-2 border-dashed px-4 py-1.5" style={{ borderColor: 'var(--sheet-primary)', background: 'var(--sheet-tint)', color: 'var(--sheet-primary)' }}>
        <p className="truncate text-center text-sm font-bold">{content.heading || 'Sub-Topic'}</p>
      </div>
    )
  }

  if (block.blockType === 'table') {
    const headers = content.headers || []
    const rows = (content.rows || []).slice(0, 2)
    return (
      <div className="overflow-hidden rounded-md border" style={{ borderColor: 'var(--sheet-primary)' }}>
        <table className="w-full table-fixed border-collapse text-xs">
          <thead>
            <tr style={{ background: 'var(--sheet-primary)', color: '#fff' }}>
              {headers.map((h, i) => <th key={i} className="truncate border border-white/20 p-1.5 text-center font-bold">{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, r) => (
              <tr key={r} className={r % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                {row.map((cell, c) => <td key={c} className="truncate border border-gray-200 p-1.5">{cell}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (block.blockType === 'image') {
    return (
      <figure className="space-y-1">
        {content.src
          ? <img src={content.src} alt={content.caption || 'Reviewer image'} className="max-h-40 w-full rounded-md bg-gray-50 object-contain" />
          : <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-center text-xs text-gray-400">Image</div>}
        {content.caption && <figcaption className="truncate text-center text-xs text-gray-500">{content.caption}</figcaption>}
      </figure>
    )
  }

  if (block.blockType === 'divider') {
    return <hr className="border-0 border-t-2 opacity-30" style={{ borderColor: 'var(--sheet-primary)' }} />
  }

  if (block.blockType === 'terms_card') {
    const terms = content.terms || []
    const shown = terms.slice(0, 3)
    return (
      <div className="overflow-hidden rounded-xl border-2 bg-white" style={{ borderColor: 'var(--sheet-primary)' }}>
        <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: 'var(--sheet-tint)' }}>
          <BookOpen className="h-3.5 w-3.5 shrink-0" style={{ color: 'var(--sheet-primary)' }} aria-hidden="true" />
          <p className="truncate text-xs font-extrabold">{content.title || 'Key Terms'}</p>
        </div>
        <div className="divide-y divide-gray-100">
          {shown.map((t, i) => (
            <div key={i} className="px-3 py-1.5">
              <p className="truncate text-xs font-bold">{t.term}</p>
              <p className="truncate text-xs text-gray-600">{t.definition}</p>
            </div>
          ))}
        </div>
        {terms.length > 3 && <p className="bg-gray-50 px-3 py-1 text-[11px] font-semibold text-gray-500">+{terms.length - 3} more terms</p>}
      </div>
    )
  }

  if (block.blockType === 'two_column') {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[content.left, content.right].map((text, i) => (
          <p key={i} className="line-clamp-2 rounded bg-gray-50 p-2 text-xs text-gray-700">{text}</p>
        ))}
      </div>
    )
  }

  if (block.blockType === 'main_title') {
    return (
      <div>
        <p className="truncate text-lg font-extrabold">{content.heading || 'Title'}</p>
        {content.subtitle && <p className="truncate text-xs text-gray-500">{content.subtitle}</p>}
      </div>
    )
  }

  // content_block and any other text block: compact truncated preview
  return (
    <div>
      {content.heading && <p className="truncate text-sm font-bold">{content.heading}</p>}
      {content.body && <p className="line-clamp-2 text-sm text-gray-700">{content.body}</p>}
    </div>
  )
}

// Read-only preview of a reviewer: structural, truncated, paginated, print-friendly.
// Never renders the editable block components.
const ReviewerPreview = ({ reviewer }) => {
  const theme = reviewer?.colorPalette || FALLBACK_THEME
  const examLabel = EXAM_LABELS[reviewer?.examType] || reviewer?.examType || ''
  const blocks = (reviewer?.blocks || []).filter((b) => b.blockType !== 'page_break')
  const { pages } = paginateBlocks(blocks, 'A4')
  const total = pages.length

  const header = (
    <div className="rounded-lg p-4 text-white" style={{ background: 'var(--sheet-primary)' }}>
      <p className="text-lg font-extrabold leading-tight">
        {reviewer?.courseDescription || reviewer?.title || 'Untitled reviewer'}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {reviewer?.courseCode && (
          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold" style={{ background: 'var(--sheet-secondary)', color: '#1f1b16' }}>
            {reviewer.courseCode}
          </span>
        )}
        {examLabel && (
          <span className="rounded-full border border-white/50 px-2.5 py-0.5 text-[11px] font-extrabold">{examLabel}</span>
        )}
        {reviewer?.semester && (
          <span className="rounded-full border border-white/50 px-2.5 py-0.5 text-[11px] font-extrabold">{reviewer.semester}</span>
        )}
      </div>
    </div>
  )

  const footer = (pageIndex) => (
    <div className="mt-6 flex items-center justify-between overflow-hidden rounded-md text-xs font-bold">
      <span className="px-3 py-1.5 text-white" style={{ background: 'var(--sheet-primary)' }}>Page {pageIndex + 1} / {total}</span>
      <span className="flex-1 truncate px-3 py-1.5 text-right" style={{ background: 'var(--sheet-secondary)', color: '#1f1b16' }}>
        {reviewer?.user?.displayName || 'Review Well'}
      </span>
    </div>
  )

  return (
    <div aria-label="Reviewer preview">
      {pages.map((pageBlocks, pageIndex) => (
        <div
          key={pageIndex}
          data-preview-page
          data-index={pageIndex}
          className="preview-page sheet-theme w-full rounded-lg bg-white p-6 shadow-sm sm:p-8"
          style={{
            '--sheet-primary': theme.primary,
            '--sheet-secondary': theme.secondary,
            '--sheet-tint': theme.accent,
          }}
        >
          {pageIndex === 0 && header}
          <div className={pageIndex === 0 ? 'mt-4 space-y-3' : 'space-y-3'}>
            {pageBlocks.length === 0 && (
              <p className="rounded-lg border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                This reviewer has no content to preview yet.
              </p>
            )}
            {pageBlocks.map((block) => (
              <PreviewBlock key={block.id} block={block} />
            ))}
          </div>
          {footer(pageIndex)}
        </div>
      ))}
    </div>
  )
}

export default ReviewerPreview
