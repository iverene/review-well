import * as reviewerFileModel from '../models/reviewerFileModel.js'
import * as reviewerModel from '../models/reviewerModel.js'
import { createStorageAdapter } from '../services/adapters/storage.js'

const MAX_FILE_BYTES = 25 * 1024 * 1024 // 25 MB, mirrored in middleware/upload.js

const mimeToFileType = (mimetype) => {
  if (mimetype === 'application/pdf') return { fileType: 'pdf', ext: 'pdf' }
  if (mimetype === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
    return { fileType: 'pptx', ext: 'pptx' }
  }
  return null
}

const storagePathFor = (userId, reviewerId, version, ext) => (
  `${userId}/${reviewerId}/v${version}.${ext}`
)

const requireSignedIn = (req, res) => {
  if (!req.user) {
    res.status(401).json({ error: 'guest-write-blocked' })
    return false
  }
  return true
}

const uploadReviewerFile = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    if (req.file.size > MAX_FILE_BYTES) {
      return res.status(400).json({ error: 'File too large. Maximum size is 25MB' })
    }

    const { reviewerId } = req.body || {}
    if (!reviewerId) {
      return res.status(400).json({ error: 'reviewerId is required' })
    }

    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to upload to this reviewer' })
    }

    const mapped = mimeToFileType(req.file.mimetype)
    if (!mapped) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: PDF, PPTX' })
    }

    const version = 1
    const storagePath = storagePathFor(req.user.id, reviewerId, version, mapped.ext)
    const storage = createStorageAdapter()
    const { error: uploadError } = await storage.upload(req.file.buffer, storagePath, req.file.mimetype)
    if (uploadError) {
      return res.status(502).json({ error: 'File storage failed. Please try again.' })
    }

    const file = await reviewerFileModel.create({
      reviewerId,
      storagePath,
      fileType: mapped.fileType,
      byteSize: req.file.size,
      version,
    })

    const { data: urlData } = storage.getPublicUrl(storagePath)
    res.status(201).json({ file, publicUrl: urlData?.publicUrl || '' })
  } catch (error) {
    console.error('Upload reviewer file error:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
}

const replaceReviewerFile = async (req, res) => {
  try {
    if (!requireSignedIn(req, res)) return
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }
    if (req.file.size > MAX_FILE_BYTES) {
      return res.status(400).json({ error: 'File too large. Maximum size is 25MB' })
    }

    const { reviewerId } = req.params
    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (reviewer.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to upload to this reviewer' })
    }

    const mapped = mimeToFileType(req.file.mimetype)
    if (!mapped) {
      return res.status(400).json({ error: 'Invalid file type. Allowed: PDF, PPTX' })
    }

    const existing = await reviewerFileModel.findByReviewerId(reviewerId)
    if (!existing) {
      return res.status(404).json({ error: 'No file to replace for this reviewer' })
    }

    const version = existing.version + 1
    const storagePath = storagePathFor(req.user.id, reviewerId, version, mapped.ext)
    const storage = createStorageAdapter()
    const { error: uploadError } = await storage.upload(req.file.buffer, storagePath, req.file.mimetype)
    if (uploadError) {
      return res.status(502).json({ error: 'File storage failed. Please try again.' })
    }

    const file = await reviewerFileModel.bumpVersion(existing.id, {
      storagePath,
      fileType: mapped.fileType,
      byteSize: req.file.size,
      version,
    })
    await reviewerModel.update(reviewerId, { deckStale: true })

    const { data: urlData } = storage.getPublicUrl(storagePath)
    res.json({ file, publicUrl: urlData?.publicUrl || '' })
  } catch (error) {
    console.error('Replace reviewer file error:', error)
    res.status(500).json({ error: 'Failed to replace file' })
  }
}

const fileTypeToContentType = (fileType) => {
  if (fileType === 'pdf') return 'application/pdf'
  if (fileType === 'pptx') {
    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  }
  return 'application/octet-stream'
}

const downloadFileName = (reviewer, file) => {
  const ext = file.fileType === 'pptx' ? 'pptx' : 'pdf'
  const base = String(reviewer.title || 'reviewer').replace(/[^\w\- ]+/g, '').trim() || 'reviewer'
  return `${base}.${ext}`
}

const downloadReviewerFile = async (req, res) => {
  try {
    const { reviewerId } = req.params
    const reviewer = await reviewerModel.findById(reviewerId)
    if (!reviewer) {
      return res.status(404).json({ error: 'Reviewer not found' })
    }
    if (reviewer.visibility === 'private' && reviewer.authorId !== req.user?.id) {
      return res.status(403).json({ error: 'Access denied' })
    }

    const file = await reviewerFileModel.findByReviewerId(reviewerId)
    if (!file) {
      return res.status(404).json({ error: 'No file for this reviewer' })
    }

    const storage = createStorageAdapter()
    const { data, error: downloadError } = await storage.download(file.storagePath)
    if (downloadError || !data) {
      return res.status(502).json({ error: 'File download failed. Please try again.' })
    }

    const buffer = Buffer.from(await data.arrayBuffer())
    res.setHeader('Content-Type', fileTypeToContentType(file.fileType))
    res.setHeader('Content-Length', buffer.length)
    res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName(reviewer, file)}"`)
    res.send(buffer)
  } catch (error) {
    console.error('Download reviewer file error:', error)
    res.status(500).json({ error: 'Failed to download file' })
  }
}

export { uploadReviewerFile, replaceReviewerFile, downloadReviewerFile }
