import * as saveModel from '../models/saveModel.js'
import * as followModel from '../models/followModel.js'
import * as notificationModel from '../models/notificationModel.js'
import * as reviewerModel from '../models/reviewerModel.js'

// Save endpoints
const saveReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user.id

    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    const existingSave = await saveModel.findByUserAndReviewer(userId, reviewerId)
    if (existingSave) {
      return res.status(400).json({ error: 'Already saved' })
    }

    await saveModel.create(userId, reviewerId)
    await notificationModel.createSaveNotification(reviewer.authorId, userId, reviewerId)

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

    const saveCount = await saveModel.countByReviewer(reviewerId)
    const saved = userId ? await saveModel.hasUserSaved(userId, reviewerId) : false

    res.json({ saved, saveCount })
  } catch (error) {
    console.error('Get save status error:', error)
    res.status(500).json({ error: 'Failed to get save status' })
  }
}

const getSavedReviewers = async (req, res) => {
  try {
    const saves = await saveModel.findByUser(req.user.id)

    res.json({
      reviewers: saves.map((save) => save.reviewer).filter(Boolean),
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

    const existingFollow = await followModel.findByUsers(followerId, targetUserId)
    if (existingFollow) {
      return res.status(400).json({ error: 'Already following' })
    }

    await followModel.create(followerId, targetUserId)
    await notificationModel.createFollowNotification(targetUserId, followerId)

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

    const followerCount = await followModel.countFollowers(targetUserId)
    const followingCount = await followModel.countFollowing(targetUserId)
    const following = followerId ? await followModel.isFollowing(followerId, targetUserId) : false

    res.json({ following, followerCount, followingCount })
  } catch (error) {
    console.error('Get follow status error:', error)
    res.status(500).json({ error: 'Failed to get follow status' })
  }
}

// Notification endpoints
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const result = await notificationModel.findByRecipient(req.user.id, { skip, take })

    res.json({
      notifications: result.notifications,
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

    res.json({ users: rows.map((row) => row.follower).filter(Boolean) })
  } catch (error) {
    console.error('Get followers error:', error)
    res.status(500).json({ error: 'Failed to get followers' })
  }
}

const getFollowing = async (req, res) => {
  try {
    const { userId } = req.params
    const rows = await followModel.getFollowing(userId)

    res.json({ users: rows.map((row) => row.following).filter(Boolean) })
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