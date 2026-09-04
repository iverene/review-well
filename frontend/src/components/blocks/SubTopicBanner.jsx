const SubTopicBanner = ({ content, onChange }) => {
  const update = (field, value) => onChange({ ...content, [field]: value })

  return (
    <div
      className="rounded-full border-2 border-dashed px-4 py-1.5"
      style={{
        borderColor: 'var(--sheet-primary, #604A3A)',
        background: 'var(--sheet-tint, #FFF7E8)',
        color: 'var(--sheet-primary, #604A3A)',
      }}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-label="Sub-topic heading"
        onBlur={(e) => update('heading', e.currentTarget.textContent?.trim() || '')}
        className="sheet-editable text-center text-sm font-bold"
      >
        {content?.heading || 'Sub-Topic — click to edit'}
      </div>
    </div>
  )
}

export default SubTopicBanner
