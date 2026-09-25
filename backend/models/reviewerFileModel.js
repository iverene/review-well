import { prisma } from '../config/database.js'

const findByReviewerId = async (reviewerId) => {
  return prisma.reviewerFile.findFirst({
    where: { reviewerId },
    orderBy: { version: 'desc' },
  })
}

const create = async (data) => {
  return prisma.reviewerFile.create({ data })
}

const bumpVersion = async (id, data) => {
  return prisma.reviewerFile.update({
    where: { id },
    data,
  })
}

const removeByReviewerId = async (reviewerId) => {
  return prisma.reviewerFile.deleteMany({ where: { reviewerId } })
}

export { findByReviewerId, create, bumpVersion, removeByReviewerId }
