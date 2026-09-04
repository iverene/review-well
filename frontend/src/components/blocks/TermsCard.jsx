import { BookOpenCheck, Plus, X } from 'lucide-react'

const TermsCard = ({ content, onChange, fontSize, align }) => {
  const title = content?.title || 'Key Terms'
  const terms = Array.isArray(content?.terms) && content.terms.length > 0
    ? content.terms
    : [{ term: 'Term 1', definition: 'Definition — click to edit.' }]

  const updateTerm = (index, field, value) => {
    onChange({ ...content, title, terms: terms.map((t, i) => (i === index ? { ...t, [field]: value } : t)) })
  }

  const addTerm = (e) => {
    e?.stopPropagation()
    onChange({ ...content, title, terms: [...terms, { term: `Term ${terms.length + 1}`, definition: 'Definition — click to edit.' }] })
  }

  const removeTerm = (e, index) => {
    e?.stopPropagation()
    if (terms.length <= 1) return
    onChange({ ...content, title, terms: terms.filter((_, i) => i !== index) })
  }

  return (
    <div
      className="w-full min-w-0 overflow-hidden rounded-xl border-2 bg-white"
      style={{ borderColor: 'var(--sheet-primary, #604A3A)', textAlign: content?.align || align || 'left' }}
    >
      <div
        className="flex items-center gap-2 px-4 py-2"
        style={{ background: 'var(--sheet-tint, #FFF7E8)' }}
      >
        <BookOpenCheck className="h-4 w-4 shrink-0" style={{ color: 'var(--sheet-primary, #604A3A)' }} aria-hidden="true" />
        <div
          contentEditable
          suppressContentEditableWarning
          spellCheck
          role="textbox"
          aria-label="Terms card title"
          onBlur={(e) => onChange({ ...content, terms, title: e.currentTarget.textContent?.trim() || 'Key Terms' })}
          className="sheet-editable flex-1 text-sm font-extrabold"
          style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
        >
          {title}
        </div>
      </div>
      <div className="divide-y divide-gray-100">
        {terms.map((t, i) => (
          <div key={i} className="group/term relative px-4 py-2">
            <div
              contentEditable
              suppressContentEditableWarning
              spellCheck
              role="textbox"
              aria-label={`Term ${i + 1}`}
              onBlur={(e) => updateTerm(i, 'term', e.currentTarget.textContent?.trim() || '')}
              className="sheet-editable pr-6 text-sm font-bold"
              style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
            >
              {t.term}
            </div>
            <div
              contentEditable
              suppressContentEditableWarning
              spellCheck
              role="textbox"
              aria-label={`Definition ${i + 1}`}
              onBlur={(e) => updateTerm(i, 'definition', e.currentTarget.innerText || '')}
              className="sheet-editable whitespace-pre-wrap break-words text-sm text-gray-700"
              style={{ overflowWrap: 'anywhere', ...(fontSize ? { fontSize: `${fontSize}px` } : {}) }}
            >
              {t.definition}
            </div>
            {terms.length > 1 && (
              <button
                type="button"
                onClick={(e) => removeTerm(e, i)}
                className="no-print absolute right-1 top-1 rounded p-0.5 text-gray-400 opacity-0 hover:text-red-600 group-hover/term:opacity-100"
                title="Remove term"
                aria-label={`Remove term ${i + 1}`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      <div className="no-print border-t border-gray-100 px-4 py-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={addTerm}
          className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-900"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" /> Add term
        </button>
      </div>
    </div>
  )
}

export default TermsCard
