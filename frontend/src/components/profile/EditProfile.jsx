import { useState, useRef } from 'react'
import { Camera, Loader2 } from 'lucide-react'

const AVATAR_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const AVATAR_MAX_BYTES = 2 * 1024 * 1024

const EditProfile = ({ profile, onSave, onAvatarUpload, saving }) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    school: profile.school || '',
    program: profile.program || '',
    major: profile.major || '',
    yearLevel: profile.yearLevel || '',
  })
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [avatarError, setAvatarError] = useState(null)
  const fileInputRef = useRef(null)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setAvatarError(null)
    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError('Please choose a JPG, PNG, WEBP, or GIF image.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError('Image must be 2MB or smaller.')
      return
    }
    const previewUrl = URL.createObjectURL(file)
    setPreview(previewUrl)
    setUploading(true)
    try {
      await onAvatarUpload(file)
    } finally {
      setUploading(false)
      setPreview(null)
      URL.revokeObjectURL(previewUrl)
    }
  }

  const yearLevels = [
    { value: 'freshman', label: 'Freshman' },
    { value: 'sophomore', label: 'Sophomore' },
    { value: 'junior', label: 'Junior' },
    { value: 'senior', label: 'Senior' },
    { value: 'graduate', label: 'Graduate' },
    { value: 'phd', label: 'PhD' },
    { value: 'other', label: 'Other' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Avatar */}
      <div className="flex items-center gap-5">
        <div className="relative">
          {preview || profile.avatarUrl ? (
            <img
              src={preview || profile.avatarUrl}
              alt={profile.displayName}
              className="h-20 w-20 rounded-full border-2 border-stone object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-stone bg-blush font-display text-2xl font-bold text-ink" aria-hidden="true">
              {formData.displayName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          {uploading && (
            <span className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/40" aria-hidden="true">
              <Loader2 className="h-6 w-6 animate-spin text-paper" />
            </span>
          )}
        </div>
        <div>
          <button
            type="button"
            onClick={handleAvatarClick}
            disabled={uploading}
            className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder disabled:opacity-60"
          >
            <Camera className="h-4 w-4" aria-hidden="true" />
            {uploading ? 'Uploading…' : 'Change Avatar'}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleAvatarChange}
            className="hidden"
            aria-label="Upload profile photo"
          />
          <p className="mt-1 text-xs text-muted">JPG, PNG, WEBP, GIF. Max 2MB.</p>
          {avatarError && <p className="mt-1 text-xs font-bold text-accent" role="alert">{avatarError}</p>}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-extrabold text-ink">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
          required
        />
      </div>

      {/* School */}
      <div>
        <label htmlFor="school" className="mb-1 block text-sm font-extrabold text-ink">
          School
        </label>
        <input
          type="text"
          id="school"
          name="school"
          value={formData.school}
          onChange={handleChange}
          required
          className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
          placeholder="e.g., MIT, Stanford, etc."
        />
      </div>

      {/* Program */}
      <div>
        <label htmlFor="program" className="mb-1 block text-sm font-extrabold text-ink">
          Program
        </label>
        <input
          type="text"
          id="program"
          name="program"
          value={formData.program}
          onChange={handleChange}
          required
          className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
          placeholder="e.g., Computer Science, Biology, etc."
        />
      </div>

      {/* Major */}
      <div>
        <label htmlFor="major" className="mb-1 block text-sm font-extrabold text-ink">
          Major
        </label>
        <input
          type="text"
          id="major"
          name="major"
          value={formData.major}
          onChange={handleChange}
          required
          className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
          placeholder="e.g., Software Engineering, etc."
        />
      </div>

      {/* Year Level */}
      <div>
        <label htmlFor="yearLevel" className="mb-1 block text-sm font-extrabold text-ink">
          Year Level
        </label>
        <select
          id="yearLevel"
          name="yearLevel"
          value={formData.yearLevel}
          onChange={handleChange}
          required
          className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-2.5 text-ink focus:border-accent focus:outline-none"
        >
          <option value="">Select year level</option>
          {yearLevels.map((level) => (
            <option key={level.value} value={level.value}>
              {level.label}
            </option>
          ))}
        </select>
      </div>

      {/* Save Button */}
      <div className="flex justify-end border-t-2 border-stone pt-5">
        <button
          type="submit"
          disabled={saving || uploading}
          className="rounded-soft border-2 border-accent bg-accent px-6 py-2.5 text-sm font-extrabold text-paper hover:-translate-y-0.5 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default EditProfile
