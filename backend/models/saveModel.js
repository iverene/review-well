import { prisma } from '../config/database.js'
import { TTL_30_SECONDS, TTL_60_SECONDS, remember } from '../utils/cache.js'

const findByUserAndReviewer = async (userId, reviewerId) => {
  return prisma.save.findUnique({
    where: {
      userId_reviewerId: { userId, reviewerId },
    },
  })
}

const create = async (userId, reviewerId) => {
  return prisma.save.create({
    data: { userId, reviewerId },
  })
}

const remove = async (userId, reviewerId) => {
  return prisma.save.delete({
    where: {
      userId_reviewerId: { userId, reviewerId },
    },
  })
}

const countByReviewer = async (reviewerId) => {
  return remember(`social:savecount:${reviewerId}`, TTL_30_SECONDS, () => prisma.save.count({
    where: { reviewerId },
  }))
}

// A save outlives the reviewer's visibility: once the author makes it
// private (or it is a draft), it must drop out of other users' saved lists
// so its title and course never leak. The saver's own reviewers always stay.
const visibleSavesWhere = (userId) => ({
  userId,
  reviewer: {
    OR: [
      { visibility: { not: 'private' }, isDraft: false },
      { authorId: userId },
    ],
  },
})

const findByUser = async (userId, { skip = 0, take = 20 } = {}) => {
  return remember(`social:saved:${userId}:${skip}:${take}`, TTL_60_SECONDS, async () => {
    const where = visibleSavesWhere(userId)
    const [saves, total] = await Promise.all([
      prisma.save.findMany({
        where,
        include: {
          reviewer: {
            select: {
              id: true,
              title: true,
              courseCode: true,
              visibility: true,
              user: { select: { id: true, displayName: true } },
              _count: { select: { saves: true } },
            },
          },
        },
        // Saves carry no timestamp; without an explicit order Postgres may
        // return rows differently per page, duplicating or skipping items.
        orderBy: [{ reviewer: { createdAt: 'desc' } }, { reviewerId: 'asc' }],
        skip,
        take,
      }),
      prisma.save.count({ where }),
    ])

    return { saves, total }
  })
}

const hasUserSaved = async (userId, reviewerId) => {
  const save = await findByUserAndReviewer(userId, reviewerId)
  return !!save
}

const savedReviewerIdsFor = async (userId, reviewerIds = []) => {
  if (!userId || reviewerIds.length === 0) return new Set()
  const rows = await prisma.save.findMany({
    where: { userId, reviewerId: { in: reviewerIds } },
    select: { reviewerId: true },
  })
  return new Set(rows.map((row) => row.reviewerId))
}

export { findByUserAndReviewer, create, remove, countByReviewer, findByUser, hasUserSaved, savedReviewerIdsFor }
