import express from 'express'
import {
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
} from '../controllers/socialController.js'
import { requireAuth, optionalAuth } from '../middleware/auth.js'

const app = express.Router()

// Save routes
app.post('/reviewers/:reviewerId/save', requireAuth, saveReviewer)
app.delete('/reviewers/:reviewerId/save', requireAuth, unsaveReviewer)
app.get('/reviewers/:reviewerId/save', optionalAuth, getSaveStatus)
app.get('/saved', requireAuth, getSavedReviewers)

// Follow routes
app.post('/users/:userId/follow', requireAuth, followUser)
app.delete('/users/:userId/follow', requireAuth, unfollowUser)
app.get('/users/:userId/follow', optionalAuth, getFollowStatus)
app.get('/users/:userId/followers', requireAuth, getFollowers)
app.get('/users/:userId/following', requireAuth, getFollowing)

// Notification routes
app.get('/notifications', requireAuth, getNotifications)
app.put('/notifications/:notificationId/read', requireAuth, markNotificationRead)
app.put('/notifications/read-all', requireAuth, markAllNotificationsRead)
app.get('/notifications/unread-count', requireAuth, getUnreadCount)

export default app
