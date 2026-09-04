import * as userModel from '../models/userModel.js'
import * as reviewerModel from '../models/reviewerModel.js'
import * as followModel from '../models/followModel.js'
import { createStorageAdapter } from '../services/adapters/storage.js'

const searchUsers = async (req, res) => {
  try {
    const { q = '', limit = 20 } = req.query
    const take = Math.min(parseInt(limit) || 20, 50)

    const users = await userModel.searchUsers(q.trim(), { take, excludeId: req.user.id })

    const usersWithFollow = await Promise.all(
      users.map(async (user) => ({
        ...user,
        isFollowing: await followModel.isFollowing(req.user.id, user.id),
      }))
    )

    res.json({ users: usersWithFollow })
  } catch (error) {
    console.error('Search users error:', error)
    res.status(500).json({ error: 'Failed to search users' })
  }
}

const getProfile = async (req, res) => {
  try {
    const { userId } = req.params
    const currentUserId = req.user?.id

    const user = await userModel.getProfile(userId)
    if (!user) {
      return res.status(404).json({ error: 'User not found' })
    }

    // Get additional stats
    const [reviewerCount, followerCount, followingCount] = await Promise.all([
      reviewerModel.count({ authorId: userId }),
      followModel.countFollowers(userId),
      followModel.countFollowing(userId),
    ])

    // Check if current user is following this user
    let isFollowing = false
    if (currentUserId && currentUserId !== userId) {
      isFollowing = await followModel.isFollowing(currentUserId, userId)
    }

    res.json({
      user: {
        ...user,
        reviewerCount,
        followerCount,
        followingCount,
        isFollowing,
      },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
}

const updateProfile = async (req, res) => {
  try {
    const { displayName, school, program, major, yearLevel } = req.body
    const userId = req.user.id

    const updates = {}
    if (displayName !== undefined) updates.displayName = displayName
    if (school !== undefined) updates.school = school
    if (program !== undefined) updates.program = program
    if (major !== undefined) updates.major = major
    if (yearLevel !== undefined) updates.yearLevel = yearLevel

    const user = await userModel.update(userId, updates)
    const profile = await userModel.getProfile(userId)

    res.json({ user: profile })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
}

const AVATAR_EXTENSIONS = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id

    // URL-based avatar (e.g. keep an existing one)
    if (!req.file && req.body.avatarUrl) {
      await userModel.update(userId, { avatarUrl: req.body.avatarUrl })
      const profile = await userModel.getProfile(userId)
      return res.json({ user: profile })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No avatar provided' })
    }

    const storage = createStorageAdapter()
    const extension = AVATAR_EXTENSIONS[req.file.mimetype] || 'jpg'
    const storagePath = `avatars/${userId}/${Date.now()}.${extension}`

    const { error: uploadError } = await storage.upload(req.file.buffer, storagePath, req.file.mimetype)
    if (uploadError) {
      return res.status(503).json({ error: 'Avatar storage is not configured. Please try again later.' })
    }

    const { data } = storage.getPublicUrl(storagePath)
    const avatarUrl = data?.publicUrl
    if (!avatarUrl) {
      return res.status(500).json({ error: 'Failed to update avatar' })
    }

    await userModel.update(userId, { avatarUrl })
    const profile = await userModel.getProfile(userId)

    res.json({ user: profile })
  } catch (error) {
    console.error('Update avatar error:', error)
    res.status(500).json({ error: 'Failed to update avatar' })
  }
}

const getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id
    const profile = await userModel.getProfile(userId)

    const [reviewerCount, followerCount, followingCount] = await Promise.all([
      reviewerModel.count({ authorId: userId }),
      followModel.countFollowers(userId),
      followModel.countFollowing(userId),
    ])

    res.json({
      user: {
        ...profile,
        reviewerCount,
        followerCount,
        followingCount,
      },
    })
  } catch (error) {
    console.error('Get my profile error:', error)
    res.status(500).json({ error: 'Failed to get profile' })
  }
}

export { getProfile, updateProfile, updateAvatar, getMyProfile, searchUsers }