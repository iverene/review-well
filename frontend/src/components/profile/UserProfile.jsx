import { Link } from 'react-router-dom'
import FollowButton from '../social/FollowButton'

const UserProfile = ({ user, showFollowButton = true }) => {
  return (
    <div className="flex items-center gap-4">
      {/* Avatar */}
      <Link to={`/profile/${user.id}`}>
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.displayName}
            className="h-12 w-12 rounded-full border border-stone"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ink text-lg font-bold text-paper">
            {user.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </Link>

      {/* User Info */}
      <div className="flex-1 min-w-0">
        <Link
          to={`/profile/${user.id}`}
          className="block truncate font-medium text-ink hover:underline"
        >
          {user.displayName}
        </Link>
        {user.school && (
          <p className="truncate text-sm text-muted">
            {user.school}
            {user.program && ` • ${user.program}`}
          </p>
        )}
      </div>

      {/* Follow Button */}
      {showFollowButton && (
        <FollowButton
          userId={user.id}
          initialFollowing={user.isFollowing}
          initialFollowerCount={user.followerCount}
        />
      )}
    </div>
  )
}

export default UserProfile
