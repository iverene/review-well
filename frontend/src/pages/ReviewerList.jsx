import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { BookOpen, LibraryBig, Plus, Search, X } from 'lucide-react'

import Filter from '../components/Filter'
import { useToast } from '../contexts/ToastContext'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { isSameCourse } from '../utils/courseMatching'
import { useAuth } from '../contexts/AuthContext'
import useCachedGet from '../hooks/useCachedGet'
import { cacheKey } from '../stores/queryCache'
import { ReviewerGridSkeleton } from '../components/common/Skeleton'

const ReviewerList = ({ mine = false }) => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuth()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const sameCourseOnly = searchParams.get('course') === 'mine'
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [filters, setFilters] = useState({ examType: '', semester: '' })

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  const listParams = mine
    ? {}
    : {
        limit: 50,
        ...(debouncedQuery ? { search: debouncedQuery } : {}),
        ...(filters.examType ? { examType: filters.examType } : {}),
        ...(filters.semester ? { semester: filters.semester } : {}),
      }
  const listKey = mine ? 'GET /api/reviewers/my' : cacheKey('GET', '/api/reviewers/public', listParams)
  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useCachedGet(
    listKey,
    () =>
      axios.get(mine ? '/api/reviewers/my' : '/api/reviewers/public', {
        params: listParams,
        withCredentials: mine,
      }),
    { enabled: mine ? !!user?.id : true }
  )

  useEffect(() => {
    const loadedReviewers = listData?.reviewers || []
    setReviewers(sameCourseOnly ? loadedReviewers.filter((reviewer) => isSameCourse(reviewer, user)) : loadedReviewers)
    setLoading(listLoading)
  }, [listData, listLoading, sameCourseOnly, user])

  useEffect(() => {
    if (listError && reviewers.length === 0) {
      toast.error(getApiErrorMessage(listError, 'Unable to load reviewers.'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listError])

  const title = mine ? 'My Reviewers' : sameCourseOnly ? 'Reviewers From the Same Course' : 'Public Reviewers'
  const Icon = mine ? LibraryBig : BookOpen

  return (
    <PageContainer className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeader title={title} />
        {mine && (
          <Link
            to="/create"
            className="hidden items-center gap-2 rounded-soft border-2 border-accent bg-accent px-4 py-2.5 text-sm font-extrabold text-paper transition-transform hover:-translate-y-0.5 sm:inline-flex"
          >
            <Plus className="h-4 w-4" aria-hidden="true" /> New
          </Link>
        )}
      </div>
      {!mine && (
        <form onSubmit={(e) => e.preventDefault()} className="flex gap-2" role="search">
          <div className="relative min-w-0 flex-1">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by title or course description…"
              aria-label="Search reviewers"
              className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-2.5 pr-11 text-sm text-ink focus:border-accent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-stone/40 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
          <span
            aria-label="Search"
            title="Search"
            className="inline-flex shrink-0 items-center rounded-soft border-2 border-accent bg-accent px-4 py-2.5 text-paper"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </span>
        </form>
      )}
      {!mine && (
        <Filter
          examType={filters.examType}
          semester={filters.semester}
          onChange={(patch) => setFilters((prev) => ({ ...prev, ...patch }))}
          onClear={() => setFilters({ examType: '', semester: '' })}
        />
      )}
      {loading ? <ReviewerGridSkeleton /> : reviewers.length === 0 ? (
        mine ? (
          <div className="rounded-soft border-2 border-dashed border-stone bg-paper px-5 py-12 text-center">
            <img src="/logo.png" alt="" className="mx-auto h-20 w-20 object-contain" />
            <p className="mt-3 font-display text-xl font-bold text-ink">No Reviewers Yet</p>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted">Upload your first reviewer to start your personal library.</p>
            <Link
              to="/create"
              className="mt-5 inline-flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-5 py-2.5 text-sm font-extrabold text-paper transition-transform hover:-translate-y-0.5"
            >
              <Plus className="h-4 w-4" aria-hidden="true" /> New Reviewer
            </Link>
          </div>
        ) : (
          <p className="rounded-soft border-2 border-dashed border-stone px-5 py-10 text-center text-muted">No Reviewers Here Yet.</p>
        )
      ) : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviewers.map((reviewer) => <Link key={reviewer.id} to={`/reviewer/${reviewer.id}`} className="group rounded-soft border-2 border-stone bg-paper p-4 club-shadow transition-transform hover:-translate-y-1 md:p-5"><div className="flex items-start justify-between gap-3"><h2 className="break-words font-display text-base font-bold text-ink md:text-lg">{reviewer.title}</h2><Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /></div><p className="mt-1.5 text-sm font-semibold text-muted md:mt-2">{reviewer.courseCode}</p></Link>)}</div>}
      {mine && reviewers.length > 0 && (
        <Link
          to="/create"
          aria-label="New reviewer"
          title="New reviewer"
          className="fixed bottom-20 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-accent text-paper shadow-xl transition-transform hover:-translate-y-0.5 sm:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      )}
    </PageContainer>
  )
}

export default ReviewerList
