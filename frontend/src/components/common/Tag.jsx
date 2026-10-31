// Sticker-like label for course codes, visibility, and small states.
const TONES = {
  neutral: 'border-stone bg-cream text-ink',
  blush: 'border-blush bg-blush/60 text-ink',
  powder: 'border-powder bg-powder/70 text-ink',
  mint: 'border-mint bg-mint/70 text-ink',
  butter: 'border-butter bg-butter/70 text-ink',
}

const Tag = ({ tone = 'neutral', mono = false, className = '', children, ...props }) => (
  <span
    className={`inline-flex max-w-full items-center gap-1 truncate rounded-full border px-2.5 py-0.5 text-xs font-extrabold ${mono ? 'font-mono uppercase tracking-wider' : ''} ${TONES[tone] || TONES.neutral} ${className}`}
    {...props}
  >
    {children}
  </span>
)

export default Tag
