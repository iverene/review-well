import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Bookmark, LibraryBig, Pencil } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import FollowButton from '../components/social/FollowButton'
import ErrorAlert from '../components/common/ErrorAlert'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { formatYearLevel } from '../utils/profile'
import { ProfileSkeleton } from '../components/common/Skeleton'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

// Pomodoro-linked focus section is parked with the study modes — flip back
// on to re-enable (API and tests are intact).
const SHOW_FOCUS_STATS = false

const FocusStats = () => {
  const [stats, setStats] = useState(null)
  const [goalInput, setGoalInput] = useState('')
  const [goalError, setGoalError] = useState(null)
  const [savingGoal, setSavingGoal] = useState(false)

  useEffect(() => {
    let cancelled = false
    axios.get('/api/pomodoro/stats', { withCredentials: true })
      .then((response) => {
        if (cancelled) return
        setStats(response.data)
        setGoalInput(String(response.data.goal ?? 25))
      })
      .catch(() => {
        // Guests and failures simply get no focus section.
        if (!cancelled) setStats(null)
      })
    return () => { cancelled = true }
  }, [])

  const handleGoalSave = async () => {
    const minutes = Number(goalInput)
    if (!Number.isInteger(minutes) || minutes <= 0) {
      setGoalError('Goal must be a positive whole number of minutes.')
      return
    }
    setGoalError(null)
    setSavingGoal(true)
    try {
      const response = await axios.patch('/api/users/me/goal', { dailyFocusMinutes: minutes }, { withCredentials: true })
      setStats((prev) => (prev ? { ...prev, goal: response.data.dailyFocusMinutes } : prev))
    } catch (err) {
      setGoalError(getApiErrorMessage(err, 'Unable to save your goal.'))
    } finally {
      setSavingGoal(false)
    }
  }

  if (!stats || !Array.isArray(stats.week)) return null

  const todayMinutes = Math.round((stats.todaySeconds || 0) / 60)
  const goalMinutes = stats.goal ?? 25
  const maxWeek = Math.max(1, ...stats.week)
  // Monday-first labels ending today: rotate so the last bar is today.
  const todayIdx = (new Date().getDay() + 6) % 7
  const labels = WEEKDAY_LABELS.map((_, i) => WEEKDAY_LABELS[(todayIdx - 6 + i + 14) % 7])

  return (
    <section aria-label="Focus stats" className="mt-6 rounded-soft border-2 border-stone bg-paper p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display text-lg font-bold text-ink">Focus</h2>
      </div>
      <p className="mt-1 text-sm text-muted">
        {todayMinutes} of {goalMinutes} min today
      </p>
      <div className="mt-3 flex h-16 items-end gap-1.5" role="img" aria-label={`Focus minutes this week: ${stats.week.map((s) => Math.round(s / 60)).join(', ')}`}>
        {stats.week.map((seconds, i) => (
          <div
            key={i}
            title={`${labels[i]}: ${Math.round(seconds / 60)} min`}
            className={`flex-1 rounded-t ${i === 6 ? 'bg-accent' : 'bg-stone'}`}
            style={{ height: `${Math.max(6, Math.round((seconds / maxWeek) * 100))}%` }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <label htmlFor="focus-goal" className="text-xs font-extrabold uppercase tracking-widest text-muted">
          Daily Goal (Min)
        </label>
        <input
          id="focus-goal"
          type="number"
          min="1"
          step="1"
          value={goalInput}
          onChange={(e) => setGoalInput(e.target.value)}
          className="w-20 rounded-soft border-2 border-stone bg-paper px-2 py-1 text-sm font-bold text-ink"
        />
        <button
          type="button"
          onClick={handleGoalSave}
          disabled={savingGoal}
          className="rounded-soft border-2 border-accent bg-accent px-3 py-1 text-xs font-extrabold text-paper disabled:opacity-50"
        >
          {savingGoal ? 'Saving…' : 'Save'}
        </button>
      </div>
      {goalError && <p className="mt-2 text-xs font-bold text-red-600">{goalError}</p>}
    </section>
  )
}

const ReviewerTile = ({ reviewer, showVisibility }) => (
  <Link
    to={`/reviewer/${reviewer.id}`}
    className="group rounded-soft border-2 border-stone bg-paper p-4 club-shadow transition-transform hover:-translate-y-1"
  >
    <p className="line-clamp-2 font-display text-lg font-bold text-ink">{reviewer.title}</p>
    <p className="mt-1 font-mono text-xs font-bold uppercase tracking-widest text-muted">{reviewer.courseCode}</p>
    <div className="mt-4 flex items-center justify-between gap-2 text-xs text-muted">
      <span className="inline-flex items-center gap-1 font-semibold">
        <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
        {reviewer._count?.saves || 0} saves
      </span>
      {showVisibility && reviewer.visibility && (
        <span className="rounded-full bg-powder px-2 py-0.5 font-extrabold text-ink">{reviewer.visibility}</span>
      )}
    </div>
  </Link>
)

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [reviewers, setReviewers] = useState([])
  const [savedReviewers, setSavedReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('reviewers')
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)

  const isOwnProfile = currentUser?.id === userId || !userId
  const profileId = userId || currentUser?.id

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const url = userId ? `/api/profile/${userId}` : '/api/profile/me'
      const response = await axios.get(url, { withCredentials: true })
      const loaded = response.data.user
      setProfile(loaded)
      setFollowing(!!loaded.isFollowing)
      setFollowerCount(loaded.followerCount || 0)
      return loaded
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(getApiErrorMessage(err, 'Unable to load this profile.'))
      return null
    } finally {
      if (!silent) setLoading(false)
    }
  }, [userId])

  const fetchLists = useCallback(async (loadedProfile) => {
    const targetId = loadedProfile?.id || profileId
    if (!targetId) return
    setListLoading(true)
    try {
      const own = !userId || userId === currentUser?.id
      const reviewersUrl = own ? '/api/reviewers/my' : `/api/reviewers/author/${targetId}`
      const [reviewersRes, savedRes] = await Promise.all([
        axios.get(reviewersUrl, { withCredentials: true }),
        own
          ? axios.get('/api/social/saved', { withCredentials: true })
          : Promise.resolve({ data: { reviewers: [] } }),
      ])
      setReviewers(reviewersRes.data.reviewers || [])
      setSavedReviewers(savedRes.data.reviewers || [])
    } catch (err) {
      console.error('Failed to fetch profile lists:', err)
      setError(getApiErrorMessage(err, 'Unable to load reviewers.'))
    } finally {
      setListLoading(false)
    }
  }, [userId, currentUser?.id, profileId])

  useEffect(() => {
    setActiveTab('reviewers')
    fetchProfile().then((loaded) => {
      if (loaded) fetchLists(loaded)
    })
  }, [userId, fetchProfile, fetchLists])

  const handleFollowToggle = (isFollowing, count) => {
    setFollowing(isFollowing)
    if (typeof count === 'number') setFollowerCount(count)
    fetchProfile(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper"><ProfileSkeleton /></div>
    )
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-center">
          <ErrorAlert className="mb-4">{error || 'Profile not found'}</ErrorAlert>
          <Link to="/" className="mt-4 inline-block text-ink hover:underline">
            Go back home
          </Link>
        </div>
      </div>
    )
  }

  const tabs = isOwnProfile
    ? [
      { value: 'reviewers', label: 'Reviewers', icon: LibraryBig },
      { value: 'saved', label: 'Saved Reviewers', icon: Bookmark },
    ]
    : [{ value: 'reviewers', label: 'Reviewers', icon: LibraryBig }]

  const visibleReviewers = activeTab === 'saved' ? savedReviewers : reviewers

  return (
    <PageContainer>
      {/* Profile header (cardless) */}
      <div aria-label="Profile">
        <h1 className="break-words font-display text-3xl font-bold text-ink md:text-4xl">{profile.displayName}</h1>
        <div className="mt-3 flex items-center gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-16 w-16 rounded-full border-2 border-stone object-cover md:h-24 md:w-24"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone bg-blush font-display text-2xl font-bold text-ink md:h-24 md:w-24 md:text-3xl" aria-hidden="true">
              {profile.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            {(profile.school || profile.program || profile.major || profile.yearLevel) && (
              <div className="space-y-0.5" aria-label="School information">
                {profile.school && (
                  <p className="text-sm font-bold text-ink">{profile.school}</p>
                )}
                {(profile.program || profile.major || profile.yearLevel) && (
                  <p className="mt-0.5 text-xs text-muted">
                    {[profile.program, profile.major, formatYearLevel(profile.yearLevel)].filter(Boolean).join(' • ')}
                  </p>
                )}
              </div>
            )}
          </div>
          {isOwnProfile && (
            <Link
              to="/settings/account"
              aria-label="Edit account"
              title="Edit account"
              className="ml-auto inline-flex shrink-0 items-center justify-center self-center rounded-soft p-2.5 text-muted hover:bg-powder hover:text-ink"
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </Link>
          )}
        </div>

        {!isOwnProfile && (
          <div className="mt-4">
            <FollowButton
              userId={profile.id}
              initialFollowing={following}
              initialFollowerCount={followerCount}
              onToggle={handleFollowToggle}
            />
          </div>
        )}

        {/* Stats */}
        <div className="mt-5 flex gap-1 sm:gap-3">
          <div className="flex-1 rounded-soft px-2 py-1.5 text-center" aria-label={`${profile.reviewerCount || 0} reviewers`}>
            <span className="block font-display text-lg font-bold text-ink md:text-xl">{profile.reviewerCount || 0}</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted">Reviewers</span>
          </div>
          <Link
            to={`/profile/${profile.id}/followers`}
            className="flex-1 rounded-soft px-2 py-1.5 text-center transition-colors hover:bg-stone/40"
            aria-label={`View followers, ${followerCount}`}
          >
            <span className="block font-display text-lg font-bold text-ink md:text-xl">{followerCount}</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted">Followers</span>
          </Link>
          <Link
            to={`/profile/${profile.id}/following`}
            className="flex-1 rounded-soft px-2 py-1.5 text-center transition-colors hover:bg-stone/40"
            aria-label={`View following, ${profile.followingCount || 0}`}
          >
            <span className="block font-display text-lg font-bold text-ink md:text-xl">{profile.followingCount || 0}</span>
            <span className="text-[11px] font-extrabold uppercase tracking-widest text-muted">Following</span>
          </Link>
        </div>
        {isOwnProfile && SHOW_FOCUS_STATS && <FocusStats />}
      </div>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 rounded-soft border-2 border-stone bg-paper p-1.5" role="tablist" aria-label="Profile collections">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            aria-label={label}
            title={label}
            onClick={() => setActiveTab(value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-soft px-4 py-2.5 text-sm font-extrabold transition-colors ${activeTab === value ? 'border-2 border-accent bg-blush text-ink' : 'border-2 border-transparent text-muted hover:bg-powder hover:text-ink'}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" /> <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab panels */}
      <div className="mt-4" role="tabpanel">
        {listLoading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-soft border-2 border-stone bg-stone/40" aria-hidden="true" />
            ))}
          </div>
        ) : visibleReviewers.length === 0 ? (
          <div className="rounded-soft border-2 border-dashed border-stone bg-paper px-5 py-10 text-center">
            <p className="font-display text-lg font-bold text-ink">
              {activeTab === 'saved' ? 'No Saved Reviewers Yet' : isOwnProfile ? 'No Reviewers Yet' : 'No Public Reviewers Yet'}
            </p>
            <p className="mt-1 text-sm text-muted">
              {activeTab === 'saved'
                ? 'Tap the bookmark on any reviewer to keep it here.'
                : isOwnProfile ? 'Create your first study guide to get started.' : 'Check back once they share something.'}
            </p>
            {isOwnProfile && activeTab === 'reviewers' && (
              <Link to="/create" className="mt-4 inline-block rounded-soft border-2 border-accent bg-accent px-5 py-2 text-sm font-extrabold text-paper">
                Create a reviewer
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleReviewers.map((reviewer) => (
              <ReviewerTile key={reviewer.id} reviewer={reviewer} showVisibility={isOwnProfile} />
            ))}
          </div>
        )}
      </div>
    </PageContainer>
  )
}

export default Profile
