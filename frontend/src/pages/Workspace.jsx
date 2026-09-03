import { useState, useEffect, useRef } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Toolbar from '../components/workspace/Toolbar'
import FormattingToolbar from '../components/workspace/FormattingToolbar'
import BlockRenderer from '../components/workspace/BlockRenderer'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { WorkspaceSkeleton } from '../components/common/Skeleton'

const Workspace = () => {
  const { id } = useParams()
  const { user } = useAuth()
  const [reviewer, setReviewer] = useState(null)
  const [blocks, setBlocks] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [error, setError] = useState(null)
  const fileInputRef = useRef(null)

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
        {
          title: reviewer.title,
          courseCode: reviewer.courseCode,
          courseDescription: reviewer.courseDescription,
          semester: reviewer.semester,
          examType: reviewer.examType,
          visibility: reviewer.visibility,
          colorPalette: reviewer.colorPalette,
        },
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

  const handleAiExtract = () => fileInputRef.current?.click()

  const handleFileSelected = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    setError(null)
    try {
      await axios.post('/api/ai/extract', { file, reviewerId: id }, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      await fetchReviewer()
    } catch (error) {
      console.error('Failed to extract study blocks:', error)
      setError(getApiErrorMessage(error, 'Unable to extract study blocks.'))
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
      <WorkspaceSkeleton />
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
        onTitleChange={(title) => setReviewer({ ...reviewer, title })}
        onAiExtract={handleAiExtract}
      />

      <input ref={fileInputRef} type="file" accept=".pdf,.pptx,.ppt,.txt" onChange={handleFileSelected} className="hidden" />

      <ErrorAlert className="mx-4 mt-4 md:mx-8">{error}</ErrorAlert>

      {/* Formatting Toolbar */}
      {selectedBlock && (
        <FormattingToolbar
          block={blocks.find((b) => b.id === selectedBlock)}
          onUpdate={(updates) => handleUpdateBlock(selectedBlock, updates)}
        />
      )}

      {/* A4 Canvas */}
      <div className="flex flex-1 overflow-y-auto bg-stone/30 p-4 md:p-8">
        <div className="mx-auto grid w-full max-w-[1200px] gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="min-h-[297mm] bg-paper shadow-lg border border-stone">
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
              <div className="grid gap-4 md:grid-cols-2">
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
        <aside className="h-fit rounded-soft border-2 border-stone bg-paper p-4">
          <h2 className="font-display text-lg font-bold text-ink">Study details</h2>
          <div className="mt-4 space-y-3">
            {['courseCode', 'courseDescription', 'semester'].map((field) => (
              <label key={field} className="block text-xs font-extrabold text-ink">
                {field === 'courseCode' ? 'Course code' : field === 'courseDescription' ? 'Course description' : 'Semester'}
                <input value={reviewer[field] || ''} onChange={(event) => setReviewer({ ...reviewer, [field]: event.target.value })} className="mt-1 w-full rounded-soft border-2 border-stone bg-paper px-3 py-2 text-sm font-normal text-ink focus:border-accent focus:outline-none" />
              </label>
            ))}
            <label className="block text-xs font-extrabold text-ink">Visibility
              <select value={reviewer.visibility} onChange={(event) => setReviewer({ ...reviewer, visibility: event.target.value })} className="mt-1 w-full rounded-soft border-2 border-stone bg-paper px-3 py-2 text-sm font-normal text-ink focus:border-accent focus:outline-none">
                <option value="private">Private</option><option value="unlisted">Unlisted</option><option value="public">Public</option>
              </select>
            </label>
          </div>
          <p className="mt-4 text-xs text-muted">Changes are saved together with your document.</p>
        </aside>
        </div>
      </div>
    </div>
  )
}

export default Workspace
