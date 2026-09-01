const { prisma } = require('../config/database')

const findByReviewer = async (reviewerId) => {
  return prisma.reviewerBlock.findMany({
    where: { reviewerId },
    orderBy: [{ columnIndex: 'asc' }, { sortOrder: 'asc' }],
  })
}

const createMany = async (data) => {
  return prisma.reviewerBlock.createMany({ data })
}

const update = async (id, data) => {
  return prisma.reviewerBlock.update({ where: { id }, data })
}

const remove = async (id) => {
  return prisma.reviewerBlock.delete({ where: { id } })
}

const removeAllByReviewer = async (reviewerId) => {
  return prisma.reviewerBlock.deleteMany({ where: { reviewerId } })
}

module.exports = { findByReviewer, createMany, update, remove, removeAllByReviewer }