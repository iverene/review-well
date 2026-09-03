import { vi } from 'vitest'

process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/reviewwell_test'
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
process.env.SESSION_SECRET = 'test-session-secret'
process.env.FRONTEND_URL = 'http://localhost:5173'
process.env.BACKEND_URL = 'http://localhost:3000'
process.env.OPENROUTER_API_KEY = 'sk-or-test-openrouter-key'

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => ({
      user: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      reviewer: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
      },
      block: {
        findMany: vi.fn(),
        create: vi.fn(),
        createMany: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
      },
      like: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
      },
      follow: {
        findUnique: vi.fn(),
        create: vi.fn(),
        delete: vi.fn(),
        findMany: vi.fn(),
      },
      notification: {
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
      },
      aiQuota: {
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
    })),
  }
})
