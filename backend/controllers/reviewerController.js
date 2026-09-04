import * as reviewerModel from '../models/reviewerModel.js'
import * as blockModel from '../models/blockModel.js'

const getPublicReviewers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search = '' } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const result = await reviewerModel.findPublic({ skip, take, search })

    res.json({
      reviewers: result.reviewers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total: result.total,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    console.error('Get public reviewers error:', error)
    res.status(500).json({ error: 'Failed to fetch reviewers' })
  }
}

const getMyReviewers = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const skip = (parseInt(page) - 1) * parseInt(limit)
    const take = parseInt(limit)

    const result = await reviewerModel.findByAuthor(req.user.id, { skip, take })

    res.json({
      reviewers: result.reviewers,
      pagination: {
        page: parseInt(page),
        limit: take,
        total: result.total,
        hasMore: result.hasMore,
      },
    })
  } catch (error) {
    console.error('Get my reviewers error:', error)
    res.status(500).json({ error: 'Failed to fetch your reviewers' })
  }
}

const getReviewerById = async (req, res) => {
  try {
    const { id } = req.params
    const reviewer = await reviewerModel.findById(id)

    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    // Check access permissions
    if (reviewer.visibility === 'private' && reviewer.authorId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    if (reviewer.visibility === 'unlisted' && reviewer.authorId !== req.user?.id) {
      // Unlisted reviewers are accessible via direct link but not listed
    }

    res.json({ reviewer })
  } catch (error) {
    console.error('Get reviewer error:', error)
    res.status(500).json({ error: 'Failed to fetch reviewer' })
  }
}

const createReviewer = async (req, res) => {
  try {
    const data = req.validatedBody
    const reviewer = await reviewerModel.create({
      ...data,
      authorId: req.user.id,
    })

    res.status(201).json({ reviewer })
  } catch (error) {
    console.error('Create reviewer error:', error)
    res.status(500).json({ error: 'Failed to create reviewer' })
  }
}

const updateReviewer = async (req, res) => {
  try {
    const { id } = req.params
    const data = { ...req.validatedBody }

    // Sharing a reviewer publishes it: public listings and direct links
    // both require a non-draft, so flipping to public/unlisted clears the draft flag.
    if (data.visibility && data.visibility !== 'private') {
      data.isDraft = false
    }

    const existing = await reviewerModel.findById(id)
    if (!existing) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this reviewer' })
    }

    const reviewer = await reviewerModel.update(id, data)
    res.json({ reviewer })
  } catch (error) {
    console.error('Update reviewer error:', error)
    res.status(500).json({ error: 'Failed to update reviewer' })
  }
}

const deleteReviewer = async (req, res) => {
  try {
    const { id } = req.params

    const existing = await reviewerModel.findById(id)
    if (!existing) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (existing.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this reviewer' })
    }

    await reviewerModel.remove(id)
    res.json({ message: 'Reviewer deleted successfully' })
  } catch (error) {
    console.error('Delete reviewer error:', error)
    res.status(500).json({ error: 'Failed to delete reviewer' })
  }
}

const addBlock = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const data = req.validatedBody

    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this reviewer' })
    }

    const maxSortOrder = await blockModel.getMaxSortOrder(reviewerId, data.columnIndex)
    const block = await blockModel.create({
      ...data,
      reviewerId,
      sortOrder: maxSortOrder + 1,
    })

    res.status(201).json({ block })
  } catch (error) {
    console.error('Add block error:', error)
    res.status(500).json({ error: 'Failed to add block' })
  }
}

const updateBlock = async (req, res) => {
  try {
    const { blockId } = req.params
    const data = req.validatedBody

    const existing = await blockModel.findById(blockId)
    if (!existing) {
      return res.status(404).json({ error: 'Block not found' })
    }

    const reviewer = await reviewerModel.findById(existing.reviewerId)
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this block' })
    }

    const block = await blockModel.update(blockId, data)
    res.json({ block })
  } catch (error) {
    console.error('Update block error:', error)
    res.status(500).json({ error: 'Failed to update block' })
  }
}

const deleteBlock = async (req, res) => {
  try {
    const { blockId } = req.params

    const existing = await blockModel.findById(blockId)
    if (!existing) {
      return res.status(404).json({ error: 'Block not found' })
    }

    const reviewer = await reviewerModel.findById(existing.reviewerId)
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this block' })
    }

    await blockModel.remove(blockId)
    res.json({ message: 'Block deleted successfully' })
  } catch (error) {
    console.error('Delete block error:', error)
    res.status(500).json({ error: 'Failed to delete block' })
  }
}

const reorderBlocks = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const { blocks } = req.validatedBody

    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }

    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to modify this reviewer' })
    }

    await blockModel.reorder(reviewerId, blocks)
    res.json({ message: 'Blocks reordered successfully' })
  } catch (error) {
    console.error('Reorder blocks error:', error)
    res.status(500).json({ error: 'Failed to reorder blocks' })
  }
}

export {
  getPublicReviewers,
  getMyReviewers,
  getReviewerById,
  createReviewer,
  updateReviewer,
  deleteReviewer,
  addBlock,
  updateBlock,
  deleteBlock,
  reorderBlocks,
}