import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { BookOpen, FileUp, Globe2, LockKeyhole, RefreshCcw, UsersRound } from 'lucide-react'

import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { useAuth } from '../contexts/AuthContext'

// Kawaii tokens (spec): Cream #FFF7E8 Cocoa #604A3A Blush #F6C6D2 Powder #C9E6F2 Mint #CDE8D2 Butter #F9E4A8 Berry #C96A83
const MAX_FILE_BYTES = 25 * 1024 * 1024
const ACCEPTED_EXTENSIONS = ['.pdf', '.pptx']

// Default theme applied at creation; shown in the study-hub header.
const defaultPalette = { name: 'Cocoa Classic', primary: '#7C6B5D', secondary: '#F5EAD3', accent: '#FCF7EC' }

const isAcceptedFile = (file) => {
  if (!file) return false
  const name = file.name.toLowerCase()
  return ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))
}

// Friendly client-side pre-check (server re-enforces type + 25 MB in multer).
const validateSourceFile = (file) => {
  if (!file) return 'Please attach your PDF or PPTX so we can build your reviewer! 📎'
  if (!isAcceptedFile(file)) return 'Oops! Only PDF or PPTX files can join the study party. 💌'
  if (file.size > MAX_FILE_BYTES) return 'That file is a bit too chunky — please keep it under 25 MB! 🍰'
  return null
}

