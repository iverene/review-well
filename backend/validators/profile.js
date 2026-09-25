import { z } from 'zod'

const updateProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(100).optional(),
  school: z.string().trim().max(200).optional(),
  program: z.string().trim().max(200).optional(),
  major: z.string().trim().max(200).optional(),
  yearLevel: z.string().trim().max(50).optional(),
})

const avatarUrlSchema = z.object({
  avatarUrl: z.string().url().max(2048),
})

export { updateProfileSchema, avatarUrlSchema }
