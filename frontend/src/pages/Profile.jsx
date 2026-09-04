import { useState, useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { Bookmark, GraduationCap, LibraryBig, Settings as SettingsIcon, UserPlus } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import FollowButton from '../components/social/FollowButton'
import FollowListModal from '../components/profile/FollowListModal'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { ProfileSkeleton } from '../components/common/Skeleton'

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
  const [followModal, setFollowModal] = useState(null)
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
    setFollowModal(null)
    fetchProfile().then((loaded) => {
      if (loaded) fetchLists(loaded)
    })
  }, [userId, fetchProfile, fetchLists])

  const handleFollowToggle = (isFollowing, count) => {
    setFollowing(isFollowing)
    if (typeof count === 'number') setFollowerCount(count)
    fetchProfile(true)
  }

  const handleCloseFollowModal = () => {
    setFollowModal(null)
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
    <div className="mx-auto max-w-4xl pb-10">
      {/* Profile header card */}
      <section className="rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8" aria-label="Profile">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="flex items-center gap-5">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-24 w-24 rounded-full border-2 border-stone object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-stone bg-blush font-display text-4xl font-bold text-ink" aria-hidden="true">
                {profile.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}
            <div>
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">
                {isOwnProfile ? 'Your study desk' : 'Study buddy'}
              </p>
              <h1 className="mt-1 font-display text-3xl font-bold text-ink">{profile.displayName}</h1>
              {isOwnProfile && profile.email && <p className="text-sm text-muted">{profile.email}</p>}
              {(profile.school || profile.program || profile.major || profile.yearLevel) && (
                <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                  <GraduationCap className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {[profile.school, profile.program, profile.major, profile.yearLevel].filter(Boolean).join(' • ')}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {isOwnProfile ? (
              <>
                <Link
                  to="/friends"
                  className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-butter px-4 py-2 text-sm font-extrabold text-ink hover:brightness-95"
                >
                  <UserPlus className="h-4 w-4" aria-hidden="true" /> Find friends
                </Link>
                <Link
                  to="/settings"
                  className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-stone"
                >
                  <SettingsIcon className="h-4 w-4" aria-hidden="true" /> Edit Profile
                </Link>
              </>
            ) : (
              <FollowButton
                userId={profile.id}
                initialFollowing={following}
                initialFollowerCount={followerCount}
                onToggle={handleFollowToggle}
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-2 border-t-2 border-stone pt-4 sm:gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('reviewers')}
            className="flex-1 rounded-soft px-3 py-2 text-center transition-colors hover:bg-powder"
            aria-label={`View reviewers, ${profile.reviewerCount || 0}`}
          >
            <span className="block font-display text-2xl font-bold text-ink">{profile.reviewerCount || 0}</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-muted">Reviewers</span>
          </button>
          <button
            type="button"
            onClick={() => setFollowModal('followers')}
            className="flex-1 rounded-soft px-3 py-2 text-center transition-colors hover:bg-powder"
            aria-label={`View followers, ${followerCount}`}
          >
            <span className="block font-display text-2xl font-bold text-ink">{followerCount}</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-muted">Followers</span>
          </button>
          <button
            type="button"
            onClick={() => setFollowModal('following')}
            className="flex-1 rounded-soft px-3 py-2 text-center transition-colors hover:bg-powder"
            aria-label={`View following, ${profile.followingCount || 0}`}
          >
            <span className="block font-display text-2xl font-bold text-ink">{profile.followingCount || 0}</span>
            <span className="text-xs font-extrabold uppercase tracking-widest text-muted">Following</span>
          </button>
        </div>

        {profile.bio && (
          <div className="mt-4 rounded-soft bg-mint/40 p-4">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted">About</h2>
            <p className="mt-1 text-sm leading-relaxed text-ink">{profile.bio}</p>
          </div>
        )}
      </section>

      {/* Tabs */}
      <div className="mt-6 flex gap-2 rounded-soft border-2 border-stone bg-paper p-1.5" role="tablist" aria-label="Profile collections">
        {tabs.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            onClick={() => setActiveTab(value)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-soft px-4 py-2.5 text-sm font-extrabold transition-colors ${activeTab === value ? 'border-2 border-accent bg-blush text-ink' : 'border-2 border-transparent text-muted hover:bg-powder hover:text-ink'}`}
          >
            <Icon className="h-4 w-4" aria-hidden="true" /> {label}
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
              {activeTab === 'saved' ? 'No saved reviewers yet' : isOwnProfile ? 'No reviewers yet' : 'No public reviewers yet'}
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

      {followModal && (
        <FollowListModal
          userId={profile.id}
          type={followModal}
          onClose={handleCloseFollowModal}
          onNavigate={handleCloseFollowModal}
        />
      )}
    </div>
  )
}

export default Profile