const Create = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { isGuest } = useAuth()
  const editReviewerId = searchParams.get('edit')

  const [saving, setSaving] = useState(false)
  const [loadingEdit, setLoadingEdit] = useState(Boolean(editReviewerId))
  const [error, setError] = useState(null)
  const [fileError, setFileError] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    courseCode: '',
    courseDescription: '',
    semester: '',
    examType: 'midterm',
    visibility: 'private',
    isDraft: true,
    colorPalette: defaultPalette,
  })
  const [sourceFile, setSourceFile] = useState(null)
  const [dragging, setDragging] = useState(false)

  // Edit mode for your own reviewer (?edit=<id>): metadata form + replace-file.
  useEffect(() => {
    if (!editReviewerId) return
    let cancelled = false
    const loadReviewer = async () => {
      setLoadingEdit(true)
      try {
        const response = await axios.get(`/api/reviewers/${editReviewerId}`, { withCredentials: true })
        if (cancelled) return
        const reviewer = response.data.reviewer
        setFormData((previous) => ({
          ...previous,
          title: reviewer.title || '',
          courseCode: reviewer.courseCode || '',
          courseDescription: reviewer.courseDescription || '',
          semester: reviewer.semester || '',
          examType: reviewer.examType || 'midterm',
          visibility: reviewer.visibility || 'private',
        }))
      } catch (loadError) {
        if (!cancelled) setError(getApiErrorMessage(loadError, 'Unable to load your reviewer for editing.'))
      } finally {
        if (!cancelled) setLoadingEdit(false)
      }
    }
    loadReviewer()
    return () => { cancelled = true }
  }, [editReviewerId])

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setError(null)
  }

  const pickFile = (file) => {
    setSourceFile(file)
    setFileError(file ? validateSourceFile(file) : null)
  }

  const handleFileChange = (event) => {
    pickFile(event.target.files?.[0] || null)
    event.target.value = ''
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    pickFile(event.dataTransfer.files?.[0] || null)
  }

  const uploadSourceFile = async (reviewerId, file) => {
    const payload = new FormData()
    payload.append('reviewerId', reviewerId)
    payload.append('file', file)
    await axios.post('/api/reviewer-files', payload, { withCredentials: true })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError(null)

    if (isGuest) {
      setError('Guests cannot create reviewers. Please sign in to upload! 🔑')
      return
    }

    if (editReviewerId) {
      const problem = sourceFile ? validateSourceFile(sourceFile) : null
      if (problem) {
        setFileError(problem)
        return
      }
      if (sourceFile && !window.confirm('Replacing may stale the AI deck — keep or regenerate after upload. Replace the file?')) {
        return
      }
      setSaving(true)
      try {
        const { title, courseCode, courseDescription, semester, examType, visibility } = formData
        await axios.put(`/api/reviewers/${editReviewerId}`, { title, courseCode, courseDescription, semester, examType, visibility }, { withCredentials: true })
        if (sourceFile) {
          const payload = new FormData()
          payload.append('file', sourceFile)
          await axios.put(`/api/reviewer-files/${editReviewerId}`, payload, { withCredentials: true })
        }
        navigate(`/reviewer/${editReviewerId}`)
      } catch (saveError) {
        console.error('Failed to update reviewer:', saveError)
        setError(getApiErrorMessage(saveError, 'Unable to save your reviewer. Please try again.'))
      } finally {
        setSaving(false)
      }
      return
    }

    const problem = validateSourceFile(sourceFile)
    if (problem) {
      setFileError(problem)
      return
    }

    setSaving(true)
    let reviewerId = null
    try {
      const response = await axios.post('/api/reviewers', { ...formData }, { withCredentials: true })
      reviewerId = response.data.reviewer.id
      await uploadSourceFile(reviewerId, sourceFile)
      navigate(`/reviewer/${reviewerId}`)
    } catch (createError) {
      console.error('Failed to create reviewer:', createError)
      // Roll back the just-created reviewer when the file upload step fails,
      // so no orphan file-less reviewer remains (plan error-handling section).
      // Best-effort: ignore delete errors and surface the upload error.
      if (reviewerId && createError.config?.url === '/api/reviewer-files') {
        try {
          await axios.delete(`/api/reviewers/${reviewerId}`, { withCredentials: true })
        } catch (rollbackError) {
          console.error('Failed to roll back orphan reviewer:', rollbackError)
        }
        setError(getApiErrorMessage(createError, 'File upload failed, so your reviewer was not created. Please try again! 💌'))
      } else {
        setError(getApiErrorMessage(createError, 'Unable to create your reviewer. Please try again.'))
      }
    } finally {
      setSaving(false)
    }
  }

  const visibilityOptions = [
    { value: 'private', label: 'Private', description: 'Only you can see it.', icon: LockKeyhole },
    { value: 'unlisted', label: 'Unlisted', description: 'Anyone with the link can see it.', icon: UsersRound },
    { value: 'public', label: 'Public', description: 'Discoverable by the community.', icon: Globe2 },
  ]

  return (
    <div className="mx-auto max-w-4xl pb-6">
      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-soft border-2 border-stone bg-mint text-ink">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">New study guide</p>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink md:text-4xl">{editReviewerId ? 'Edit Your Reviewer' : 'Create a Reviewer'}</h1>
          <p className="mt-2 text-muted">{editReviewerId ? 'Tweak the details or swap in a fresh file.' : 'Upload your PDF or PPTX now — AI decks and study modes build on it next.'}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-soft border-2 border-stone bg-paper p-4 club-shadow sm:p-8">
          <ErrorAlert className="mb-6">{error}</ErrorAlert>

          {loadingEdit ? (
            <p className="text-sm text-muted">Loading your reviewer… 🎀</p>
          ) : (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="mb-2 block text-sm font-extrabold text-ink">Title</label>
              <input id="title" name="title" value={formData.title} onChange={updateField} required autoFocus placeholder="e.g. Data Structures Midterm Guide" className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none" />
            </div>

            <div>
              <label htmlFor="courseDescription" className="mb-2 block text-sm font-extrabold text-ink">Course Description</label>
              <input id="courseDescription" name="courseDescription" value={formData.courseDescription} onChange={updateField} required placeholder="e.g. Data Structures and Algorithms" className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="courseCode" className="mb-2 block text-sm font-extrabold text-ink">Course Code</label>
                <input id="courseCode" name="courseCode" value={formData.courseCode} onChange={updateField} required placeholder="e.g. CS 201" className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label htmlFor="semester" className="mb-2 block text-sm font-extrabold text-ink">Semester</label>
                <select id="semester" name="semester" value={formData.semester} onChange={updateField} required className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none">
                  <option value="" disabled>Select Semester</option><option value="First Semester">First Semester</option><option value="Second Semester">Second Semester</option><option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="examType" className="mb-2 block text-sm font-extrabold text-ink">Examination Period</label>
              <select id="examType" name="examType" value={formData.examType} onChange={updateField} className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none">
                <option value="prelim">Prelim</option><option value="midterm">Midterm</option><option value="final">Finals</option>
              </select>
            </div>

            <div
              className={`rounded-soft border-2 border-stone bg-[#FFF7E8] p-4 transition-colors ${dragging ? 'border-accent bg-butter/40' : ''}`}
              onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
            >
              <label htmlFor="sourceFile" className="mb-2 flex items-center gap-2 text-sm font-extrabold text-[#604A3A]">
                {editReviewerId ? <RefreshCcw className="h-4 w-4" aria-hidden="true" /> : <FileUp className="h-4 w-4" aria-hidden="true" />}
                {editReviewerId ? 'Replace File (Optional)' : 'Source File'}
              </label>
              <input
                id="sourceFile"
                type="file"
                accept=".pdf,.pptx"
                onChange={handleFileChange}
                required={!editReviewerId}
                className="w-full rounded-soft border-2 border-dashed border-[#F6C6D2] bg-paper px-4 py-3 text-sm text-ink file:mr-3 file:rounded-soft file:border-2 file:border-[#604A3A] file:bg-[#F9E4A8] file:px-3 file:py-1 file:text-xs file:font-extrabold file:text-[#604A3A]"
              />
              <p className="mt-2 text-xs text-muted">PDF or PPTX only, max 25 MB. {editReviewerId ? 'Swapping files may stale the AI deck.' : 'Drag and drop your file here, or browse to choose one.'}</p>
              {sourceFile && !fileError && (
                <p className="mt-2 rounded-soft bg-[#CDE8D2] px-3 py-2 text-xs font-bold text-[#604A3A]">
                  {sourceFile.name} ({(sourceFile.size / 1024 / 1024).toFixed(2)} MB) looks perfect! ✨
                </p>
              )}
              {fileError && (
                <p role="alert" className="mt-2 rounded-soft bg-[#F6C6D2] px-3 py-2 text-xs font-bold text-[#604A3A]">{fileError}</p>
              )}
            </div>
          </div>
          )}

          <div className="mt-8 flex justify-end border-t-2 border-stone pt-6">
            <button type="submit" disabled={saving || loadingEdit} className="inline-flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-6 py-3 text-sm font-extrabold text-paper hover:-translate-y-0.5 disabled:opacity-60">
              {saving ? (editReviewerId ? 'Saving...' : 'Creating...') : (editReviewerId ? 'Save Changes' : 'Create Reviewer')}
            </button>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="rounded-soft border-2 border-stone bg-paper p-5">
            <h2 className="font-display text-xl font-bold text-ink">Visibility</h2>
            <div className="mt-4 space-y-2">
              {visibilityOptions.map(({ value, label, description, icon: Icon }) => (
                <label key={value} className={`flex cursor-pointer gap-3 rounded-soft border-2 p-3 ${formData.visibility === value ? 'border-mint bg-mint/50' : 'border-transparent hover:bg-stone/40'}`}>
                  <input type="radio" name="visibility" value={value} checked={formData.visibility === value} onChange={updateField} className="sr-only" />
                  <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
                  <span><span className="block text-sm font-extrabold text-ink">{label}</span><span className="mt-0.5 block text-xs text-muted">{description}</span></span>
                </label>
              ))}
            </div>
          </div>

        </aside>
      </form>
    </div>
  )
}

export default Create
