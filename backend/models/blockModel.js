const { prisma } = require('../config/database')

const findByReviewer = async (reviewerId) => {
  return prisma.block.findMany({
    where: { reviewerId },
    orderBy: [{ columnIndex: 'asc' }, { sortOrder: 'asc' }],
  })
}

const findById = async (id) => {
  return prisma.block.findUnique({ where: { id } })
}

const create = async (data) => {
  return prisma.block.create({ data })
}

const createMany = async (data) => {
  return prisma.block.createMany({ data })
}

const update = async (id, data) => {
  return prisma.block.update({ where: { id }, data })
}

const remove = async (id) => {
  return prisma.block.delete({ where: { id } })
}

const removeAllByReviewer = async (reviewerId) => {
  return prisma.block.deleteMany({ where: { reviewerId } })
}

const reorder = async (reviewerId, blocks) => {
  return prisma.$transaction(
    blocks.map((block) =>
      prisma.block.update({
        where: { id: block.id },
        data: {
          columnIndex: block.columnIndex,
          sortOrder: block.sortOrder,
        },
      })
    )
  )
}

const getMaxSortOrder = async (reviewerId, columnIndex) => {
  const result = await prisma.block.aggregate({
    where: { reviewerId, columnIndex },
    _max: { sortOrder: true },
  })
  return result._max.sortOrder ?? -1
}

module.exports = {
  findByReviewer,
  findById,
  create,
  createMany,
  update,
  remove,
  removeAllByReviewer,
  reorder,
  getMaxSortOrder,
}
