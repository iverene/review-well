import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Bookmark, BookOpen, LibraryBig, Plus, Search, X } from 'lucide-react'

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
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import EmptyState from '../components/common/EmptyState'
import Tag from '../components/common/Tag'

const ReviewerList = ({ mine = false }) => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({ total: 0, hasMore: false })
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

  // A changed search or filter is a new result set, not another page.
  useEffect(() => {
    setPage(1)
  }, [debouncedQuery, filters.examType, filters.semester, sameCourseOnly])

  const listParams = {
    page,
    limit: 20,
    ...(mine
      ? {}
      : {
          ...(debouncedQuery ? { search: debouncedQuery } : {}),
          ...(filters.examType ? { examType: filters.examType } : {}),
          ...(filters.semester ? { semester: filters.semester } : {}),
        }),
  }
  const listUrl = mine ? '/api/reviewers/my' : '/api/reviewers/public'
  const listKey = cacheKey('GET', listUrl, listParams)
  const {
    data: listData,
    loading: listLoading,
    error: listError,
  } = useCachedGet(
    listKey,
    () =>
      axios.get(listUrl, {
        params: listParams,
        withCredentials: mine,
      }),
    { enabled: mine ? !!user?.id : true }
  )

  useEffect(() => {
    if (!listData) return
    const loadedReviewers = listData.reviewers || []
    const visible = sameCourseOnly
      ? loadedReviewers.filter((reviewer) => isSameCourse(reviewer, user))
      : loadedReviewers

    setReviewers((previous) => {
      if (page === 1) return visible
      const known = new Set(previous.map((reviewer) => reviewer.id))
      return [...previous, ...visible.filter((reviewer) => !known.has(reviewer.id))]
    })
    setPagination(
      listData.pagination || {
        total: visible.length,
        hasMore: false,
      }
    )
  }, [listData, page, sameCourseOnly, user])

  useEffect(() => {
    setLoading(listLoading && reviewers.length === 0)
    setLoadingMore(listLoading && page > 1)
  }, [listLoading, page, reviewers.length])

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
          <Button to="/create" variant="primary" className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" aria-hidden="true" /> New
          </Button>
        )}
      </div>
      {!mine && (
        <form onSubmit={(e) => e.preventDefault()} role="search">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => {
                setPage(1)
                setQuery(e.target.value)
              }}
              placeholder="Search by title or course description…"
              aria-label="Search reviewers"
              className="w-full rounded-soft border-2 border-line bg-paper py-2.5 pl-10 pr-11 text-sm text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setPage(1)
                  setQuery('')
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-stone/40 hover:text-ink"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </form>
      )}
      {!mine && (
        <Filter
          examType={filters.examType}
          semester={filters.semester}
          onChange={(patch) => {
            setPage(1)
            setFilters((prev) => ({ ...prev, ...patch }))
          }}
          onClear={() => {
            setPage(1)
            setFilters({ examType: '', semester: '' })
          }}
        />
      )}
      {loading ? <ReviewerGridSkeleton /> : reviewers.length === 0 ? (
        mine ? (
          <EmptyState
            title="No Reviewers Yet"
            action={<Button to="/create" variant="primary"><Plus className="h-4 w-4" aria-hidden="true" /> New Reviewer</Button>}
          >
            Upload your first reviewer to start your personal library.
          </EmptyState>
        ) : (
          <EmptyState title="No Reviewers Here Yet">
            {query || filters.examType || filters.semester ? 'Try a different search or clear the filters.' : 'Public reviewers will appear here as classmates share them.'}
          </EmptyState>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviewers.map((reviewer) => (
            <Card key={reviewer.id} to={`/reviewer/${reviewer.id}`} className="group flex flex-col">
              <div className="flex items-start justify-between gap-3">
                {reviewer.courseCode ? <Tag mono>{reviewer.courseCode}</Tag> : <span />}
                <Icon className="h-5 w-5 shrink-0 text-accent transition-transform duration-150 group-hover:-rotate-6" aria-hidden="true" />
              </div>
              <h2 className="mt-3 line-clamp-3 break-words font-display text-lg font-bold leading-snug text-ink">{reviewer.title}</h2>
              <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs font-semibold text-muted">
                <span className="inline-flex items-center gap-1"><Bookmark className="h-3.5 w-3.5" aria-hidden="true" />{reviewer._count?.saves || 0}</span>
                {mine && reviewer.visibility ? <span className="capitalize">{reviewer.visibility}</span> : reviewer.user?.displayName && <span className="truncate">by {reviewer.user.displayName}</span>}
              </div>
            </Card>
          ))}
        </div>
      )}
      {pagination.hasMore && !loading && (
        <div className="flex justify-center">
          <Button onClick={() => setPage((current) => current + 1)} disabled={loadingMore} aria-label="Load more reviewers">
            {loadingMore ? 'Loading…' : 'Load More'}
          </Button>
        </div>
      )}
      {mine && reviewers.length > 0 && (
        <Link
          to="/create"
          aria-label="New reviewer"
          title="New reviewer"
          className="fixed bottom-24 right-4 z-30 inline-flex h-14 w-14 items-center justify-center rounded-full border-2 border-accent bg-accent text-paper shadow-sticker transition-transform duration-150 active:scale-95 sm:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden="true" />
        </Link>
      )}
    </PageContainer>
  )
}

export default ReviewerList
