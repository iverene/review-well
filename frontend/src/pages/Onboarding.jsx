import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'

import { useAuth } from '../contexts/AuthContext'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'

const steps = [
  { title: 'Make it yours', fields: ['displayName'] },
  { title: 'Your school life', fields: ['school', 'program'] },
  { title: 'Your study path', fields: ['major', 'yearLevel'] },
]

const yearLevels = [
  { value: 'freshman', label: 'Freshman' },
  { value: 'sophomore', label: 'Sophomore' },
  { value: 'junior', label: 'Junior' },
  { value: 'senior', label: 'Senior' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'phd', label: 'PhD' },
  { value: 'other', label: 'Other' },
]

const Onboarding = () => {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [stepIndex, setStepIndex] = useState(0)
  const [saving, setSaving] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [error, setError] = useState(null)
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    school: user?.school || '',
    program: user?.program || '',
    major: user?.major || '',
    yearLevel: user?.yearLevel || '',
  })

  const currentStep = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  const updateField = (event) => {
    const { name, value } = event.target
    setFormData((previous) => ({ ...previous, [name]: value }))
    setError(null)
  }

  const validateStep = () => {
    const missingField = currentStep.fields.find((field) => !formData[field].trim())
    if (missingField) {
      setError('Please complete this step before continuing.')
      return false
    }
    return true
  }

  const handleNext = async () => {
    if (!validateStep()) return
    if (!isLastStep) {
      setStepIndex((previous) => previous + 1)
      return
    }

    setSaving(true)
    setError(null)
    try {
      await axios.put('/api/profile/me', formData, { withCredentials: true })
      await refreshUser()
      setCompleted(true)
    } catch (saveError) {
      console.error('Failed to complete profile:', saveError)
      setError(getApiErrorMessage(saveError, 'Unable to save your profile. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-xl items-center justify-center">
      <section className="w-full rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8" aria-labelledby="onboarding-title">
        <div className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-extrabold uppercase tracking-widest text-accent">
              Step {stepIndex + 1} of {steps.length}
            </p>
            <h1 id="onboarding-title" className="mt-2 text-3xl font-extrabold text-ink">
              {currentStep.title}
            </h1>
          </div>
          <span className="text-2xl" aria-hidden="true">*</span>
        </div>

        <div className="mb-8 flex gap-2" aria-label={`Step ${stepIndex + 1} of ${steps.length}`}>
          {steps.map((step, index) => (
            <div
              key={step.title}
              className={`h-2 flex-1 rounded-full ${index <= stepIndex ? 'bg-accent' : 'bg-stone'}`}
            />
          ))}
        </div>

        <ErrorAlert className="mb-5">{error}</ErrorAlert>

        {stepIndex === 0 && (
          <div>
            <label htmlFor="displayName" className="mb-2 block text-sm font-extrabold text-ink">
              What should we call you?
            </label>
            <input
              id="displayName"
              name="displayName"
              type="text"
              value={formData.displayName}
              onChange={updateField}
              autoFocus
              className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none"
              placeholder="Your display name"
            />
            <p className="mt-2 text-sm text-muted">This is how your study club friends will see you.</p>
          </div>
        )}

        {stepIndex === 1 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="school" className="mb-2 block text-sm font-extrabold text-ink">School</label>
              <input
                id="school"
                name="school"
                type="text"
                value={formData.school}
                onChange={updateField}
                autoFocus
                className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none"
                placeholder="e.g. University of Toronto"
              />
            </div>
            <div>
              <label htmlFor="program" className="mb-2 block text-sm font-extrabold text-ink">Program or course</label>
              <input
                id="program"
                name="program"
                type="text"
                value={formData.program}
                onChange={updateField}
                className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none"
                placeholder="e.g. Computer Science"
              />
            </div>
          </div>
        )}

        {stepIndex === 2 && (
          <div className="space-y-5">
            <div>
              <label htmlFor="major" className="mb-2 block text-sm font-extrabold text-ink">Major or specialization</label>
              <input
                id="major"
                name="major"
                type="text"
                value={formData.major}
                onChange={updateField}
                autoFocus
                className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none"
                placeholder="e.g. Software Engineering"
              />
            </div>
            <div>
              <label htmlFor="yearLevel" className="mb-2 block text-sm font-extrabold text-ink">Year level</label>
              <select
                id="yearLevel"
                name="yearLevel"
                value={formData.yearLevel}
                onChange={updateField}
                className="w-full rounded-soft border-2 border-stone bg-paper px-4 py-3 text-ink focus:border-accent focus:outline-none"
              >
                <option value="">Select your year level</option>
                {yearLevels.map((level) => <option key={level.value} value={level.value}>{level.label}</option>)}
              </select>
            </div>
          </div>
        )}

        <div className="mt-10 flex justify-between gap-3">
          <button
            type="button"
            onClick={() => setStepIndex((previous) => previous - 1)}
            disabled={stepIndex === 0 || saving}
            className="rounded-soft border-2 border-stone px-5 py-3 text-sm font-extrabold text-ink hover:bg-stone disabled:invisible"
          >
            Back
          </button>
          <button
            type="button"
            onClick={handleNext}
            disabled={saving}
            className="rounded-soft border-2 border-mint bg-mint px-6 py-3 text-sm font-extrabold text-ink hover:bg-butter disabled:opacity-60"
          >
            {saving ? 'Saving...' : isLastStep ? 'Finish profile' : 'Continue'}
          </button>
        </div>
      </section>

      {completed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
          <div className="w-full max-w-md rounded-soft border-2 border-stone bg-paper p-8 text-center club-shadow">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full border-2 border-stone bg-mint text-3xl font-extrabold text-ink" aria-hidden="true">
              OK
            </div>
            <h2 id="welcome-title" className="text-3xl font-extrabold text-ink">Welcome to Review Well!</h2>
            <p className="mt-3 text-muted">Your study space is ready. Let&apos;s make something worth reviewing.</p>
            <button
              type="button"
              onClick={() => navigate('/', { replace: true })}
              className="mt-7 rounded-soft border-2 border-mint bg-mint px-6 py-3 text-sm font-extrabold text-ink hover:bg-butter"
            >
              Enter Review Well
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Onboarding
