const TopicHeaderBanner = ({ content, onChange }) => {
  return (
    <div className="border-l-4 border-accent bg-stone/50 pl-4 py-2">
      <input
        type="text"
        value={content?.heading || ''}
        onChange={(e) => onChange({ ...content, heading: e.target.value })}
        className="w-full text-xl font-bold text-ink bg-transparent border-none focus:outline-none"
        placeholder="Topic Header"
      />
    </div>
  )
}

export default TopicHeaderBanner
