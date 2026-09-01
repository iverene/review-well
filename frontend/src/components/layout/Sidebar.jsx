import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import axios from 'axios'

const Sidebar = ({ open, onClose }) => {
  const [reviewers, setReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
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
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-stone bg-paper transition-transform md:relative md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Search */}
          <div className="border-b border-stone p-4">
            <input
              type="text"
              placeholder="Search reviewers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-stone bg-paper px-3 py-2 text-sm text-ink placeholder-muted focus:border-ink focus:outline-none"
            />
          </div>

          {/* Reviewer List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 text-sm text-muted">Loading...</div>
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
                        ? 'border-l-2 border-ink bg-stone text-ink'
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
          <div className="border-t border-stone p-4">
            <Link
              to="/create"
              className="flex w-full items-center justify-center gap-2 rounded border border-stone bg-ink px-4 py-2 text-sm text-paper transition-colors hover:bg-stone"
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
