const { extractStudyBlocks, isConfigured } = require('../services/openaiService')
const { checkQuota, incrementUsage, getRemainingQuota } = require('../models/aiQuotaModel')
const blockModel = require('../models/blockModel')
const reviewerModel = require('../models/reviewerModel')

const AI_QUOTA_LIMIT = 50

const extractFromUpload = async (req, res) => {
  try {
    const { reviewerId } = req.body
    const file = req.file

    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // Check if reviewer exists and user owns it
    if (reviewerId) {
      const reviewer = await reviewerModel.findById(reviewerId)
      if (!reviewer) {
        return res.status(404).json({ error: 'Reviewer not found' })
      }
      if (reviewer.authorId !== req.user.id) {
        return res.status(403).json({ error: 'Not authorized' })
      }
    }

    // Check AI quota
    const hasQuota = await checkQuota(req.user.id, AI_QUOTA_LIMIT)
    if (!hasQuota) {
      return res.status(429).json({
        error: 'AI extraction limit reached',
        remaining: 0,
        limit: AI_QUOTA_LIMIT,
      })
    }

    // Extract text from file (simplified - in production use pdf-parse or similar)
    const text = extractTextFromFile(file)

    // Extract study blocks
    const blocks = await extractStudyBlocks(text, {
      courseCode: req.body.courseCode,
      courseDescription: req.body.courseDescription,
      examType: req.body.examType,
    })

    // Increment quota usage
    await incrementUsage(req.user.id)

    // If reviewerId provided, save blocks to database
    if (reviewerId && blocks.length > 0) {
      const blocksToCreate = blocks.map((block, index) => ({
        reviewerId,
        blockType: block.block_type,
        columnIndex: 1,
        sortOrder: index,
        contentData: block.content_data,
      }))

      await blockModel.createMany(blocksToCreate)
    }

    const remaining = await getRemainingQuota(req.user.id, AI_QUOTA_LIMIT)

    res.json({
      blocks,
      saved: !!reviewerId,
      remaining,
      limit: AI_QUOTA_LIMIT,
    })
  } catch (error) {
    console.error('AI extraction error:', error)
    res.status(500).json({ error: 'Failed to extract study blocks' })
  }
}

const getQuotaStatus = async (req, res) => {
  try {
    const remaining = await getRemainingQuota(req.user.id, AI_QUOTA_LIMIT)
    res.json({
      remaining,
      limit: AI_QUOTA_LIMIT,
      configured: isConfigured(),
    })
  } catch (error) {
    console.error('Quota status error:', error)
    res.status(500).json({ error: 'Failed to get quota status' })
  }
}

const extractTextFromFile = (file) => {
  // Simplified text extraction - in production use proper parsers
  if (file.mimetype === 'text/plain') {
    return file.buffer.toString('utf-8')
  }

  // For PDF/PPTX, we'd use pdf-parse or pptx-parser
  // For now, return a placeholder
  return `[Content from ${file.originalname}]\n\nThis is a placeholder for the actual content extraction. In production, this would use pdf-parse or similar library to extract text from ${file.mimetype} files.`
}

module.exports = { extractFromUpload, getQuotaStatus }
