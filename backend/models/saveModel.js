import { prisma } from '../config/database.js'

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
  return prisma.save.count({
    where: { reviewerId },
  })
}

const findByUser = async (userId) => {
  return prisma.save.findMany({
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
  })
}

const hasUserSaved = async (userId, reviewerId) => {
  const save = await findByUserAndReviewer(userId, reviewerId)
  return !!save
}

export { findByUserAndReviewer, create, remove, countByReviewer, findByUser, hasUserSaved }
