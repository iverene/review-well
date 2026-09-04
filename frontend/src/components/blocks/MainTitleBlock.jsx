const MainTitleBlock = ({ content, onChange }) => (
  <div className="space-y-1">
    <div
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Main title"
      onBlur={(e) => onChange({ ...content, heading: e.currentTarget.textContent?.trim() || '' })}
      className="sheet-editable text-2xl font-extrabold"
    >
      {content?.heading || 'Main Title'}
    </div>
    <div
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label="Subtitle"
      onBlur={(e) => onChange({ ...content, subtitle: e.currentTarget.textContent?.trim() || '' })}
      className="sheet-editable text-sm text-gray-500"
    >
      {content?.subtitle || 'Subtitle (optional)'}
    </div>
  </div>
)

export default MainTitleBlock
