import { prisma } from '../config/database.js'

const getQuota = async (userId) => {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 7) // Rolling 7-day window

  const quota = await prisma.aiQuota.findFirst({
    where: {
      userId,
      windowResetAt: { gte: windowStart },
    },
    orderBy: { windowResetAt: 'desc' },
  })

  return quota || { generationsUsed: 0, windowResetAt: windowStart }
}

const checkQuota = async (userId, limit = 3) => {
  const quota = await getQuota(userId)
  return quota.generationsUsed < limit
}

const incrementUsage = async (userId) => {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 7) // Rolling 7-day window

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
        gradesResetAt: now,
      },
    })
  }
}

const getRemainingQuota = async (userId, limit = 3) => {
  const quota = await getQuota(userId)
  return Math.max(0, limit - quota.generationsUsed)
}

// Blurting AI grade bucket: 5 grades per rolling 7-day window per user,
// tracked via gradesUsed/gradesResetAt (mirrors the generation quota above).
const GRADE_LIMIT = 5

const getGradeQuota = async (userId) => {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 7) // Rolling 7-day window

  const quota = await prisma.aiQuota.findFirst({
    where: {
      userId,
      gradesResetAt: { gte: windowStart },
    },
    orderBy: { gradesResetAt: 'desc' },
  })

  return quota || { gradesUsed: 0, gradesResetAt: windowStart }
}

const checkGradeQuota = async (userId, limit = GRADE_LIMIT) => {
  const quota = await getGradeQuota(userId)
  return quota.gradesUsed < limit
}

const incrementGradeUsage = async (userId) => {
  const now = new Date()
  const windowStart = new Date(now)
  windowStart.setDate(windowStart.getDate() - 7) // Rolling 7-day window

  const latest = await prisma.aiQuota.findFirst({
    where: { userId },
    orderBy: { gradesResetAt: 'desc' },
  })

  if (latest && latest.gradesResetAt >= windowStart) {
    return prisma.aiQuota.update({
      where: { id: latest.id },
      data: { gradesUsed: latest.gradesUsed + 1 },
    })
  }

  if (latest) {
    return prisma.aiQuota.update({
      where: { id: latest.id },
      data: { gradesUsed: 1, gradesResetAt: now },
    })
  }

  return prisma.aiQuota.create({
    data: {
      userId,
      generationsUsed: 0,
      windowResetAt: now,
      gradesUsed: 1,
      gradesResetAt: now,
    },
  })
}

const getRemainingGrades = async (userId, limit = GRADE_LIMIT) => {
  const quota = await getGradeQuota(userId)
  return Math.max(0, limit - quota.gradesUsed)
}

export { getQuota, checkQuota, incrementUsage, getRemainingQuota, GRADE_LIMIT, getGradeQuota, checkGradeQuota, incrementGradeUsage, getRemainingGrades }