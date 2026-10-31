import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, Bookmark, LibraryBig, Pencil, Plus } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import FollowButton from '../components/social/FollowButton'
import Button from '../components/common/Button'
import Card from '../components/common/Card'
import EmptyState from '../components/common/EmptyState'
import Tabs, { tabIds } from '../components/common/Tabs'
import Tag from '../components/common/Tag'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { formatYearLevel } from '../utils/profile'
import { ProfileSkeleton, ReviewerGridSkeleton } from '../components/common/Skeleton'
import { cacheKey, fetchShared } from '../stores/queryCache'

const WEEKDAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const PAGE_SIZE = 20

const appendUnique = (previous, incoming) => {
  const next = [...previous]
  const seen = new Set(previous.map((item) => item.id))
  for (const item of incoming) {
    if (item && !seen.has(item.id)) {
      seen.add(item.id)
      next.push(item)
    }
  }
  return next
}

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

const VISIBILITY_TONES = { public: 'mint', unlisted: 'powder', private: 'neutral' }

const ReviewerTile = ({ reviewer, showVisibility }) => (
  <Card to={`/reviewer/${reviewer.id}`} className="flex flex-col">
    <div className="flex flex-wrap items-center gap-2">
      {reviewer.courseCode && <Tag mono>{reviewer.courseCode}</Tag>}
      {showVisibility && reviewer.visibility && (
        <Tag tone={VISIBILITY_TONES[reviewer.visibility] || 'neutral'} className="capitalize">{reviewer.visibility}</Tag>
      )}
    </div>
    <p className="mt-3 line-clamp-2 break-words font-display text-lg font-bold leading-snug text-ink">{reviewer.title}</p>
    <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-semibold text-muted">
      <Bookmark className="h-3.5 w-3.5" aria-hidden="true" />
      {reviewer._count?.saves || 0} saves
    </span>
  </Card>
)

