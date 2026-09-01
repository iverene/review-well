const ContentBlock = ({ content, onChange }) => {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={content?.heading || ''}
        onChange={(e) => onChange({ ...content, heading: e.target.value })}
        className="w-full font-semibold text-ink bg-transparent border-none focus:outline-none"
        placeholder="Term"
      />
      <textarea
        value={content?.body || ''}
        onChange={(e) => onChange({ ...content, body: e.target.value })}
        className="w-full text-muted bg-transparent border-none focus:outline-none resize-none"
        placeholder="Definition"
        rows={2}
      />
    </div>
  )
}

export default ContentBlock
