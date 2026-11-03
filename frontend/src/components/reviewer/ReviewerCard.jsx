import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'

const BANDS = ['bg-blush', 'bg-peach', 'bg-mint', 'bg-powder', 'bg-butter']

// Same course, same pastel: a stable colour per course code makes a shelf
// of reviewers scannable at a glance.
export const pastelFor = (seed = '') => {
  const sum = [...String(seed)].reduce((total, char) => total + char.charCodeAt(0), 0)
  return BANDS[sum % BANDS.length]
}

const SaveCount = ({ count, mode }) => (
  mode === 'icon' ? (
    <span className="inline-flex items-center gap-1" aria-label={`${count} saves`}>
      <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />{count}
    </span>
  ) : (
    <span>{count} saves</span>
  )
)

// Soft Pop reviewer card: a pastel band carrying the course pill, then the
// title and a quiet footer. `saves`: 'full' | 'icon' | 'none'.
const ReviewerCard = ({ reviewer, saves = 'full', showVisibility = false, className = '' }) => {
  const count = reviewer._count?.saves || 0
  const creator = reviewer.user?.displayName
  return (
    <Link
      to={`/reviewer/${reviewer.id}`}
      className={`group flex flex-col overflow-hidden rounded-club border border-stone bg-paper shadow-soft transition-transform duration-150 ease-out-soft hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0 ${className}`}
    >
      <span className={`flex h-24 items-end justify-between gap-2 p-3.5 ${pastelFor(reviewer.courseCode || reviewer.id)}`}>
        {reviewer.courseCode
          ? <span className="max-w-full truncate rounded-full bg-paper px-3 py-1 font-mono text-xs font-bold uppercase tracking-wider text-ink">{reviewer.courseCode}</span>
          : <span />}
        {showVisibility && reviewer.visibility && (
          <span className="rounded-full bg-paper/85 px-2.5 py-1 text-xs font-bold capitalize text-ink">{reviewer.visibility}</span>
        )}
      </span>
      <span className="flex flex-1 flex-col gap-2 p-4 pb-5">
        <span className="line-clamp-2 break-words font-display text-lg font-semibold leading-snug text-ink">{reviewer.title}</span>
        {(saves !== 'none' || creator) && (
          <span className="mt-auto flex items-center justify-between gap-2 pt-1 text-xs font-medium text-muted">
            {saves !== 'none' ? <SaveCount count={count} mode={saves} /> : <span />}
            {creator && <span className="truncate">by {creator}</span>}
          </span>
        )}
      </span>
    </Link>
  )
}

export default ReviewerCard
