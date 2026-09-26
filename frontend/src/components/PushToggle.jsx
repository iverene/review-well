import { useEffect, useState } from 'react'
import { BellOff, BellRing } from 'lucide-react'
import axios from 'axios'

const urlBase64ToUint8Array = (base64String) => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(base64)
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)))
}

const pushSupported = () =>
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window

// Push opt-in: subscribes the browser endpoint (stored per user server-side)
// or removes it. Shows live status; degrades gracefully where unsupported.
const PushToggle = () => {
  const [supported] = useState(pushSupported)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!supported) return
    let cancelled = false
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        if (!cancelled) setEnabled(!!subscription)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [supported])

  if (!supported) {
    return <p className="text-sm text-muted">Push notifications are not supported on this browser.</p>
  }

  const enable = async () => {
    setBusy(true)
    setError(null)
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setError('Permission denied — enable notifications in your browser settings to opt in.')
        return
      }
      const { data } = await axios.get('/api/push/vapid-public-key')
      if (!data.publicKey) {
        setError('Push is not configured yet. Please try again later.')
        return
      }
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(data.publicKey),
      })
      await axios.post(
        '/api/push/subscribe',
        { endpoint: subscription.endpoint, keys: subscription.toJSON().keys },
        { withCredentials: true }
      )
      setEnabled(true)
    } catch (err) {
      console.error('Failed to enable push:', err)
      setError('Unable to enable push notifications. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await axios.delete('/api/push/unsubscribe', {
          data: { endpoint: subscription.endpoint },
          withCredentials: true,
        })
        await subscription.unsubscribe()
      }
      setEnabled(false)
    } catch (err) {
      console.error('Failed to disable push:', err)
      setError('Unable to disable push notifications. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-extrabold text-ink">
          {enabled ? (
            <BellRing className="h-4 w-4 text-accent" aria-hidden="true" />
          ) : (
            <BellOff className="h-4 w-4 text-muted" aria-hidden="true" />
          )}
          Push Notifications
        </p>
        <p className="mt-0.5 text-xs font-semibold text-muted">
          {enabled ? 'On — new follows, saves, and reviews will buzz you.' : 'Off — turn on to get buzzed.'}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-xs font-bold text-accent">
            {error}
          </p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label="Push notifications"
        onClick={enabled ? disable : enable}
        disabled={busy}
        className={`relative h-7 w-12 shrink-0 rounded-full border-2 transition-colors disabled:opacity-60 ${
          enabled ? 'border-accent bg-accent' : 'border-stone bg-stone/40'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full bg-paper shadow transition-all ${
            enabled ? 'left-[22px]' : 'left-[2px]'
          }`}
        />
      </button>
    </div>
  )
}

export default PushToggle
export { urlBase64ToUint8Array }
