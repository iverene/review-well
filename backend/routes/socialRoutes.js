const express = require('express')
const router = express.Router()
const {
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
} = require('../controllers/socialController')
const { requireAuth, optionalAuth } = require('../middleware/auth')

// Like routes
router.post('/reviewers/:reviewerId/like', requireAuth, likeReviewer)
router.delete('/reviewers/:reviewerId/like', requireAuth, unlikeReviewer)
router.get('/reviewers/:reviewerId/like', optionalAuth, getLikeStatus)

// Follow routes
router.post('/users/:userId/follow', requireAuth, followUser)
router.delete('/users/:userId/follow', requireAuth, unfollowUser)
router.get('/users/:userId/follow', optionalAuth, getFollowStatus)

// Notification routes
router.get('/notifications', requireAuth, getNotifications)
router.put('/notifications/:notificationId/read', requireAuth, markNotificationRead)
router.put('/notifications/read-all', requireAuth, markAllNotificationsRead)
router.get('/notifications/unread-count', requireAuth, getUnreadCount)

module.exports = router
