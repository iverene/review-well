import { prisma } from '../config/database.js'

// UTC day keys keep bucket math deterministic regardless of the
// server's local timezone.
const dayKey = (date) => new Date(date).toISOString().slice(0, 10)

const create = async (data) => {
  return prisma.pomodoroSession.create({ data })
}

const listCompletedByUser = async (userId) => {
  return prisma.pomodoroSession.findMany({
    where: { userId, completed: true },
    orderBy: { endedAt: 'desc' },
  })
}

const getDailyGoal = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { dailyFocusMinutes: true },
  })
  return user?.dailyFocusMinutes ?? 25
}

const setDailyGoal = async (userId, minutes) => {
  return prisma.user.update({
    where: { id: userId },
    data: { dailyFocusMinutes: minutes },
  })
}

export { dayKey, create, listCompletedByUser, getDailyGoal, setDailyGoal }
