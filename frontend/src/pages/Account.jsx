import { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import axios from 'axios'
import { ArrowLeft } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import EditProfile from '../components/profile/EditProfile'
import ErrorAlert from '../components/common/ErrorAlert'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { ProfileSkeleton } from '../components/common/Skeleton'

const Account = () => {
  const { refreshUser } = useAuth()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const isOnboarding = !!location.state?.onboarding

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

  if (loading) {
    return (
      <div className="min-h-screen bg-paper"><ProfileSkeleton /></div>
    )
  }

  return (
    <PageContainer>
      <Link to="/settings" className="mb-3 inline-flex items-center gap-2 text-sm font-extrabold text-muted hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Back to settings
      </Link>
      <PageHeader title={isOnboarding ? 'Complete your profile' : 'Account'} />
      {isOnboarding && (
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
        <section className="mt-5 rounded-soft border-2 border-stone bg-paper p-4 club-shadow sm:p-8" aria-label="Edit account">
          <EditProfile
            profile={profile}
            onSave={handleSave}
            onAvatarUpload={handleAvatarUpload}
            saving={saving}
          />
        </section>
      )}
    </PageContainer>
  )
}

export default Account
