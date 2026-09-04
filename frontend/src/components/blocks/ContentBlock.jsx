const ContentBlock = ({ content, onChange, fontFamily, fontSize, align, lineHeight, textColor }) => {
  const update = (field, value) => onChange({ ...content, [field]: value })

  return (
    <div
      className="space-y-1"
      style={{
        fontFamily: fontFamily || content?.fontFamily || undefined,
        fontSize: fontSize ? `${fontSize}px` : undefined,
        textAlign: content?.align || align || 'left',
        lineHeight: lineHeight || content?.lineHeight || 1.5,
        color: textColor || content?.color || undefined,
      }}
    >
      {(content?.heading || content?.heading === '') && (
        <div
          contentEditable
          suppressContentEditableWarning
          spellCheck
          role="textbox"
          aria-label="Term or heading"
          onBlur={(e) => update('heading', e.currentTarget.textContent?.trim() || '')}
          className="sheet-editable text-sm font-bold"
        >
          {content?.heading || 'Term — click to edit'}
        </div>
      )}
      <div
        contentEditable
        suppressContentEditableWarning
        spellCheck
        role="textbox"
        aria-label="Normal text body"
        onBlur={(e) => update('body', e.currentTarget.innerText || '')}
        className="sheet-editable whitespace-pre-wrap text-sm"
      >
        {content?.body || 'Continuous normal text — click to edit. Supports bold, italic, lists via the ribbon.'}
      </div>
    </div>
  )
}

export default ContentBlock
