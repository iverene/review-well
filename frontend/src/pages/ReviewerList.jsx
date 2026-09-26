import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { BookOpen, LibraryBig, Search, X } from 'lucide-react'

import ErrorAlert from '../components/common/ErrorAlert'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { isSameCourse } from '../utils/courseMatching'
import { useAuth } from '../contexts/AuthContext'
import { ReviewerGridSkeleton } from '../components/common/Skeleton'

const ReviewerList = ({ mine = false }) => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const sameCourseOnly = searchParams.get('course') === 'mine'
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300)
    return () => clearTimeout(timer)
  }, [query])

  useEffect(() => {
    const loadReviewers = async () => {
      try {
        const params = mine ? {} : { limit: 50, ...(debouncedQuery ? { search: debouncedQuery } : {}) }
        const response = await axios.get(mine ? '/api/reviewers/my' : '/api/reviewers/public', { params, withCredentials: mine })
        const loadedReviewers = response.data.reviewers || []
        setReviewers(sameCourseOnly ? loadedReviewers.filter((reviewer) => isSameCourse(reviewer, user)) : loadedReviewers)
      } catch (loadError) {
        console.error('Failed to load reviewer list:', loadError)
        setError(getApiErrorMessage(loadError, 'Unable to load reviewers.'))
      } finally {
        setLoading(false)
      }
    }
    loadReviewers()
  }, [mine, sameCourseOnly, user?.id, debouncedQuery])

  const title = mine ? 'My Reviewers' : sameCourseOnly ? 'Reviewers From the Same Course' : 'Public Reviewers'
  const Icon = mine ? LibraryBig : BookOpen

  return (
    <PageContainer className="space-y-6">
      <PageHeader title={title} />
      <ErrorAlert>{error}</ErrorAlert>
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
      {loading ? <ReviewerGridSkeleton /> : reviewers.length === 0 ? <p className="rounded-soft border-2 border-dashed border-stone px-5 py-10 text-center text-muted">No Reviewers Here Yet.</p> : <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{reviewers.map((reviewer) => <Link key={reviewer.id} to={`/reviewer/${reviewer.id}`} className="group rounded-soft border-2 border-stone bg-paper p-4 club-shadow transition-transform hover:-translate-y-1 md:p-5"><div className="flex items-start justify-between gap-3"><h2 className="font-display text-base font-bold text-ink md:text-lg">{reviewer.title}</h2><Icon className="h-5 w-5 shrink-0 text-accent" aria-hidden="true" /></div><p className="mt-1.5 text-sm font-semibold text-muted md:mt-2">{reviewer.courseCode}</p></Link>)}</div>}
    </PageContainer>
  )
}

export default ReviewerList
