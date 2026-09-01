const MainTitleBlock = ({ content, onChange }) => {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={content?.heading || ''}
        onChange={(e) => onChange({ ...content, heading: e.target.value })}
        className="w-full text-2xl font-bold text-ink bg-transparent border-none focus:outline-none"
        placeholder="Main Title"
      />
      <input
        type="text"
        value={content?.subtitle || ''}
        onChange={(e) => onChange({ ...content, subtitle: e.target.value })}
        className="w-full text-lg text-muted bg-transparent border-none focus:outline-none"
        placeholder="Subtitle (optional)"
      />
    </div>
  )
}

export default MainTitleBlock
