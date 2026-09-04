const LessonBanner = ({ content, onChange }) => {
  const update = (field, value) => onChange({ ...content, [field]: value })

  return (
    <div
      className="rounded-lg px-4 py-3 text-white shadow-sm"
      style={{ background: 'var(--sheet-primary, #604A3A)' }}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-label="Lesson banner heading"
        onBlur={(e) => update('heading', e.currentTarget.textContent?.trim() || '')}
        className="sheet-editable text-base font-extrabold uppercase tracking-wide"
        style={{ color: '#fff' }}
      >
        {content?.heading || 'LESSON 1 — ENTER LESSON TITLE'}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-label="Lesson banner subtitle"
        onBlur={(e) => update('subtitle', e.currentTarget.textContent?.trim() || '')}
        className="sheet-editable mt-1 text-xs opacity-90"
        style={{ color: '#fff' }}
      >
        {content?.subtitle || 'Add lesson overview…'}
      </div>
    </div>
  )
}

export default LessonBanner
