import { prisma } from '../config/database.js'
import { TTL_30_SECONDS, TTL_60_SECONDS, remember } from '../utils/cache.js'

const findByUserAndReviewer = async (userId, reviewerId) => {
  return prisma.save.findUnique({
    where: {
      userId_reviewerId: { userId, reviewerId },
    },
  })
}

const create = async (userId, reviewerId) => {
  return prisma.save.create({
    data: { userId, reviewerId },
  })
}

const remove = async (userId, reviewerId) => {
  return prisma.save.delete({
    where: {
      userId_reviewerId: { userId, reviewerId },
    },
  })
}

const countByReviewer = async (reviewerId) => {
  return remember(`social:savecount:${reviewerId}`, TTL_30_SECONDS, () => prisma.save.count({
    where: { reviewerId },
  }))
}

const findByUser = async (userId) => {
  return remember(`social:saved:${userId}`, TTL_60_SECONDS, () => prisma.save.findMany({
    where: { userId },
    include: {
      reviewer: {
        select: {
          id: true,
          title: true,
          courseCode: true,
          visibility: true,
          user: { select: { id: true, displayName: true } },
          _count: { select: { saves: true } },
        },
      },
    },
  }))
}

const hasUserSaved = async (userId, reviewerId) => {
  const save = await findByUserAndReviewer(userId, reviewerId)
  return !!save
}

export { findByUserAndReviewer, create, remove, countByReviewer, findByUser, hasUserSaved }
