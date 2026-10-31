import { Link, useNavigate } from 'react-router-dom'

import FollowButton from '../social/FollowButton'
import SaveButton from '../social/SaveButton'
import Tag from '../common/Tag'

const NotificationItem = ({ notification, onMarkRead }) => {
  const navigate = useNavigate()
  const { actor, actionType, reviewer, isRead, createdAt } = notification

  const getActionText = () => {
    switch (actionType) {
      case 'save':
      case 'like':
        return 'saved your reviewer'
      case 'new_reviewer':
        return 'published a new reviewer'
      case 'follow':
        return 'started following you'
      default:
        return 'interacted with your content'
    }
  }

  const getTimeAgo = () => {
    const now = new Date()
    const date = new Date(createdAt)
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Every item opens its subject: the reviewer, otherwise the actor's profile.
  const target = reviewer?.id
    ? `/reviewer/${reviewer.id}`
    : actor?.id
      ? `/profile/${actor.id}`
      : null

  const markRead = () => {
    if (!isRead) onMarkRead(notification.id)
  }

  // The inner links are the keyboard path (and mark the item read); a
  // click anywhere else on the row is a mouse convenience. The row is not
  // itself a button, because it contains links and buttons.
  const followLink = (event) => {
    event.stopPropagation()
    markRead()
  }

  const handleRowClick = () => {
    markRead()
    if (target) navigate(target)
  }

  const initial = actor?.displayName?.charAt(0).toUpperCase() || 'U'

  return (
    <article
      className={`relative flex cursor-pointer items-start gap-3 rounded-club border-2 p-3.5 transition-colors duration-150 ${isRead ? 'border-stone bg-paper hover:bg-cream' : 'border-blush bg-blush/30 hover:bg-blush/40'}`}
      onClick={handleRowClick}
      aria-label={`${actor?.displayName || 'Someone'} ${getActionText()}${isRead ? '' : ', unread'}`}
    >
      {actor?.avatarUrl ? (
        <img src={actor.avatarUrl} alt="" className="h-10 w-10 shrink-0 rounded-full border-2 border-stone object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-stone bg-powder font-display text-lg font-bold text-ink" aria-hidden="true">
          {initial}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink">
          {actor?.id ? (
            <Link to={`/profile/${actor.id}`} className="font-extrabold hover:underline" onClick={followLink}>
              {actor.displayName}
            </Link>
          ) : (
            <span className="font-extrabold">{actor?.displayName || 'Someone'}</span>
          )}{' '}
          {getActionText()}
        </p>
        {reviewer && (
          reviewer.id ? (
            <Link
              to={`/reviewer/${reviewer.id}`}
              onClick={followLink}
              className="mt-1.5 inline-block max-w-full truncate rounded-full border border-butter bg-butter/60 px-2.5 py-0.5 text-xs font-bold text-ink hover:underline"
            >
              {reviewer.title}
            </Link>
          ) : (
            <span className="mt-1.5 inline-block max-w-full truncate rounded-full border border-butter bg-butter/60 px-2.5 py-0.5 text-xs font-bold text-ink">
              {reviewer.title}
            </span>
          )
        )}
        <p className="mt-1.5 flex items-center gap-2 text-xs font-semibold text-muted">
          {!isRead && <Tag tone="blush" className="uppercase tracking-wider">New</Tag>}
          {getTimeAgo()}
        </p>
      </div>

      <div className="shrink-0" onClick={(e) => { e.stopPropagation() }}>
        {actionType === 'follow' && actor?.id ? (
          <FollowButton userId={actor.id} initialFollowing={notification.isFollowing} />
        ) : reviewer?.id ? (
          <SaveButton
            reviewerId={reviewer.id}
            initialSaved={notification.isSaved}
            initialSaveCount={notification.saveCount ?? reviewer._count?.saves ?? 0}
          />
        ) : null}
      </div>
    </article>
  )
}

export default NotificationItem
