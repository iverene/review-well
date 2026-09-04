import { Link } from 'react-router-dom'

const NotificationItem = ({ notification, onMarkRead }) => {
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

  const handleOpen = () => {
    if (!isRead) onMarkRead(notification.id)
  }

  const body = (
    <>
      {/* Actor Avatar */}
      <div className="flex-shrink-0">
        {actor.avatarUrl ? (
          <img
            src={actor.avatarUrl}
            alt={actor.displayName}
            className="h-10 w-10 rounded-full"
          />
        ) : (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-paper">
            {actor.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-ink">
          <span className="font-medium">{actor.displayName}</span>{' '}
          {getActionText()}
        </p>
        {reviewer && (
          <span className="mt-1 block text-sm text-muted truncate">
            {reviewer.title}
          </span>
        )}
        <p className="mt-1 text-xs text-muted">{getTimeAgo()}</p>
      </div>

      {/* Unread indicator */}
      {!isRead && (
        <div className="flex-shrink-0">
          <div className="h-2 w-2 rounded-full bg-ink" />
        </div>
      )}
    </>
  )

  const className = `flex items-start gap-4 border-b border-stone p-4 transition-colors hover:bg-stone/30 ${
    !isRead ? 'bg-stone/10' : ''
  }`

  if (!target) {
    return (
      <div className={className} onClick={handleOpen}>
        {body}
      </div>
    )
  }

  return (
    <Link
      to={target}
      className={className}
      onClick={handleOpen}
      aria-label={`${actor.displayName} ${getActionText()}`}
    >
      {body}
    </Link>
  )
}

export default NotificationItem