const Stat = ({ value, label, to, ariaLabel }) => {
  const body = (
    <>
      <span className="block font-display text-xl font-bold text-ink">{value}</span>
      <span className="text-xs font-extrabold uppercase tracking-wider text-muted">{label}</span>
    </>
  )
  const classes = 'flex-1 rounded-soft px-2 py-2 text-center'
  return to
    ? <Link to={to} className={`${classes} transition-colors duration-150 hover:bg-cream`} aria-label={ariaLabel}>{body}</Link>
    : <div className={classes} aria-label={ariaLabel}>{body}</div>
}

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const { error: toastError } = useToast()
  const [profile, setProfile] = useState(null)
  const [reviewers, setReviewers] = useState([])
  const [savedReviewers, setSavedReviewers] = useState([])
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState('reviewers')
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState(0)
  const [reviewerPage, setReviewerPage] = useState(1)
  const [reviewerHasMore, setReviewerHasMore] = useState(false)
  const [savedPage, setSavedPage] = useState(1)
  const [savedHasMore, setSavedHasMore] = useState(false)
  const [loadingMore, setLoadingMore] = useState(null)

  const isOwnProfile = currentUser?.id === userId || !userId
  const profileId = userId || currentUser?.id

  const fetchProfile = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const url = userId ? `/api/profile/${userId}` : '/api/profile/me'
      const response = await fetchShared(`GET ${url}`, () => axios.get(url, { withCredentials: true }), { force: silent })
      const loaded = response.user
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

  const fetchLists = useCallback(async (loadedProfile, silent = false) => {
    const targetId = loadedProfile?.id || profileId
    if (!targetId) return
    setListLoading(true)
    try {
      const own = !userId || userId === currentUser?.id
      const reviewersUrl = own ? '/api/reviewers/my' : `/api/reviewers/author/${targetId}`
      const reviewersParams = { page: 1, limit: PAGE_SIZE }
      const savedParams = { page: 1, limit: PAGE_SIZE }
      const [reviewersRes, savedRes] = await Promise.all([
        fetchShared(
          cacheKey('GET', reviewersUrl, reviewersParams),
          () => axios.get(reviewersUrl, { params: reviewersParams, withCredentials: true }),
          { force: silent }
        ),
        own
          ? fetchShared(
            cacheKey('GET', '/api/social/saved', savedParams),
            () => axios.get('/api/social/saved', { params: savedParams, withCredentials: true }),
            { force: silent }
          )
          : Promise.resolve({ reviewers: [], pagination: { hasMore: false } }),
      ])
      setReviewers(reviewersRes.reviewers || [])
      setReviewerPage(1)
      setReviewerHasMore(!!reviewersRes.pagination?.hasMore)
      setSavedReviewers(savedRes.reviewers || [])
      setSavedPage(1)
      setSavedHasMore(!!savedRes.pagination?.hasMore)
    } catch (err) {
      console.error('Failed to fetch profile lists:', err)
      setError(getApiErrorMessage(err, 'Unable to load reviewers.'))
    } finally {
      setListLoading(false)
    }
  }, [userId, currentUser?.id, profileId])

  useEffect(() => {
    setActiveTab('reviewers')
    setReviewers([])
    setSavedReviewers([])
    setReviewerPage(1)
    setReviewerHasMore(false)
    setSavedPage(1)
    setSavedHasMore(false)
    setLoadingMore(null)
    // The profile id is already known (URL or session), so the lists load
    // alongside the profile instead of waiting for it.
    fetchProfile()
    fetchLists(null, false)
  }, [userId, fetchProfile, fetchLists])

  const loadMore = async (tab) => {
    const own = !userId || userId === currentUser?.id
    const isSaved = tab === 'saved'
    if (loadingMore || (isSaved && !own)) return

    const targetId = profile?.id || profileId
    if (!targetId) return

    const nextPage = (isSaved ? savedPage : reviewerPage) + 1
    const url = isSaved
      ? '/api/social/saved'
      : own ? '/api/reviewers/my' : `/api/reviewers/author/${targetId}`
    const params = { page: nextPage, limit: PAGE_SIZE }

    setLoadingMore(tab)
    try {
      const response = await fetchShared(
        cacheKey('GET', url, params),
        () => axios.get(url, { params, withCredentials: true })
      )
      const incoming = response.reviewers || []
      const hasMore = !!response.pagination?.hasMore

      if (isSaved) {
        setSavedReviewers((previous) => appendUnique(previous, incoming))
        setSavedPage(nextPage)
        setSavedHasMore(hasMore)
      } else {
        setReviewers((previous) => appendUnique(previous, incoming))
        setReviewerPage(nextPage)
        setReviewerHasMore(hasMore)
      }
    } catch (err) {
      toastError(getApiErrorMessage(err, 'Unable to load more reviewers.'))
    } finally {
      setLoadingMore(null)
    }
  }

  const handleFollowToggle = (isFollowing, count) => {
    setFollowing(isFollowing)
    if (typeof count === 'number') setFollowerCount(count)
    fetchProfile(true)
  }

  if (loading) return <ProfileSkeleton />

  if (error || !profile) {
    return (
      <div className="mx-auto max-w-xl py-10">
        <EmptyState
          title="We couldn’t open this profile"
          action={<Button to="/"><ArrowLeft className="h-4 w-4" aria-hidden="true" /> Go back home</Button>}
        >
          <p role="alert">{error || 'Profile not found'}</p>
        </EmptyState>
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
  const visibleHasMore = activeTab === 'saved' ? savedHasMore : reviewerHasMore
  const panelIds = tabIds('profile', activeTab)
  const details = [profile.program, profile.major, formatYearLevel(profile.yearLevel)].filter(Boolean).join(' · ')

  return (
    <PageContainer>
      <Card className="p-5 sm:p-6" role="region" aria-label="Profile">
        <div className="flex items-start gap-4">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.displayName}
              className="h-16 w-16 shrink-0 rounded-full border-2 border-stone object-cover md:h-20 md:w-20"
            />
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2 border-stone bg-blush font-display text-2xl font-bold text-ink md:h-20 md:w-20" aria-hidden="true">
              {profile.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h1 className="break-words font-display text-2xl font-bold leading-tight text-ink md:text-3xl">{profile.displayName}</h1>
            {(profile.school || details) && (
              <div className="mt-1 space-y-0.5" aria-label="School information">
                {profile.school && <p className="text-sm font-bold text-ink">{profile.school}</p>}
                {details && <p className="text-sm text-muted">{details}</p>}
              </div>
            )}
          </div>
          {isOwnProfile && (
            <Button
              to="/settings/account"
              variant="quiet"
              size="icon"
              aria-label="Edit account"
              title="Edit account"
            >
              <Pencil className="h-5 w-5" aria-hidden="true" />
            </Button>
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t-2 border-dashed border-stone pt-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 gap-1">
            <Stat value={profile.reviewerCount || 0} label="Reviewers" ariaLabel={`${profile.reviewerCount || 0} reviewers`} />
            <Stat value={followerCount} label="Followers" to={`/profile/${profile.id}/followers`} ariaLabel={`View followers, ${followerCount}`} />
            <Stat value={profile.followingCount || 0} label="Following" to={`/profile/${profile.id}/following`} ariaLabel={`View following, ${profile.followingCount || 0}`} />
          </div>
          {!isOwnProfile && (
            <FollowButton
              userId={profile.id}
              initialFollowing={following}
              initialFollowerCount={followerCount}
              onToggle={handleFollowToggle}
            />
          )}
        </div>
        {isOwnProfile && SHOW_FOCUS_STATS && <FocusStats />}
      </Card>

      <Tabs
        label="Profile collections"
        idBase="profile"
        tabs={tabs}
        value={activeTab}
        onChange={setActiveTab}
        className="mt-6"
      />

      <div className="mt-4" role="tabpanel" id={panelIds.panel} aria-labelledby={panelIds.tab}>
        {listLoading ? (
          <ReviewerGridSkeleton count={2} />
        ) : visibleReviewers.length === 0 ? (
          <EmptyState
            title={activeTab === 'saved' ? 'No Saved Reviewers Yet' : isOwnProfile ? 'No Reviewers Yet' : 'No Public Reviewers Yet'}
            action={isOwnProfile && activeTab === 'reviewers' && (
              <Button to="/create" variant="primary"><Plus className="h-4 w-4" aria-hidden="true" /> Create a reviewer</Button>
            )}
          >
            {activeTab === 'saved'
              ? 'Tap the bookmark on any reviewer to keep it here.'
              : isOwnProfile ? 'Create your first study guide to get started.' : 'Check back once they share something.'}
          </EmptyState>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {visibleReviewers.map((reviewer) => (
              <ReviewerTile key={reviewer.id} reviewer={reviewer} showVisibility={isOwnProfile} />
            ))}
          </div>
        )}

        {visibleHasMore && (
          <div className="mt-5 flex justify-center">
            <Button onClick={() => loadMore(activeTab)} disabled={loadingMore === activeTab}>
              {loadingMore === activeTab
                ? 'Loading…'
                : activeTab === 'saved'
                  ? 'Load more saved reviewers'
                  : 'Load more reviewers'}
            </Button>
          </div>
        )}
      </div>
    </PageContainer>
  )
}

// Remount per profile so a slow response for the previous profile can never
// land on the next one (its setState calls go to the unmounted instance).
const ProfileRoute = () => {
  const { userId } = useParams()
  return <Profile key={userId || 'me'} />
}

export default ProfileRoute
