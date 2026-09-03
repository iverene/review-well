import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft, BookOpen, Check, Globe2, LockKeyhole, UsersRound } from 'lucide-react'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const palettes = [
  { name: 'Mint morning', primary: '#CDE8D2', secondary: '#FFF7E8', accent: '#7DBB88' },
  { name: 'Blush notes', primary: '#F6C6D2', secondary: '#FFF7E8', accent: '#C96A83' },
  { name: 'Powder sky', primary: '#C9E6F2', secondary: '#FFF7E8', accent: '#6C9FB5' },
  { name: 'Butter paper', primary: '#F9E4A8', secondary: '#FFF7E8', accent: '#C39A3A' },
]

const Create = () => {
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    courseCode: '',
    courseDescription: '',
    semester: '',
    examType: 'midterm',
    visibility: 'private',
    isDraft: true,
    colorPalette: palettes[0],
  })

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setError(null)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const response = await axios.post('/api/reviewers', { ...formData, title: formData.courseDescription }, { withCredentials: true })
      navigate(`/workspace/${response.data.reviewer.id}`)
    } catch (createError) {
      console.error('Failed to create reviewer:', createError)
      setError(getApiErrorMessage(createError, 'Unable to create your reviewer. Please try again.'))
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
      <Link to="/" className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to desk
      </Link>

      <div className="mb-5 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-soft border-2 border-stone bg-mint text-ink">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
        </div>
        <div>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-accent">New study guide</p>
          <h1 className="mt-1 font-display text-4xl font-bold text-ink">Create a reviewer</h1>
          <p className="mt-2 text-muted">Set the essentials now. You can shape every block in the workspace next.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-4 lg:grid-cols-[1fr_280px]">
        <div className="rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8">
          <ErrorAlert className="mb-6">{error}</ErrorAlert>

          <div className="space-y-6">
            <div>
              <label htmlFor="courseDescription" className="mb-2 block text-sm font-extrabold text-ink">Course description</label>
              <input id="courseDescription" name="courseDescription" value={formData.courseDescription} onChange={updateField} required autoFocus placeholder="e.g. Data Structures and Algorithms" className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none" />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="courseCode" className="mb-2 block text-sm font-extrabold text-ink">Course code</label>
                <input id="courseCode" name="courseCode" value={formData.courseCode} onChange={updateField} required placeholder="e.g. CS 201" className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none" />
              </div>
              <div>
                <label htmlFor="semester" className="mb-2 block text-sm font-extrabold text-ink">Semester</label>
                <select id="semester" name="semester" value={formData.semester} onChange={updateField} required className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none">
                  <option value="" disabled>Select semester</option><option value="First Semester">First Semester</option><option value="Second Semester">Second Semester</option><option value="Summer">Summer</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="examType" className="mb-2 block text-sm font-extrabold text-ink">Examination period</label>
              <select id="examType" name="examType" value={formData.examType} onChange={updateField} className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none">
                <option value="prelim">Prelim</option><option value="midterm">Midterm</option><option value="final">Finals</option>
              </select>
            </div>
          </div>

          <section className="mt-8 border-t-2 border-stone pt-6" aria-labelledby="palette-heading">
            <h2 id="palette-heading" className="font-display text-xl font-bold text-ink">Color palette choice</h2>
            <p className="mt-1 text-xs text-muted">Choose a gentle starting mood.</p>
            <div className="mt-4 grid grid-cols-4 gap-2">
              {palettes.map((palette) => (
                <button key={palette.name} type="button" onClick={() => setFormData((previous) => ({ ...previous, colorPalette: palette }))} className="relative h-10 rounded-soft border-2 border-stone" style={{ background: `linear-gradient(135deg, ${palette.primary} 50%, ${palette.accent} 50%)` }} title={palette.name} aria-label={palette.name}>
                  {formData.colorPalette.name === palette.name && <Check className="absolute inset-0 m-auto h-5 w-5 text-ink" strokeWidth={3} aria-hidden="true" />}
                </button>
              ))}
            </div>
          </section>

          <div className="mt-8 flex justify-end border-t-2 border-stone pt-6">
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-soft border-2 border-accent bg-accent px-6 py-3 text-sm font-extrabold text-paper hover:-translate-y-0.5 disabled:opacity-60">
              {saving ? 'Creating...' : 'Create reviewer'}
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
