import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockPrismaInstance } = vi.hoisted(() => ({
  mockPrismaInstance: {
    aiQuota: {
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}))

vi.mock('../../../config/database.js', () => ({ prisma: mockPrismaInstance }))

import { incrementUsage, incrementGradeUsage } from '../../../models/aiQuotaModel.js'

describe('AiQuota Model atomic increments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('increments generationsUsed atomically in a single UPDATE', async () => {
    mockPrismaInstance.aiQuota.findFirst.mockResolvedValue({ id: 'q1', generationsUsed: 2 })
    mockPrismaInstance.aiQuota.update.mockResolvedValue({})

    await incrementUsage('user-123')

    expect(mockPrismaInstance.aiQuota.update).toHaveBeenCalledWith({
      where: { id: 'q1' },
      data: { generationsUsed: { increment: 1 } },
    })
  })

  it('increments gradesUsed atomically in a single UPDATE', async () => {
    mockPrismaInstance.aiQuota.findFirst.mockResolvedValue({
      id: 'q1',
      gradesUsed: 3,
      gradesResetAt: new Date(),
    })
    mockPrismaInstance.aiQuota.update.mockResolvedValue({})

    await incrementGradeUsage('user-123')

    expect(mockPrismaInstance.aiQuota.update).toHaveBeenCalledWith({
      where: { id: 'q1' },
      data: { gradesUsed: { increment: 1 } },
    })
  })
})
