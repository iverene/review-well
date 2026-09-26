import webpush from 'web-push'

import * as pushSubscriptionModel from '../models/pushSubscriptionModel.js'
import * as userModel from '../models/userModel.js'
import * as reviewerModel from '../models/reviewerModel.js'

let configured = null

const isConfigured = () => {
  if (configured !== null) return configured
  const { VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT } = process.env
  configured = Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY)
  if (configured) {
    webpush.setVapidDetails(
      VAPID_SUBJECT || 'mailto:hello@reviewwell.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )
  }
  return configured
}

const formatPayload = ({ actionType, actorName, reviewerTitle, reviewerId }) => {
  switch (actionType) {
    case 'follow':
      return {
        title: 'New Follower',
        body: `${actorName} started following you.`,
        url: '/friends',
        tag: `follow-${actorName}`,
      }
    case 'save':
      return {
        title: 'Reviewer Saved',
        body: `${actorName} saved “${reviewerTitle || 'your reviewer'}”.`,
        url: reviewerId ? `/reviewer/${reviewerId}` : '/',
        tag: `save-${reviewerId || 'all'}`,
      }
    case 'new_reviewer':
      return {
        title: 'New Reviewer',
        body: `${actorName} published “${reviewerTitle || 'a new reviewer'}”.`,
        url: reviewerId ? `/reviewer/${reviewerId}` : '/',
        tag: `new-${reviewerId || 'all'}`,
      }
    default:
      return {
        title: 'Review Well',
        body: 'Something new in your study club.',
        url: '/notifications',
        tag: 'general',
      }
  }
}

// Best-effort fan-out: push failures (expired/gone subscriptions) prune the
// row and never fail the request that triggered them.
const sendToUsers = async (userIds, payload) => {
  if (!isConfigured() || userIds.length === 0) return { sent: 0 }
  const subscriptions = await pushSubscriptionModel.listByUserIds([...new Set(userIds)])
  let sent = 0
  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: sub.keys },
          JSON.stringify(formatPayload(payload))
        )
        sent += 1
      } catch (error) {
        if (error?.statusCode === 404 || error?.statusCode === 410) {
          await pushSubscriptionModel.removeByEndpointGlobal(sub.endpoint)
        }
      }
    })
  )
  return { sent }
}

const vapidPublicKey = () => process.env.VAPID_PUBLIC_KEY || null

// Fire-and-forget fan-out for social events. Resolves display names, sends
// formatted pushes, and never throws — callers must not await critically.
const notifyEvent = async ({ actionType, actorId, recipientIds, reviewerId = null }) => {
  try {
    if (!isConfigured()) return
    const recipients = [...new Set(recipientIds)].filter((id) => id && id !== actorId)
    if (recipients.length === 0) return
    const [actor, reviewer] = await Promise.all([
      userModel.findById(actorId).catch(() => null),
      reviewerId ? reviewerModel.findById(reviewerId).catch(() => null) : null,
    ])
    await sendToUsers(recipients, {
      actionType,
      actorName: actor?.displayName || 'Someone',
      reviewerTitle: reviewer?.title || null,
      reviewerId,
    })
  } catch (error) {
    console.error('Push fan-out error:', error)
  }
}

export { isConfigured, sendToUsers, formatPayload, notifyEvent, vapidPublicKey }
