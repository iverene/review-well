import characterWaving from '../../assets/character-waving.webp'

// Friendly empty or error moment: optional illustration, title, copy, action.
const EmptyState = ({ title, children, action, illustration = true, compact = false, className = '' }) => (
  <div className={`flex flex-col items-center rounded-club border-2 border-dashed border-stone bg-paper/70 text-center ${compact ? 'px-5 py-6' : 'px-6 py-10'} ${className}`}>
    {illustration && !compact && (
      <img src={characterWaving} alt="" aria-hidden="true" width="273" height="229" className="mb-3 h-20 w-24 object-contain" />
    )}
    {title && <p className="font-display text-lg font-bold text-ink">{title}</p>}
    {children && <div className="mt-1 max-w-sm text-sm text-muted">{children}</div>}
    {action && <div className="mt-4 flex flex-wrap justify-center gap-2">{action}</div>}
  </div>
)

export default EmptyState
