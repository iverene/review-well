import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Search, UserPlus } from 'lucide-react'

import FollowButton from '../components/social/FollowButton'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const FindFriends = () => {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searched, setSearched] = useState(false)

  const search = useCallback(async (term) => {
    setLoading(true)
    setError(null)
    try {
      const response = await axios.get('/api/profile/search', {
        params: { q: term, limit: 20 },
        withCredentials: true,
      })
      setUsers(response.data.users || [])
      setSearched(true)
    } catch (err) {
      console.error('Failed to search users:', err)
      setError(getApiErrorMessage(err, 'Unable to find friends right now.'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    search('')
  }, [search])

  const handleSubmit = (event) => {
    event.preventDefault()
    search(query.trim())
  }

  return (
    <div className="mx-auto max-w-3xl pb-10">
      <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">Study buddies</p>
      <h1 className="mt-1 flex items-center gap-2 font-display text-4xl font-bold text-ink">
        <UserPlus className="h-8 w-8 text-accent" aria-hidden="true" /> Find friends
      </h1>
      <p className="mt-2 text-muted">Discover classmates, follow their study guides, and grow your circle.</p>

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2" role="search">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or school…"
          aria-label="Search friends"
          className="min-w-0 flex-1 rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="inline-flex shrink-0 items-center gap-2 rounded-soft border-2 border-accent bg-accent px-5 py-3 text-sm font-extrabold text-paper hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Search className="h-4 w-4" aria-hidden="true" /> Search
        </button>
      </form>

      <ErrorAlert className="mt-4">{error}</ErrorAlert>

      <div className="mt-5 space-y-3" aria-live="polite">
        {loading && (
          <div className="space-y-3" aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-soft border-2 border-stone bg-stone/40" />
            ))}
          </div>
        )}
        {!loading && searched && users.length === 0 && (
          <div className="rounded-soft border-2 border-dashed border-stone bg-paper px-5 py-10 text-center">
            <UserPlus className="mx-auto h-8 w-8 text-accent" aria-hidden="true" />
            <p className="mt-2 font-display text-lg font-bold text-ink">No study buddies found</p>
            <p className="mt-1 text-sm text-muted">Try a different name, email, or school.</p>
          </div>
        )}
        {!loading && users.map((person) => (
          <div key={person.id} className="flex items-center gap-4 rounded-soft border-2 border-stone bg-paper p-4 club-shadow">
            <Link to={`/profile/${person.id}`} className="flex min-w-0 flex-1 items-center gap-3">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-powder font-display text-xl font-bold text-ink" aria-hidden="true">
                  {person.displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-display text-lg font-bold text-ink hover:underline">{person.displayName}</span>
                {person.school && <span className="block truncate text-xs text-muted">{person.school}{person.program ? ` • ${person.program}` : ''}</span>}
              </span>
            </Link>
            <FollowButton userId={person.id} initialFollowing={!!person.isFollowing} />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FindFriends
