import { useState, useRef } from 'react'

const EditProfile = ({ profile, onSave, onAvatarUpload, saving }) => {
  const [formData, setFormData] = useState({
    displayName: profile.displayName || '',
    school: profile.school || '',
    program: profile.program || '',
    major: profile.major || '',
    yearLevel: profile.yearLevel || '',
  })
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

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      onAvatarUpload(file)
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
      <div className="flex items-center gap-6">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="h-20 w-20 rounded-full border-2 border-stone"
          />
        ) : (
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-stone bg-ink text-2xl font-bold text-paper">
            {formData.displayName?.charAt(0).toUpperCase() || 'U'}
          </div>
        )}
        <div>
          <button
            type="button"
            onClick={handleAvatarClick}
            className="rounded border border-stone px-4 py-2 text-sm text-ink transition-colors hover:bg-stone"
          >
            Change Avatar
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-muted">JPG, PNG. Max 2MB.</p>
        </div>
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="displayName" className="mb-1 block text-sm font-medium text-ink">
          Display Name
        </label>
        <input
          type="text"
          id="displayName"
          name="displayName"
          value={formData.displayName}
          onChange={handleChange}
          className="w-full rounded border border-stone px-4 py-2 text-ink focus:border-ink focus:outline-none"
          required
        />
      </div>

      {/* School */}
      <div>
        <label htmlFor="school" className="mb-1 block text-sm font-medium text-ink">
          School
        </label>
        <input
          type="text"
          id="school"
          name="school"
          value={formData.school}
          onChange={handleChange}
          required
          className="w-full rounded border border-stone px-4 py-2 text-ink focus:border-ink focus:outline-none"
          placeholder="e.g., MIT, Stanford, etc."
        />
      </div>

      {/* Program */}
      <div>
        <label htmlFor="program" className="mb-1 block text-sm font-medium text-ink">
          Program
        </label>
        <input
          type="text"
          id="program"
          name="program"
          value={formData.program}
          onChange={handleChange}
          required
          className="w-full rounded border border-stone px-4 py-2 text-ink focus:border-ink focus:outline-none"
          placeholder="e.g., Computer Science, Biology, etc."
        />
      </div>

      {/* Major */}
      <div>
        <label htmlFor="major" className="mb-1 block text-sm font-medium text-ink">
          Major
        </label>
        <input
          type="text"
          id="major"
          name="major"
          value={formData.major}
          onChange={handleChange}
          required
          className="w-full rounded border border-stone px-4 py-2 text-ink focus:border-ink focus:outline-none"
          placeholder="e.g., Software Engineering, etc."
        />
      </div>

      {/* Year Level */}
      <div>
        <label htmlFor="yearLevel" className="mb-1 block text-sm font-medium text-ink">
          Year Level
        </label>
        <select
          id="yearLevel"
          name="yearLevel"
          value={formData.yearLevel}
          onChange={handleChange}
          required
          className="w-full rounded border border-stone px-4 py-2 text-ink focus:border-ink focus:outline-none"
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
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="rounded border border-ink bg-ink px-6 py-2 text-paper transition-colors hover:bg-stone disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

export default EditProfile
