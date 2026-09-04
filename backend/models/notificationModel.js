import { prisma } from '../config/database.js'

const create = async (data) => {
  return prisma.notification.create({ data })
}

const findByRecipient = async (recipientId, { skip = 0, take = 20 } = {}) => {
  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { recipientId },
      include: {
        actor: {
          select: { id: true, displayName: true, avatarUrl: true },
        },
        reviewer: {
          select: { id: true, title: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.notification.count({ where: { recipientId } }),
  ])

  return { notifications, total }
}

const markAsRead = async (id) => {
  return prisma.notification.update({
    where: { id },
    data: { isRead: true },
  })
}

const markAllAsRead = async (recipientId) => {
  return prisma.notification.updateMany({
    where: { recipientId, isRead: false },
    data: { isRead: true },
  })
}

const countUnread = async (recipientId) => {
  return prisma.notification.count({
    where: { recipientId, isRead: false },
  })
}

const createSaveNotification = async (recipientId, actorId, reviewerId) => {
  // Don't notify self
  if (recipientId === actorId) return null

  return create({
    recipientId,
    actorId,
    actionType: 'save',
    reviewerId,
  })
}

const createNewReviewerNotification = async (recipientId, actorId, reviewerId) => {
  // Don't notify self
  if (recipientId === actorId) return null

  return create({
    recipientId,
    actorId,
    actionType: 'new_reviewer',
    reviewerId,
  })
}

const createFollowNotification = async (recipientId, actorId) => {
  // Don't notify self
  if (recipientId === actorId) return null

  return create({
    recipientId,
    actorId,
    actionType: 'follow',
    reviewerId: null,
  })
}

const createMany = async (rows) => {
  if (!rows.length) return { count: 0 }
  return prisma.notification.createMany({ data: rows })
}

export { create, createMany, findByRecipient, markAsRead, markAllAsRead, countUnread, createSaveNotification, createNewReviewerNotification, createFollowNotification }