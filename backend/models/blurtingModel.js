import { prisma } from '../config/database.js'

const create = async (data) => {
  return prisma.blurtingAttempt.create({ data })
}

const listByReviewerUser = async (reviewerId, userId) => {
  return prisma.blurtingAttempt.findMany({
    where: { reviewerId, userId },
    orderBy: { createdAt: 'desc' },
  })
}

const findById = async (id) => {
  return prisma.blurtingAttempt.findUnique({ where: { id } })
}

const setSelfRating = async (id, selfRating) => {
  return prisma.blurtingAttempt.update({ where: { id }, data: { selfRating } })
}

export { create, listByReviewerUser, findById, setSelfRating }
