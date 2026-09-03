import { prisma } from '../config/database.js'

const findByUserAndReviewer = async (userId, reviewerId) => {
  return prisma.like.findUnique({
    where: {
      userId_reviewerId: { userId, reviewerId },
    },
  })
}

const create = async (userId, reviewerId) => {
  return prisma.like.create({
    data: { userId, reviewerId },
  })
}

const remove = async (userId, reviewerId) => {
  return prisma.like.delete({
    where: {
      userId_reviewerId: { userId, reviewerId },
    },
  })
}

const countByReviewer = async (reviewerId) => {
  return prisma.like.count({
    where: { reviewerId },
  })
}

const findByUser = async (userId) => {
  return prisma.like.findMany({
    where: { userId },
    include: {
      reviewer: {
        select: {
          id: true,
          title: true,
          courseCode: true,
          author: { select: { id: true, displayName: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

const hasUserLiked = async (userId, reviewerId) => {
  const like = await findByUserAndReviewer(userId, reviewerId)
  return !!like
}

export { findByUserAndReviewer, create, remove, countByReviewer, findByUser, hasUserLiked }