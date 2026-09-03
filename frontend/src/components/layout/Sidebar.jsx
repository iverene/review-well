import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'
import ErrorAlert from '../common/ErrorAlert'
import { getApiErrorMessage } from '../../utils/apiError'

const Sidebar = ({ open, onClose }) => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState(null)
  const location = useLocation()

  useEffect(() => {
    fetchReviewers()
  }, [])

  const fetchReviewers = async () => {
    try {
      const response = await axios.get('/api/reviewers/my', { withCredentials: true })
      setReviewers(response.data.reviewers)
    } catch (error) {
      console.error('Failed to fetch reviewers:', error)
      setError(getApiErrorMessage(error, 'Unable to load your reviewers.'))
    } finally {
      setLoading(false)
    }
  }

  const filteredReviewers = reviewers.filter(
    (r) =>
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.courseCode.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Overlay for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/50 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r-2 border-stone bg-paper transition-transform md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Search */}
          <div className="border-b-2 border-stone p-4">
            <input
              type="text"
              placeholder="Search reviewers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-soft border-2 border-stone bg-paper px-3 py-2 text-sm text-ink placeholder-muted focus:border-accent focus:outline-none"
            />
          </div>

          {/* Reviewer List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted">Loading...</div>
            ) : error ? (
              <ErrorAlert className="m-4">{error}</ErrorAlert>
            ) : filteredReviewers.length === 0 ? (
              <div className="p-4 text-sm text-muted">No reviewers found</div>
            ) : (
              <nav className="py-2">
                {filteredReviewers.map((reviewer) => (
                  <Link
                    key={reviewer.id}
                    to={`/reviewer/${reviewer.id}`}
                    className={`block px-4 py-3 text-sm transition-colors hover:bg-stone ${
                      location.pathname === `/reviewer/${reviewer.id}`
                        ? 'border-l-4 border-accent bg-blush/50 text-ink'
                        : 'text-muted'
                    }`}
                    onClick={onClose}
                  >
                    <div className="font-medium text-ink">{reviewer.title}</div>
                    <div className="text-xs text-muted">{reviewer.courseCode}</div>
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {/* Create Button */}
          <div className="border-t-2 border-stone p-4">
            <Link
              to="/create"
              className="flex w-full items-center justify-center gap-2 rounded-soft border-2 border-ink bg-accent px-4 py-2 text-sm font-extrabold text-paper transition-transform hover:-translate-y-0.5 hover:bg-accent"
              onClick={onClose}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Reviewer
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar
