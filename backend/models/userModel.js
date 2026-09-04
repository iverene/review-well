import { prisma } from '../config/database.js'

const findById = async (id) => {
  return prisma.user.findUnique({ where: { id } })
}

const findByGoogleId = async (googleId) => {
  return prisma.user.findUnique({ where: { googleId } })
}

const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } })
}

const create = async (data) => {
  return prisma.user.create({ data })
}

const update = async (id, data) => {
  return prisma.user.update({ where: { id }, data })
}

const searchUsers = async (query, { take = 20, excludeId = null } = {}) => {
  const where = {
    ...(query && {
      OR: [
        { displayName: { contains: query, mode: 'insensitive' } },
        { email: { contains: query, mode: 'insensitive' } },
        { school: { contains: query, mode: 'insensitive' } },
      ],
    }),
    ...(excludeId && { id: { not: excludeId } }),
  }

  return prisma.user.findMany({
    where,
    select: {
      id: true,
      displayName: true,
      avatarUrl: true,
      school: true,
      program: true,
    },
    orderBy: { displayName: 'asc' },
    take,
  })
}

const getProfile = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      displayName: true,
      avatarUrl: true,
      school: true,
      program: true,
      major: true,
      yearLevel: true,
      createdAt: true,
      _count: {
        select: {
          reviewers: true,
          followers: true,
          follows: true,
        },
      },
    },
  })
}

export { findById, findByGoogleId, findByEmail, create, update, getProfile, searchUsers }
