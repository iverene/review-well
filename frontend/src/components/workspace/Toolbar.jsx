import { useState } from 'react'
import { Link } from 'react-router-dom'

const Toolbar = ({ reviewer, saving, onSave, onAddBlock }) => {
  const [addMenuOpen, setAddMenuOpen] = useState(false)

  const blockTypes = [
    { type: 'topic_banner', label: 'Topic Header', icon: 'H' },
    { type: 'sub_topic_banner', label: 'Sub-topic Header', icon: 'h' },
    { type: 'content_block', label: 'Content Block', icon: '¶' },
    { type: 'table', label: 'Table', icon: '⊞' },
  ]

  return (
    <div className="flex items-center justify-between border-b border-stone bg-paper px-4 py-2 md:px-6">
      {/* Left: Back + Title */}
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="rounded p-2 text-muted hover:bg-stone hover:text-ink"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="hidden text-sm text-muted md:block">
          {reviewer.courseCode} • {reviewer.visibility}
        </div>
      </div>

      {/* Center: Add Block */}
      <div className="relative">
        <button
          onClick={() => setAddMenuOpen(!addMenuOpen)}
          className="flex items-center gap-2 rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
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
