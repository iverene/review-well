import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { Search, UserPlus, X } from 'lucide-react'

import FollowButton from '../components/social/FollowButton'
import { useToast } from '../contexts/ToastContext'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'

const FindFriends = () => {
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searched, setSearched] = useState(false)
  const toast = useToast()

  const search = useCallback(async (term) => {
    setLoading(true)
    try {
      const response = await axios.get('/api/profile/search', {
        params: { q: term, limit: 20 },
        withCredentials: true,
      })
      setUsers(response.data.users || [])
      setSearched(true)
    } catch (err) {
      console.error('Failed to search users:', err)
      toast.error(getApiErrorMessage(err, 'Unable to find friends right now.'))
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    search('')
  }, [search])

  const handleSubmit = (event) => {
    event.preventDefault()
    search(query.trim())
  }

  const handleClear = () => {
    setQuery('')
    search('')
  }

  return (
    <PageContainer>
      <PageHeader title="Find Friends" />

      <form onSubmit={handleSubmit} className="mt-5 flex gap-2" role="search">
        <div className="relative min-w-0 flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or school…"
            aria-label="Search friends"
            className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 pr-11 text-ink focus:border-accent focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted hover:bg-stone/40 hover:text-ink"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={loading}
          aria-label="Search"
          title="Search"
          className="inline-flex shrink-0 items-center rounded-soft border-2 border-accent bg-accent px-4 py-3 text-paper hover:-translate-y-0.5 disabled:opacity-60"
        >
          <Search className="h-4 w-4" aria-hidden="true" />
        </button>
      </form>

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
            <p className="mt-2 font-display text-lg font-bold text-ink">No Study Buddies Found</p>
            <p className="mt-1 text-sm text-muted">Try a different name or school.</p>
          </div>
        )}
        {!loading && users.map((person) => (
          <div key={person.id} className="flex items-center gap-3 rounded-soft border-2 border-stone bg-paper p-3">
            <Link to={`/profile/${person.id}`} className="flex min-w-0 flex-1 items-center gap-2.5">
              {person.avatarUrl ? (
                <img src={person.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-powder font-display text-lg font-bold text-ink" aria-hidden="true">
                  {person.displayName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
              <span className="min-w-0">
                <span className="block truncate font-display text-base font-bold text-ink hover:underline">{person.displayName}</span>
                {person.school && <span className="block truncate text-xs text-muted">{person.school}{person.program ? ` • ${person.program}` : ''}</span>}
              </span>
            </Link>
            <FollowButton userId={person.id} initialFollowing={!!person.isFollowing} />
          </div>
        ))}
      </div>
    </PageContainer>
  )
}

export default FindFriends
