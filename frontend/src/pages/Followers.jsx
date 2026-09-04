import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Users } from 'lucide-react'

import FollowButton from '../components/social/FollowButton'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const Followers = ({ type }) => {
  const { userId } = useParams()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const title = type === 'followers' ? 'Followers' : 'Following'

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const listRes = await axios.get(`/api/social/users/${userId}/${type}`, { withCredentials: true })
        setUsers(listRes.data.users || [])
      } catch (err) {
        console.error(`Failed to load ${type}:`, err)
        setError(getApiErrorMessage(err, `Unable to load ${type}.`))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [userId, type])

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <Link to={`/profile/${userId}`} className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to profile
      </Link>
      <h1 className="mt-1 flex items-center gap-2 font-display text-3xl font-bold text-ink">
        <Users className="h-7 w-7 text-accent" aria-hidden="true" /> {title}
      </h1>

      <ErrorAlert className="mt-4">{error}</ErrorAlert>

      <div className="mt-5 rounded-soft border-2 border-stone bg-paper p-2 club-shadow sm:p-3" aria-live="polite">
        {loading && (
          <div className="space-y-2 p-2" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-soft bg-stone/40" />
            ))}
          </div>
        )}
        {!loading && !error && users.length === 0 && (
          <p className="rounded-soft border-2 border-dashed border-stone px-5 py-8 text-center text-sm text-muted">
            No {type} yet.
          </p>
        )}
        {!loading && !error && users.map((person) => (
          <div key={person.id} className="flex items-center gap-3 border-b border-stone/60 px-2 py-3 last:border-0">
            <Link to={`/profile/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
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
  )
}

export default Followers
