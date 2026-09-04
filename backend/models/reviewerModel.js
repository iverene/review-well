import { prisma } from '../config/database.js'

const findPublic = async ({ skip = 0, take = 20, search = '' } = {}) => {
  const where = {
    visibility: 'public',
    isDraft: false,
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { courseCode: { contains: search, mode: 'insensitive' } },
        { courseDescription: { contains: search, mode: 'insensitive' } },
      ],
    }),
  }

  const [reviewers, total] = await Promise.all([
    prisma.reviewer.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { saves: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.reviewer.count({ where }),
  ])

  return {
    reviewers,
    total,
    hasMore: skip + take < total,
  }
}

const findPublicByAuthor = async (authorId, { skip = 0, take = 50 } = {}) => {
  const where = { authorId, visibility: 'public', isDraft: false }
  const [reviewers, total] = await Promise.all([
    prisma.reviewer.findMany({
      where,
      include: {
        user: { select: { id: true, displayName: true, avatarUrl: true } },
        _count: { select: { saves: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.reviewer.count({ where }),
  ])

  return {
    reviewers,
    total,
    hasMore: skip + take < total,
  }
}

const findByAuthor = async (authorId, { skip = 0, take = 50 } = {}) => {
  const [reviewers, total] = await Promise.all([
    prisma.reviewer.findMany({
      where: { authorId },
      include: {
        _count: { select: { saves: true } },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    }),
    prisma.reviewer.count({ where: { authorId } }),
  ])

  return {
    reviewers,
    total,
    hasMore: skip + take < total,
  }
}

const findById = async (id) => {
  return prisma.reviewer.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
      blocks: { orderBy: [{ columnIndex: 'asc' }, { sortOrder: 'asc' }] },
      _count: { select: { saves: true } },
    },
  })
}

const create = async (data) => {
  return prisma.reviewer.create({
    data,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  })
}

const update = async (id, data) => {
  return prisma.reviewer.update({
    where: { id },
    data,
    include: {
      user: { select: { id: true, displayName: true, avatarUrl: true } },
    },
  })
}

const remove = async (id) => {
  return prisma.reviewer.delete({ where: { id } })
}

const count = async (where = {}) => {
  return prisma.reviewer.count({ where })
}

export { findPublic, findPublicByAuthor, findByAuthor, findById, create, update, remove, count }