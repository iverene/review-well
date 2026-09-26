import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import axios from 'axios'
import { Mail } from 'lucide-react'

import { useAuth } from '../contexts/AuthContext'
import EditProfile from '../components/profile/EditProfile'
import ErrorAlert from '../components/common/ErrorAlert'
import PageHeader from '../components/common/PageHeader'
import PageContainer from '../components/common/PageContainer'
import { getApiErrorMessage } from '../utils/apiError'
import { ProfileSkeleton } from '../components/common/Skeleton'
import useCachedGet from '../hooks/useCachedGet'
import useQueryCache from '../stores/queryCache'

const Account = () => {
  const { user, refreshUser } = useAuth()
  const location = useLocation()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const isOnboarding = !!location.state?.onboarding

  const { data: profileData, loading: profileLoading, error: profileError } = useCachedGet(
    'GET /api/profile/me',
    () => axios.get('/api/profile/me', { withCredentials: true })
  )

  useEffect(() => {
    setProfile(profileData?.user || null)
    setLoading(profileLoading)
  }, [profileData, profileLoading])

  useEffect(() => {
    if (profileError) setError(getApiErrorMessage(profileError, 'Unable to load your profile.'))
  }, [profileError])

  const handleSave = async (updates) => {
    setSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await axios.put('/api/profile/me', updates, {
        withCredentials: true,
      })
      setProfile(response.data.user)
      useQueryCache.getState().invalidate('GET /api/profile/me')
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
      useQueryCache.getState().invalidate('GET /api/profile/me')
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
      <PageHeader title={isOnboarding ? 'Complete Your Profile' : 'Account'} />
      {user?.email && (
        <div className="mt-3 flex items-center gap-3" aria-label="Signed in">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-powder" aria-hidden="true">
            <Mail className="h-4 w-4 text-ink" />
          </span>
          <span>
            <span className="block text-xs font-extrabold uppercase tracking-widest text-muted">Signed in as</span>
            <span className="block text-sm font-bold text-ink">{user.email}</span>
          </span>
        </div>
      )}
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
