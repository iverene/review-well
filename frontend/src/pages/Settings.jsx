import { useState, useEffect } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import axios from 'axios'
import { LogOut, Mail, Settings as SettingsIcon, ShieldCheck } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import EditProfile from '../components/profile/EditProfile'
import ErrorAlert from '../components/common/ErrorAlert'
import { getApiErrorMessage } from '../utils/apiError'
import { ProfileSkeleton } from '../components/common/Skeleton'

const Settings = () => {
  const { user, logout, refreshUser } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [signingOut, setSigningOut] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await axios.get('/api/profile/me', { withCredentials: true })
      setProfile(response.data.user)
    } catch (err) {
      console.error('Failed to fetch profile:', err)
      setError(getApiErrorMessage(err, 'Unable to load your profile.'))
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async (updates) => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await axios.put('/api/profile/me', updates, {
        withCredentials: true,
      })
      setProfile(response.data.user)
      setSuccess(true)
      await refreshUser()
    } catch (err) {
      console.error('Failed to update profile:', err)
      setError(getApiErrorMessage(err, 'Unable to update your profile.'))
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (file) => {
    const formData = new FormData()
    formData.append('avatar', file)

    try {
      const response = await axios.put('/api/profile/me/avatar', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(response.data.user)
      await refreshUser()
    } catch (err) {
      console.error('Failed to upload avatar:', err)
      setError(getApiErrorMessage(err, 'Unable to upload your avatar.'))
      throw err
    }
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    try {
      await logout()
      navigate('/login')
    } finally {
      setSigningOut(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-paper"><ProfileSkeleton /></div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl pb-10">
      <h1 className="mt-1 font-display text-4xl font-bold text-ink">
        {location.state?.onboarding ? 'Complete your profile' : 'Settings'}
      </h1>
      {location.state?.onboarding && (
        <p className="mt-2 text-muted">
          Add your academic information before you continue.
        </p>
      )}

      <ErrorAlert className="mt-4">{error}</ErrorAlert>

      {success && (
        <div className="mt-4 rounded-soft border-2 border-mint bg-mint/40 p-4 text-sm font-bold text-ink" role="status">
          Profile updated successfully
        </div>
      )}

      {profile && (
        <section className="mt-5 rounded-soft border-2 border-stone bg-paper p-6 club-shadow sm:p-8" aria-label="Edit profile">
          <EditProfile
            profile={profile}
            onSave={handleSave}
            onAvatarUpload={handleAvatarUpload}
            saving={saving}
          />
        </section>
      )}

      <section className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow" aria-label="Account">
        <h2 className="font-display text-xl font-bold text-ink">Account</h2>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-powder" aria-hidden="true">
              <Mail className="h-4 w-4 text-ink" />
            </span>
            <span>
              <span className="block text-xs font-extrabold uppercase tracking-widest text-muted">Signed in as</span>
              <span className="block text-sm font-bold text-ink">{user?.email}</span>
            </span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-blush disabled:opacity-60"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </section>

      <section className="mt-4 rounded-soft border-2 border-stone bg-paper p-6 club-shadow" aria-label="Legal">
        <h2 className="flex items-center gap-2 font-display text-xl font-bold text-ink">
          <ShieldCheck className="h-5 w-5 text-accent" aria-hidden="true" /> Legal
        </h2>
        <div className="mt-3 flex flex-col gap-1 text-sm font-bold">
          <Link to="/privacy" className="rounded-soft px-2 py-2 text-ink hover:bg-powder">Privacy Policy</Link>
          <Link to="/terms" className="rounded-soft px-2 py-2 text-ink hover:bg-powder">Terms and Conditions</Link>
        </div>
      </section>
    </div>
  )
}

export default Settings
