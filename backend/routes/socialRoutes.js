import express from 'express'
import {
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
} from '../controllers/socialController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const app = express.Router()

// Like routes
app.post('/reviewers/:reviewerId/like', requireAuth, likeReviewer)
app.delete('/reviewers/:reviewerId/like', requireAuth, unlikeReviewer)
app.get('/reviewers/:reviewerId/like', optionalAuth, getLikeStatus)

// Follow routes
app.post('/users/:userId/follow', requireAuth, followUser)
app.delete('/users/:userId/follow', requireAuth, unfollowUser)
app.get('/users/:userId/follow', optionalAuth, getFollowStatus)

// Notification routes
app.get('/notifications', requireAuth, getNotifications)
app.put('/notifications/:notificationId/read', requireAuth, markNotificationRead)
app.put('/notifications/read-all', requireAuth, markAllNotificationsRead)
app.get('/notifications/unread-count', requireAuth, getUnreadCount)

export default app