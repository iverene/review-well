import { Link, useNavigate } from 'react-router-dom'

import FollowButton from '../social/FollowButton'
import SaveButton from '../social/SaveButton'

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
  // Row navigation lives on the inner actor/reviewer links; clicking the
  // row body opens the subject too. Action buttons stop propagation so
  // toggling never navigates.
  const target = reviewer?.id
    ? `/reviewer/${reviewer.id}`
    : actor?.id
      ? `/profile/${actor.id}`
      : null

  const body = (
    <>
      {/* Actor Avatar */}
      <div className="flex-shrink-0">
        {actor.avatarUrl ? (
          <img
            src={actor.avatarUrl}
            alt={actor.displayName}
            className="h-12 w-12 border-2 rounded-full border-stone object-cover"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center border-2 border-stone bg-powder font-display text-lg font-bold text-ink">
            {actor.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink">
          {actor?.id ? (
            <Link to={`/profile/${actor.id}`} className="font-extrabold hover:underline" onClick={(e) => e.stopPropagation()}>
              {actor.displayName}
            </Link>
          ) : (
            <span className="font-extrabold">{actor.displayName}</span>
          )}{' '}
          {getActionText()}
        </p>
        {reviewer && (
          reviewer.id ? (
            <Link
              to={`/reviewer/${reviewer.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-1.5 inline-block max-w-full truncate bg-butter/60 px-2.5 py-0.5 text-xs font-bold text-ink hover:underline"
            >
              {reviewer.title}
            </Link>
          ) : (
            <span className="mt-1.5 inline-block max-w-full truncate bg-butter/60 px-2.5 py-0.5 text-xs font-bold text-ink">
              {reviewer.title}
            </span>
          )
        )}
        <p className="mt-1.5 text-xs font-semibold text-muted">{getTimeAgo()}</p>
      </div>

      {/* Applicable action */}
      <div className="flex shrink-0 flex-col items-end gap-2" onClick={(e) => { e.preventDefault(); e.stopPropagation() }}>
        {actionType === 'follow' && actor?.id ? (
          <FollowButton userId={actor.id} />
        ) : reviewer?.id ? (
          <SaveButton reviewerId={reviewer.id} />
        ) : null}
        {!isRead && (
          <span className="inline-flex items-center gap-1.5">
            <span className="bg-accent px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-widest text-paper">New</span>
            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden="true" />
          </span>
        )}
      </div>
    </>
  )

  const className = `flex items-start gap-3 border-b border-stone/70 px-1 py-3.5 transition-colors  ${
    !isRead ? 'bg-blush/20' : ''
  }`

  // Row navigation lives on the inner actor/reviewer links; clicking the
  // row body opens the subject too. Action buttons stop propagation so
  // toggling never navigates.
  const handleRowClick = () => {
    if (!isRead) onMarkRead(notification.id)
    if (target) navigate(target)
  }

  return (
    <div
      className={`${className} cursor-pointer`}
      onClick={handleRowClick}
      role="button"
      tabIndex={0}
      aria-label={`${actor.displayName} ${getActionText()}`}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') handleRowClick()
      }}
    >
      {body}
    </div>
  )
}

export default NotificationItem
