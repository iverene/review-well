import { prisma } from '../config/database.js'

// UTC day keys keep streak/bucket math deterministic regardless of the
// server's local timezone.
const dayKey = (date) => new Date(date).toISOString().slice(0, 10)

// Counts consecutive days with >= 1 completed focus session. Starts from
// today; when today is empty but yesterday has sessions the streak is still
// alive, otherwise it is broken (0).
const streakDays = (dayKeys, refDate = new Date()) => {
  const days = new Set(dayKeys)
  if (days.size === 0) return 0
  const ref = new Date(refDate)
  let cursor = dayKey(ref)
  if (!days.has(cursor)) {
    ref.setUTCDate(ref.getUTCDate() - 1)
    cursor = dayKey(ref)
    if (!days.has(cursor)) return 0
  }
  let streak = 0
  while (days.has(cursor)) {
    streak += 1
    ref.setUTCDate(ref.getUTCDate() - 1)
    cursor = dayKey(ref)
  }
  return streak
}

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

export { dayKey, streakDays, create, listCompletedByUser, getDailyGoal, setDailyGoal }
