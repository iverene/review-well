import * as saveModel from '../models/saveModel.js'
import * as followModel from '../models/followModel.js'
import * as notificationModel from '../models/notificationModel.js'
import * as reviewerModel from '../models/reviewerModel.js'
import * as userModel from '../models/userModel.js'
import { notifyEvent } from '../services/pushService.js'
import { parsePagination } from '../utils/pagination.js'
import { delPrefix } from '../utils/cache.js'

// Save endpoints
const saveReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user.id

    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    // Private reviewers of other users cannot be saved (their content would
    // otherwise leak through the saved-reviewers list); drafts are invisible
    // everywhere, so non-owners get a 404 that confirms nothing.
    if (reviewer.visibility === 'private' && reviewer.authorId !== userId) {
      return res.status(403).json({ error: 'Not authorized to save this reviewer' })
    }
    if (reviewer.isDraft && reviewer.authorId !== userId) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    const existingSave = await saveModel.findByUserAndReviewer(userId, reviewerId)
    if (existingSave) {
      return res.status(400).json({ error: 'Already saved' })
    }

    try {
      await saveModel.create(userId, reviewerId)
    } catch (createError) {
      // Lost a race with another save request for the same pair.
      if (createError?.code === 'P2002') {
        return res.status(400).json({ error: 'Already saved' })
      }
      throw createError
    }
    await notificationModel.createSaveNotification(reviewer.authorId, userId, reviewerId)
    notifyEvent({ actionType: 'save', actorId: userId, recipientIds: [reviewer.authorId], reviewerId })
    delPrefix('social:')
    delPrefix('reviewers:')

    const saveCount = await saveModel.countByReviewer(reviewerId)

    res.json({ saved: true, saveCount })
  } catch (error) {
    console.error('Save error:', error)
    res.status(500).json({ error: 'Failed to save reviewer' })
  }
}

const unsaveReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user.id

    const existingSave = await saveModel.findByUserAndReviewer(userId, reviewerId)
    if (!existingSave) {
      return res.status(400).json({ error: 'Not saved' })
    }

    await saveModel.remove(userId, reviewerId)
    delPrefix('social:')
    delPrefix('reviewers:')

    const saveCount = await saveModel.countByReviewer(reviewerId)

    res.json({ saved: false, saveCount })
  } catch (error) {
    console.error('Unsave error:', error)
    res.status(500).json({ error: 'Failed to unsave reviewer' })
  }
}

const getSaveStatus = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user?.id

    const [saveCount, saved] = await Promise.all([
      saveModel.countByReviewer(reviewerId),
      userId ? saveModel.hasUserSaved(userId, reviewerId) : false,
    ])

    res.json({ saved, saveCount })
  } catch (error) {
    console.error('Get save status error:', error)
    res.status(500).json({ error: 'Failed to get save status' })
  }
}

const getSavedReviewers = async (req, res) => {
  try {
    const { page, skip, take } = parsePagination(req.query)
    const result = await saveModel.findByUser(req.user.id, { skip, take })

    res.json({
      reviewers: result.saves.map((save) => save.reviewer).filter(Boolean),
      pagination: {
        page,
        limit: take,
        total: result.total,
        hasMore: skip + result.saves.length < result.total,
      },
    })
  } catch (error) {
    console.error('Get saved reviewers error:', error)
    res.status(500).json({ error: 'Failed to get saved reviewers' })
  }
}

// Follow endpoints
const followUser = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params
    const followerId = req.user.id

    if (followerId === targetUserId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    const targetUser = await userModel.findById(targetUserId)
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' })
    }

    const existingFollow = await followModel.findByUsers(followerId, targetUserId)
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following' })
    }

    try {
      await followModel.create(followerId, targetUserId)
    } catch (createError) {
      // Lost a race with another follow request for the same pair.
      if (createError?.code === 'P2002') {
        return res.status(400).json({ error: 'Already following' })
      }
      throw createError
    }
    await notificationModel.createFollowNotification(targetUserId, followerId)
    notifyEvent({ actionType: 'follow', actorId: followerId, recipientIds: [targetUserId] })
    delPrefix('social:')
    delPrefix('profile:')

    const followerCount = await followModel.countFollowers(targetUserId)

    res.json({ following: true, followerCount })
  } catch (error) {
    console.error('Follow error:', error)
    res.status(500).json({ error: 'Failed to follow user' })
  }
}

