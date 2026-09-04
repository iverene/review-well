import { prisma } from '../config/database.js'
import { TTL_30_SECONDS, TTL_60_SECONDS, del, delPrefix, remember } from '../utils/cache.js'

const findById = async (id) => {
  // Hot path: runs on every authenticated request via session deserialization
  return remember(`users:row:${id}`, TTL_60_SECONDS, () => prisma.user.findUnique({ where: { id } }))
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
  const user = await prisma.user.update({ where: { id }, data })
  // Self-bust: writers outside controllers (e.g. Google sign-in sync) go through here
  del(`users:row:${id}`)
  delPrefix('profile:')
  return user
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

  const key = `profile:search:${query.toLowerCase()}:${take}:${excludeId || '-'}`
  return remember(key, TTL_30_SECONDS, () => prisma.user.findMany({
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
  }))
}

const getProfile = async (id) => {
  return remember(`profile:${id}`, TTL_60_SECONDS, () => prisma.user.findUnique({
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
  }))
}

export { findById, findByGoogleId, findByEmail, create, update, getProfile, searchUsers }
