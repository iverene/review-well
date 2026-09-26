import { prisma } from '../config/database.js'

const upsert = async (userId, { endpoint, keys }) => {
  const existing = await prisma.pushSubscription.findUnique({ where: { endpoint } })
  if (existing) {
    if (existing.userId === userId) return existing
    return prisma.pushSubscription.update({
      where: { endpoint },
      data: { userId, keys },
    })
  }
  return prisma.pushSubscription.create({ data: { userId, endpoint, keys } })
}

const removeByEndpoint = async (userId, endpoint) => {
  return prisma.pushSubscription.deleteMany({ where: { userId, endpoint } })
}

const listByUserIds = async (userIds) => {
  if (userIds.length === 0) return []
  return prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } })
}

const removeByEndpointGlobal = async (endpoint) => {
  return prisma.pushSubscription.deleteMany({ where: { endpoint } })
}

export { upsert, removeByEndpoint, listByUserIds, removeByEndpointGlobal }
