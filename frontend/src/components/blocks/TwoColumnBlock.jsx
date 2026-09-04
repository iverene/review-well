const TwoColumnBlock = ({ content, onChange }) => {
  const left = content?.left || 'Left column — click to edit.'
  const right = content?.right || 'Right column — click to edit.'

  return (
    <div className="grid grid-cols-2 gap-4">
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Left column"
        onBlur={(e) => onChange({ ...content, left: e.currentTarget.innerText || '' })}
        className="sheet-editable whitespace-pre-wrap rounded bg-gray-50 p-2 text-sm"
      >
        {left}
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Right column"
        onBlur={(e) => onChange({ ...content, right: e.currentTarget.innerText || '' })}
        className="sheet-editable whitespace-pre-wrap rounded bg-gray-50 p-2 text-sm"
      >
        {right}
      </div>
    </div>
  )
}

export default TwoColumnBlock
