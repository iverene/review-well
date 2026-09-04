import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { X } from 'lucide-react'
import FollowButton from '../social/FollowButton'
import ErrorAlert from '../common/ErrorAlert'
import { getApiErrorMessage } from '../../utils/apiError'

const FollowListModal = ({ userId, type, onClose, onNavigate }) => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const load = async () => {
      try {
        const response = await axios.get(`/api/social/users/${userId}/${type}`, { withCredentials: true })
        setUsers(response.data.users || [])
      } catch (err) {
        setError(getApiErrorMessage(err, `Unable to load ${type}.`))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, type])

  const title = type === 'followers' ? 'Followers' : 'Following'

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 p-4" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col rounded-soft border-2 border-stone bg-paper p-5 club-shadow"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={`Close ${title}`}
            className="rounded-full p-2 text-muted hover:bg-stone hover:text-ink"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-3 min-h-0 flex-1 overflow-y-auto">
          {loading && <p className="py-8 text-center text-sm text-muted">Loading {type}…</p>}
          <ErrorAlert>{error}</ErrorAlert>
          {!loading && !error && users.length === 0 && (
            <p className="rounded-soft border-2 border-dashed border-stone px-5 py-8 text-center text-sm text-muted">
              No {type} yet.
            </p>
          )}
          {!loading && !error && users.map((person) => (
            <div key={person.id} className="flex items-center gap-3 border-b border-stone/60 py-3 last:border-0">
              <Link to={`/profile/${person.id}`} onClick={onNavigate} className="flex min-w-0 flex-1 items-center gap-3">
                {person.avatarUrl ? (
                  <img src={person.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blush text-sm font-extrabold text-ink" aria-hidden="true">
                    {person.displayName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate text-sm font-extrabold text-ink hover:underline">{person.displayName}</span>
                  {person.school && <span className="block truncate text-xs text-muted">{person.school}</span>}
                </span>
              </Link>
              <FollowButton userId={person.id} initialFollowing={!!person.isFollowing} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default FollowListModal
