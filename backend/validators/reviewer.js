import { z } from 'zod'

const createReviewerSchema = z.object({
  title: z.string().min(1).max(200),
  courseCode: z.string().min(1).max(50),
  courseDescription: z.string().min(1).max(500),
  semester: z.string().min(1).max(50),
  examType: z.enum(['midterm', 'final', 'quiz', 'assignment', 'other']),
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
  courseCode: z.string().min(1).max(50).optional(),
  courseDescription: z.string().min(1).max(500).optional(),
  semester: z.string().min(1).max(50).optional(),
  examType: z.enum(['midterm', 'final', 'quiz', 'assignment', 'other']).optional(),
  visibility: z.enum(['public', 'unlisted', 'private']).optional(),
  isDraft: z.boolean().optional(),
  thumbnailIcon: z.string().url().optional().nullable(),
  colorPalette: z.object({
    primary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    secondary: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    accent: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  }).optional(),
})

const createBlockSchema = z.object({
  blockType: z.enum(['topic_banner', 'sub_topic_banner', 'content_block', 'table']),
  columnIndex: z.number().int().min(1).max(2).default(1),
  sortOrder: z.number().int().min(0),
  contentData: z.record(z.any()),
})

const updateBlockSchema = z.object({
  blockType: z.enum(['topic_banner', 'sub_topic_banner', 'content_block', 'table']).optional(),
  columnIndex: z.number().int().min(1).max(2).optional(),
  sortOrder: z.number().int().min(0).optional(),
  contentData: z.record(z.any()).optional(),
})

const reorderBlocksSchema = z.object({
  blocks: z.array(z.object({
    id: z.string().uuid(),
    columnIndex: z.number().int().min(1).max(2),
    sortOrder: z.number().int().min(0),
  })),
})

export {
  createReviewerSchema,
  updateReviewerSchema,
  createBlockSchema,
  updateBlockSchema,
  reorderBlocksSchema,
}
