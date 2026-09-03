import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Toolbar from '../components/workspace/Toolbar'
import FormattingToolbar from '../components/workspace/FormattingToolbar'
import BlockRenderer from '../components/workspace/BlockRenderer'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const Workspace = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [reviewer, setReviewer] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchReviewer()
  }, [id])

  const fetchReviewer = async () => {
    try {
      const response = await axios.get(`/api/reviewers/${id}`, { withCredentials: true })
      setReviewer(response.data.reviewer)
      setBlocks(response.data.reviewer.blocks || [])
    } catch (error) {
      console.error('Failed to fetch reviewer:', error)
      setError(getApiErrorMessage(error, 'Unable to load this reviewer.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      await axios.put(
        `/api/reviewers/${id}`,
        { title: reviewer.title },
        { withCredentials: true }
      )
      // Save block changes
      for (const block of blocks) {
        if (block.id) {
          await axios.put(`/api/reviewers/blocks/${block.id}`, block, { withCredentials: true })
        }
      }
    } catch (error) {
      console.error('Failed to save:', error)
      setError(getApiErrorMessage(error, 'Unable to save your changes.'))
    } finally {
      setSaving(false)
    }
  }

  const handleAddBlock = async (blockType) => {
    setError(null)
    try {
      const response = await axios.post(
        `/api/reviewers/${id}/blocks`,
        {
          blockType,
          columnIndex: 1,
          sortOrder: blocks.length,
          contentData: getDefaultContent(blockType),
        },
        { withCredentials: true }
      )
      setBlocks([...blocks, response.data.block])
    } catch (error) {
      console.error('Failed to add block:', error)
      setError(getApiErrorMessage(error, 'Unable to add this block.'))
    }
  }

  const getDefaultContent = (blockType) => {
    switch (blockType) {
      case 'topic_banner':
        return { heading: 'New Topic' }
      case 'sub_topic_banner':
        return { heading: 'New Sub-topic' }
      case 'content_block':
        return { heading: 'Term', body: 'Definition' }
      case 'table':
        return { headers: ['Column 1', 'Column 2'], rows: [['', '']] }
      default:
        return {}
    }
  }

  const handleUpdateBlock = (blockId, updates) => {
    setBlocks(blocks.map((b) => (b.id === blockId ? { ...b, ...updates } : b)))
  }

  const handleDeleteBlock = async (blockId) => {
    setError(null)
    try {
      await axios.delete(`/api/reviewers/blocks/${blockId}`, { withCredentials: true })
      setBlocks(blocks.filter((b) => b.id !== blockId))
      if (selectedBlock === blockId) {
        setSelectedBlock(null)
      }
    } catch (error) {
      console.error('Failed to delete block:', error)
      setError(getApiErrorMessage(error, 'Unable to delete this block.'))
    }
  }

  const handleReorderBlocks = async (reorderedBlocks) => {
    setBlocks(reorderedBlocks)
    setError(null)
    try {
      await axios.put(
        `/api/reviewers/${id}/blocks/reorder`,
        { blocks: reorderedBlocks.map((b, i) => ({ id: b.id, columnIndex: b.columnIndex, sortOrder: i })) },
        { withCredentials: true }
      )
    } catch (error) {
      console.error('Failed to reorder blocks:', error)
      setError(getApiErrorMessage(error, 'Unable to reorder your blocks.'))
    }
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted">Loading workspace...</div>
      </div>
    )
  }

  if (!reviewer) {
    return (
      <div className="flex h-full items-center justify-center">
        <ErrorAlert>{error || 'Reviewer not found'}</ErrorAlert>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <Toolbar
        reviewer={reviewer}
        saving={saving}
        onSave={handleSave}
        onAddBlock={handleAddBlock}
      />

      <ErrorAlert className="mx-4 mt-4 md:mx-8">{error}</ErrorAlert>

      {/* Formatting Toolbar */}
      {selectedBlock && (
        <FormattingToolbar
          block={blocks.find((b) => b.id === selectedBlock)}
          onUpdate={(updates) => handleUpdateBlock(selectedBlock, updates)}
        />
      )}

      {/* A4 Canvas */}
      <div className="flex-1 overflow-y-auto bg-stone/30 p-4 md:p-8">
        <div className="mx-auto max-w-[210mm] min-h-[297mm] bg-paper shadow-lg border border-stone">
          {/* Main Title Block */}
          <div className="border-b border-stone p-6">
            <input
              type="text"
              value={reviewer.title}
              onChange={(e) => setReviewer({ ...reviewer, title: e.target.value })}
              className="w-full text-3xl font-bold text-ink bg-transparent border-none focus:outline-none"
              placeholder="Reviewer Title"
            />
            <div className="mt-2 text-sm text-muted">
              {reviewer.courseCode} • {reviewer.semester}
            </div>
          </div>

          {/* Blocks */}
          <div className="p-6">
            {blocks.length === 0 ? (
              <div className="py-12 text-center text-muted">
                <p>No blocks yet. Click "Add Block" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {blocks.map((block) => (
                  <BlockRenderer
                    key={block.id}
                    block={block}
                    selected={selectedBlock === block.id}
                    onSelect={() => setSelectedBlock(block.id)}
                    onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                    onDelete={() => handleDeleteBlock(block.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Workspace
