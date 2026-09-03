import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import FollowButton from '../components/social/FollowButton'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const Profile = () => {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const isOwnProfile = currentUser?.id === userId || !userId

  useEffect(() => {
    fetchProfile()
  }, [userId])

  const fetchProfile = async () => {
    try {
      setLoading(true)
      const url = userId ? `/api/profile/${userId}` : '/api/profile/me'
      const response = await axios.get(url, { withCredentials: true })
      setProfile(response.data.user)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(getApiErrorMessage(err, 'Unable to load this profile.'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-muted">Loading profile...</div>
      </div>
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

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Profile Header */}
        <div className="mb-8 flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="h-24 w-24 rounded-full border-2 border-stone"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-stone bg-ink text-3xl font-bold text-paper">
                {profile.displayName?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            {/* User Info */}
            <div>
              <h1 className="text-2xl font-bold text-ink">{profile.displayName}</h1>
              <p className="text-muted">{profile.email}</p>
              {profile.school && (
                <p className="mt-1 text-sm text-muted">
                  {profile.school}
                  {profile.program && ` • ${profile.program}`}
                  {profile.major && ` • ${profile.major}`}
                  {profile.yearLevel && ` • ${profile.yearLevel}`}
                </p>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {isOwnProfile ? (
              <Link
                to="/settings"
                className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone"
              >
                Edit Profile
              </Link>
            ) : (
              <FollowButton
                userId={profile.id}
                initialFollowing={profile.isFollowing}
                initialFollowerCount={profile.followerCount}
              />
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 flex gap-8 border-b border-stone pb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-ink">{profile.reviewerCount}</div>
            <div className="text-sm text-muted">Reviewers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-ink">{profile.followerCount}</div>
            <div className="text-sm text-muted">Followers</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-ink">{profile.followingCount}</div>
            <div className="text-sm text-muted">Following</div>
          </div>
        </div>

        {/* Bio/About */}
        {profile.bio && (
          <div className="mb-8">
            <h2 className="mb-2 text-lg font-semibold text-ink">About</h2>
            <p className="text-muted">{profile.bio}</p>
          </div>
        )}

        {/* Recent Reviewers placeholder */}
        <div>
          <h2 className="mb-4 text-lg font-semibold text-ink">Recent Reviewers</h2>
          <div className="rounded border border-stone p-8 text-center text-muted">
            Reviewers will be displayed here
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
