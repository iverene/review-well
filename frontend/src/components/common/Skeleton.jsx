const Skeleton = ({ className = '' }) => (
  <span className={`block animate-pulse rounded-soft bg-stone/70 ${className}`} aria-hidden="true" />
)

const ReviewerGridSkeleton = ({ count = 6 }) => (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="status" aria-label="Loading reviewers">
    {Array.from({ length: count }, (_, index) => (
      <div key={index} className="rounded-soft border-2 border-stone bg-paper p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-2"><Skeleton className="h-5 w-4/5" /><Skeleton className="h-4 w-2/5" /></div>
          <Skeleton className="h-5 w-5 rounded-full" />
        </div>
        <Skeleton className="mt-6 h-3 w-1/2" />
      </div>
    ))}
  </div>
)

const ProfileSkeleton = () => (
  <div className="mx-auto w-full max-w-5xl space-y-6" role="status" aria-label="Loading profile">
    <div className="rounded-club border-2 border-stone bg-paper p-5 sm:p-6">
      <div className="flex items-start gap-4"><Skeleton className="h-16 w-16 rounded-full md:h-20 md:w-20" /><div className="flex-1 space-y-2"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-56" /><Skeleton className="h-4 w-40" /></div></div>
      <div className="mt-5 flex gap-4 border-t-2 border-dashed border-stone pt-4"><Skeleton className="h-12 flex-1" /><Skeleton className="h-12 flex-1" /><Skeleton className="h-12 flex-1" /></div>
    </div>
    <Skeleton className="h-12 w-full" />
    <ReviewerGridSkeleton count={2} />
  </div>
)

const NotificationsSkeleton = () => (
  <div className="mx-auto max-w-2xl space-y-3" role="status" aria-label="Loading notifications">
    {Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center gap-3 border-b-2 border-stone py-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3" /></div></div>)}
  </div>
)

// Mirrors the hub: tags, title, inline details, action row, source viewer.
const ReviewerSkeleton = () => (
  <div className="mx-auto w-full max-w-5xl" role="status" aria-label="Loading reviewer">
    <Skeleton className="h-6 w-24 rounded-full" />
    <Skeleton className="mt-4 h-9 w-3/4" />
    <Skeleton className="mt-3 h-4 w-1/3" />
    <div className="mt-6 flex flex-wrap gap-6">{[0, 1, 2, 3].map((i) => <div key={i} className="space-y-1.5"><Skeleton className="h-3 w-16" /><Skeleton className="h-4 w-24" /></div>)}</div>
    <div className="mt-5 flex gap-2 border-t-2 border-dashed border-stone pt-4"><Skeleton className="h-11 w-16" /><Skeleton className="h-11 w-28" /><Skeleton className="h-11 w-24" /></div>
    <div className="mt-6 overflow-hidden rounded-soft border-2 border-stone bg-paper"><div className="h-12 border-b-2 border-stone bg-cream" /><Skeleton className="h-[62vh] w-full rounded-none md:h-[72vh]" /></div>
  </div>
)

export { Skeleton, ReviewerGridSkeleton, ProfileSkeleton, NotificationsSkeleton, ReviewerSkeleton }
