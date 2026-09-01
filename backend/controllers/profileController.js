const userModel = require('../models/userModel')
const reviewerModel = require('../models/reviewerModel')
const followModel = require('../models/followModel')

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

const updateAvatar = async (req, res) => {
  try {
    const userId = req.user.id
    const avatarUrl = req.file?.path || req.body.avatarUrl

    if (!avatarUrl) {
      return res.status(400).json({ error: 'No avatar provided' })
    }

    const user = await userModel.update(userId, { avatarUrl })
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

module.exports = { getProfile, updateProfile, updateAvatar, getMyProfile }
