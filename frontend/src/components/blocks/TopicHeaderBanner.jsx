const TopicHeaderBanner = ({ content, onChange }) => {
  const update = (field, value) => onChange({ ...content, [field]: value })

  return (
    <div
      className="rounded-full border-2 px-4 py-1.5"
      style={{
        background: 'var(--sheet-secondary, #F9E4A8)',
        borderColor: 'var(--sheet-primary, #604A3A)',
      }}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-label="Main topic heading"
        onBlur={(e) => update('heading', e.currentTarget.textContent?.trim() || '')}
        className="sheet-editable text-sm font-extrabold"
      >
        {content?.heading || 'Main Topic — click to edit'}
      </div>
    </div>
  )
}

export default TopicHeaderBanner
