import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import EditProfile from '../components/profile/EditProfile'

const Settings = () => {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
      setError('Failed to load profile')
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
      setError('Failed to update profile')
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
      setError('Failed to upload avatar')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <div className="text-muted">Loading settings...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-paper">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-8 text-2xl font-bold text-ink">Settings</h1>

        {error && (
          <div className="mb-4 rounded border border-ink bg-paper p-4 text-ink">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 rounded border border-stone bg-paper p-4 text-ink">
            Profile updated successfully
          </div>
        )}

        {profile && (
          <EditProfile
            profile={profile}
            onSave={handleSave}
            onAvatarUpload={handleAvatarUpload}
            saving={saving}
          />
        )}

        <div className="mt-8 border-t border-stone pt-8">
          <h2 className="mb-4 text-lg font-semibold text-ink">Account</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-muted">Email</label>
              <div className="text-ink">{user?.email}</div>
            </div>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-muted hover:text-ink"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings
