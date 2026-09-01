const { prisma } = require('../config/database')

const findPublic = async ({ skip = 0, take = 20 } = {}) => {
  return prisma.reviewer.findMany({
    where: { visibility: 'public', isDraft: false },
    include: { author: { select: { displayName: true, avatarUrl: true } } },
    orderBy: { updatedAt: 'desc' },
    skip,
    take,
  })
}

const findByAuthor = async (authorId) => {
  return prisma.reviewer.findMany({
    where: { authorId },
    orderBy: { updatedAt: 'desc' },
  })
}

const findById = async (id) => {
  return prisma.reviewer.findUnique({
    where: { id },
    include: {
      author: { select: { displayName: true, avatarUrl: true } },
      blocks: { orderBy: { sortOrder: 'asc' } },
    },
  })
}

const create = async (data) => {
  return prisma.reviewer.create({ data })
}

const update = async (id, data) => {
  return prisma.reviewer.update({ where: { id }, data })
}

const remove = async (id) => {
  return prisma.reviewer.delete({ where: { id } })
}

module.exports = { findPublic, findByAuthor, findById, create, update, remove }