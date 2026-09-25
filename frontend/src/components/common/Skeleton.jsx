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
  <div className="mx-auto max-w-4xl space-y-8" role="status" aria-label="Loading profile">
    <div className="flex items-center gap-6"><Skeleton className="h-24 w-24 rounded-full" /><div className="space-y-3"><Skeleton className="h-7 w-48" /><Skeleton className="h-4 w-64" /><Skeleton className="h-4 w-80" /></div></div>
    <div className="flex gap-8 border-b-2 border-stone pb-4"><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-16" /><Skeleton className="h-10 w-16" /></div>
    <Skeleton className="h-32 w-full" />
  </div>
)

const NotificationsSkeleton = () => (
  <div className="mx-auto max-w-2xl space-y-3" role="status" aria-label="Loading notifications">
    {Array.from({ length: 5 }, (_, index) => <div key={index} className="flex items-center gap-3 border-b-2 border-stone py-4"><Skeleton className="h-10 w-10 rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/3" /></div></div>)}
  </div>
)

const ReviewerSkeleton = () => (
  <div className="space-y-6" role="status" aria-label="Loading reviewer">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <Skeleton className="h-8 w-40" />
      <div className="flex gap-2"><Skeleton className="h-9 w-20 rounded-full" /><Skeleton className="h-9 w-20 rounded-soft" /><Skeleton className="h-9 w-24 rounded-soft" /></div>
    </div>
    <div className="space-y-3"><Skeleton className="h-10 w-2/3" /><Skeleton className="h-4 w-1/2" /></div>
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_220px]">
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-soft border-2 border-stone bg-paper px-3 py-2"><Skeleton className="h-6 w-32" /><Skeleton className="h-6 w-6" /></div>
        <Skeleton className="h-[62vh] w-full md:h-[72vh]" />
      </div>
      <div className="space-y-4 rounded-soft border-2 border-stone bg-mint/40 p-5"><Skeleton className="h-6 w-28" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-4 w-2/3" /></div>
    </div>
  </div>
)

export { Skeleton, ReviewerGridSkeleton, ProfileSkeleton, NotificationsSkeleton, ReviewerSkeleton }
