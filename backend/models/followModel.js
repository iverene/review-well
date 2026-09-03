import { prisma } from '../config/database.js'

const findByUsers = async (followerId, followingId) => {
  return prisma.follow.findUnique({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  })
}

const create = async (followerId, followingId) => {
  return prisma.follow.create({
    data: { followerId, followingId },
  })
}

const remove = async (followerId, followingId) => {
  return prisma.follow.delete({
    where: {
      followerId_followingId: { followerId, followingId },
    },
  })
}

const getFollowers = async (userId) => {
  return prisma.follow.findMany({
    where: { followingId: userId },
    include: {
      follower: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          school: true,
          program: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const getFollowing = async (userId) => {
  return prisma.follow.findMany({
    where: { followerId: userId },
    include: {
      following: {
        select: {
          id: true,
          displayName: true,
          avatarUrl: true,
          school: true,
          program: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const countFollowers = async (userId) => {
  return prisma.follow.count({
    where: { followingId: userId },
  })
}

const countFollowing = async (userId) => {
  return prisma.follow.count({
    where: { followerId: userId },
  })
}

const isFollowing = async (followerId, followingId) => {
  const follow = await findByUsers(followerId, followingId)
  return !!follow
}

export { findByUsers, create, remove, getFollowers, getFollowing, countFollowers, countFollowing, isFollowing }