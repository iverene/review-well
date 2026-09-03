import * as likeModel from '../models/likeModel.js'
import * as followModel from '../models/followModel.js'
import * as notificationModel from '../models/notificationModel.js'
import * as reviewerModel from '../models/reviewerModel.js'

// Like endpoints
const likeReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user.id

    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    const existingLike = await likeModel.findByUserAndReviewer(userId, reviewerId)
    if (existingLike) {
      return res.status(400).json({ error: 'Already liked' })
    }

    await likeModel.create(userId, reviewerId)
    await notificationModel.createLikeNotification(reviewer.authorId, userId, reviewerId)

    const likeCount = await likeModel.countByReviewer(reviewerId)

    res.json({ liked: true, likeCount })
  } catch (error) {
    console.error('Like error:', error)
    res.status(500).json({ error: 'Failed to like reviewer' })
  }
}

const unlikeReviewer = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user.id

    const existingLike = await likeModel.findByUserAndReviewer(userId, reviewerId)
    if (!existingLike) {
      return res.status(400).json({ error: 'Not liked' })
    }

    await likeModel.remove(userId, reviewerId)

    const likeCount = await likeModel.countByReviewer(reviewerId)

    res.json({ liked: false, likeCount })
  } catch (error) {
    console.error('Unlike error:', error)
    res.status(500).json({ error: 'Failed to unlike reviewer' })
  }
}

const getLikeStatus = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const userId = req.user?.id

    const likeCount = await likeModel.countByReviewer(reviewerId)
    const liked = userId ? await likeModel.hasUserLiked(userId, reviewerId) : false

    res.json({ liked, likeCount })
  } catch (error) {
    console.error('Get like status error:', error)
    res.status(500).json({ error: 'Failed to get like status' })
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

export {
  likeReviewer,
  unlikeReviewer,
  getLikeStatus,
  followUser,
  unfollowUser,
  getFollowStatus,
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  getUnreadCount,
}