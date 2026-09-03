import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Download, Plus, Sparkles } from 'lucide-react'

const Toolbar = ({ reviewer, saving, onSave, onAddBlock, onAiExtract, onTitleChange }) => {
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const blockTypes = [
    { type: 'topic_banner', label: 'Topic Header', icon: 'H' },
    { type: 'sub_topic_banner', label: 'Sub-topic Header', icon: 'h' },
    { type: 'content_block', label: 'Content Block', icon: '¶' },
    { type: 'table', label: 'Table', icon: '⊞' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-3 border-b-2 border-stone bg-paper/90 px-4 py-3 md:px-6">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="rounded p-2 text-muted hover:bg-stone hover:text-ink"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <input value={reviewer.title} onChange={(event) => onTitleChange?.(event.target.value)} className="w-40 truncate bg-transparent font-display text-lg font-bold text-ink focus:outline-none sm:w-64" aria-label="Document title" />
          <div className="hidden text-xs text-muted md:block">{reviewer.courseCode} · {reviewer.examType} · {reviewer.visibility}</div>
        </div>
      </div>

      {/* Center: Add Block */}
      <div className="relative">
        <button
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          className="flex items-center gap-2 rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add Block
        </button>

        {addMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setAddMenuOpen(false)}
            />
            <div className="absolute right-0 z-50 mt-2 w-48 rounded border border-stone bg-paper shadow-lg">
              {blockTypes.map((blockType) => (
                <button
                  key={blockType.type}
                  onClick={() => {
                    onAddBlock(blockType.type)
                    setAddMenuOpen(false)
                  }}
                  className="flex w-full items-center gap-3 px-4 py-3 text-sm text-ink hover:bg-stone"
                >
                  <span className="flex h-6 w-6 items-center justify-center rounded bg-stone text-xs font-medium">
                    {blockType.icon}
                  </span>
                  {blockType.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: Save */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAiExtract}
          className="hidden items-center gap-2 rounded-soft border-2 border-butter bg-butter px-3 py-2 text-sm font-extrabold text-ink hover:bg-mint sm:flex"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" /> AI extract
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="hidden items-center gap-2 rounded-soft border-2 border-stone px-3 py-2 text-sm font-extrabold text-ink hover:bg-powder sm:flex"
        >
          <Download className="h-4 w-4" aria-hidden="true" /> Export
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        <div className="hidden text-xs text-muted md:block">
          {reviewer.isDraft ? 'Draft' : 'Published'}
        </div>
      </div>
    </div>
  )
}

export default Toolbar
