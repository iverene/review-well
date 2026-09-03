import { prisma } from '../config/database.js'

const getQuota = async (userId) => {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setHours(0, 0, 0, 0)
  windowStart.setDate(windowStart.getDate() - 1) // Last 24 hours

  const quota = await prisma.aiQuota.findFirst({
    where: {
      userId,
      windowResetAt: { gte: windowStart },
    },
    orderBy: { windowResetAt: 'desc' },
  })

  return quota || { generationsUsed: 0, windowResetAt: windowStart }
}

const checkQuota = async (userId, limit = 50) => {
  const quota = await getQuota(userId)
  return quota.generationsUsed < limit
}

const incrementUsage = async (userId) => {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setHours(0, 0, 0, 0)

  const existingQuota = await prisma.aiQuota.findFirst({
    where: {
      userId,
      windowResetAt: { gte: windowStart },
    },
  })

  if (existingQuota) {
    return prisma.aiQuota.update({
      where: { id: existingQuota.id },
      data: { generationsUsed: existingQuota.generationsUsed + 1 },
    })
  } else {
    return prisma.aiQuota.create({
      data: {
        userId,
        generationsUsed: 1,
        windowResetAt: now,
      },
    })
  }
}

const getRemainingQuota = async (userId, limit = 50) => {
  const quota = await getQuota(userId)
  return Math.max(0, limit - quota.generationsUsed)
}

export { getQuota, checkQuota, incrementUsage, getRemainingQuota }