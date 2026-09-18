import { prisma } from '../config/database.js'

const findByReviewer = async (reviewerId) => {
  return prisma.flashcard.findMany({
    where: { reviewerId },
    orderBy: { sortOrder: 'asc' },
  })
}

const createMany = async (data) => {
  return prisma.flashcard.createMany({ data })
}

const removeAllByReviewer = async (reviewerId) => {
  return prisma.flashcard.deleteMany({ where: { reviewerId } })
}

export { findByReviewer, createMany, removeAllByReviewer }
