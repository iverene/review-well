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

const findCardById = async (id) => {
  return prisma.flashcard.findUnique({ where: { id } })
}

const createCard = async (data) => {
  return prisma.flashcard.create({ data })
}

const setKnown = async (id, known) => {
  return prisma.flashcard.update({ where: { id }, data: { known } })
}

const updateCard = async (id, data) => {
  return prisma.flashcard.update({ where: { id }, data })
}

const removeCard = async (id) => {
  return prisma.flashcard.delete({ where: { id } })
}

export { findByReviewer, createMany, removeAllByReviewer, findCardById, createCard, setKnown, updateCard, removeCard }
