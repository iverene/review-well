const SubTopicBanner = ({ content, onChange }) => {
  return (
    <div className="border-l-2 border-muted pl-3 py-1">
      <input
        type="text"
        value={content?.heading || ''}
        onChange={(e) => onChange({ ...content, heading: e.target.value })}
        className="w-full text-lg font-semibold text-ink bg-transparent border-none focus:outline-none"
        placeholder="Sub-topic Header"
      />
    </div>
  )
}

export default SubTopicBanner