const unfollowUser = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params
    const followerId = req.user.id

    const existingFollow = await followModel.findByUsers(followerId, targetUserId)
    if (!existingFollow) {
      return res.status(400).json({ error: 'Not following' })
    }

    await followModel.remove(followerId, targetUserId)
    delPrefix('social:')
    delPrefix('profile:')

    const followerCount = await followModel.countFollowers(targetUserId)

    res.json({ following: false, followerCount })
  } catch (error) {
    console.error('Unfollow error:', error)
    res.status(500).json({ error: 'Failed to unfollow user' })
  }
}

const getFollowStatus = async (req, res) => {
  try {
    const { userId: targetUserId } = req.params
    const followerId = req.user?.id

    const [followerCount, followingCount, following] = await Promise.all([
      followModel.countFollowers(targetUserId),
      followModel.countFollowing(targetUserId),
      followerId ? followModel.isFollowing(followerId, targetUserId) : false,
    ])

    res.json({ following, followerCount, followingCount })
  } catch (error) {
    console.error('Get follow status error:', error)
    res.status(500).json({ error: 'Failed to get follow status' })
  }
}

// Notification endpoints
const getNotifications = async (req, res) => {
  try {
    const { skip, take } = parsePagination(req.query)

    const result = await notificationModel.findByRecipient(req.user.id, { skip, take })
    const notifications = result.notifications || []

    const reviewerIds = [...new Set(
      notifications.map((notification) => notification.reviewerId).filter(Boolean)
    )]
    const followActorIds = [...new Set(
      notifications
        .filter((notification) => notification.actionType === 'follow')
        .map((notification) => notification.actorId)
        .filter(Boolean)
    )]

    const [savedIds, followedIds] = await Promise.all([
      saveModel.savedReviewerIdsFor(req.user.id, reviewerIds),
      followModel.followingIdsFor(req.user.id, followActorIds),
    ])
    const savedSet = savedIds || new Set()
    const followedSet = followedIds || new Set()

    const decorated = notifications.map((notification) => {
      const next = { ...notification }
      if (notification.reviewerId) {
        next.isSaved = savedSet.has(notification.reviewerId)
        next.saveCount = notification.reviewer?._count?.saves ?? 0
      }
      if (notification.actionType === 'follow' && notification.actorId) {
        next.isFollowing = followedSet.has(notification.actorId)
      }
      return next
    })

    res.json({
      notifications: decorated,
      total: result.total,
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({ error: 'Failed to get notifications' })
  }
}

const markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params

    const notification = await notificationModel.findById(notificationId)
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' })
    }
    if (notification.recipientId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this notification' })
    }

    await notificationModel.markAsRead(notificationId)

    res.json({ success: true })
  } catch (error) {
    console.error('Mark notification read error:', error)
    res.status(500).json({ error: 'Failed to mark notification as read' })
  }
}

const markAllNotificationsRead = async (req, res) => {
  try {
    await notificationModel.markAllAsRead(req.user.id)

    res.json({ success: true })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    res.status(500).json({ error: 'Failed to mark all notifications as read' })
  }
}

const getUnreadCount = async (req, res) => {
  try {
    const count = await notificationModel.countUnread(req.user.id)

    res.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({ error: 'Failed to get unread count' })
  }
}

const getFollowers = async (req, res) => {
  try {
    const { userId } = req.params
    const rows = await followModel.getFollowers(userId)
    const users = rows.map((row) => row.follower).filter(Boolean)
    const followingIds = await followModel.followingIdsFor(
      req.user?.id,
      users.map((user) => user.id)
    )
    const followingSet = followingIds || new Set()

    res.json({
      users: users.map((user) => ({ ...user, isFollowing: followingSet.has(user.id) })),
    })
  } catch (error) {
    console.error('Get followers error:', error)
    res.status(500).json({ error: 'Failed to get followers' })
  }
}

const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params
    const rows = await followModel.getFollowing(userId)
    const users = rows.map((row) => row.following).filter(Boolean)
    const followingIds = await followModel.followingIdsFor(
      req.user?.id,
      users.map((user) => user.id)
    )
    const followingSet = followingIds || new Set()

    res.json({
      users: users.map((user) => ({ ...user, isFollowing: followingSet.has(user.id) })),
    })
  } catch (error) {
    console.error('Get following error:', error)
    res.status(500).json({ error: 'Failed to get following' })
  }
}

export {
  saveReviewer,
  unsaveReviewer,
  getSaveStatus,
  getSavedReviewers,
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
}