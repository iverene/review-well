import { z } from 'zod'

const createReviewerSchema = z.object({
  title: z.string().min(1).max(200),
  courseCode: z.string().max(50).optional().default(''),
  courseDescription: z.string().min(1).max(500),
  semester: z.string().min(1).max(50),
  examType: z.enum(['prelim', 'midterm', 'final', 'quiz']),
  visibility: z.enum(['public', 'unlisted', 'private']).default('private'),
  isDraft: z.boolean().default(true),
  thumbnailIcon: z.string().url().optional(),
  colorPalette: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
})

const updateReviewerSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  courseCode: z.string().max(50).optional(),
  courseDescription: z.string().min(1).max(500).optional(),
  semester: z.string().min(1).max(50).optional(),
  examType: z.enum(['prelim', 'midterm', 'final', 'quiz']).optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  isDraft: z.boolean().optional(),
  thumbnailIcon: z.string().url().optional().nullable(),
  colorPalette: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
})

export {
  createReviewerSchema,
  updateReviewerSchema,
}
