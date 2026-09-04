import { vi } from 'vitest'

export const mockSupabase = () => ({
  user: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  reviewer: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  block: {
    findMany: vi.fn(),
    create: vi.fn(),
    createMany: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    deleteMany: vi.fn(),
  },
  save: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
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
})

export const mockGoogleAuth = () => ({
  verifyIdToken: vi.fn().mockResolvedValue({
    sub: 'google-123',
    email: 'test@example.com',
    name: 'Test User',
    picture: 'https://example.com/avatar.jpg',
  }),
})

export const mockOpenRouter = () => ({
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify([
                {
                  block_type: 'content_block',
                  content_data: {
                    heading: 'Test Term',
                    body: 'Test definition',
                  },
                },
              ]),
            },
          },
        ],
      }),
    },
  },
})

export const mockStorage = () => ({
  upload: vi.fn().mockResolvedValue({ data: { path: 'uploads/test.pdf' }, error: null }),
  getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://storage.example.com/test.pdf' } }),
})

export const createMockRequest = (overrides = {}) => ({
  body: {},
  params: {},
  query: {},
  session: { userId: 'user-123' },
  user: { id: 'user-123', email: 'test@example.com' },
  file: null,
  ...overrides,
})

export const createMockResponse = () => {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  }
  return res
}

export const createMockNext = () => vi.fn()
