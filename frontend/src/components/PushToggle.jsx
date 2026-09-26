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
    <div>
      <button
        type="button"
        onClick={enabled ? disable : enable}
        disabled={busy}
        aria-pressed={enabled}
        className="inline-flex items-center gap-2 rounded-soft border-2 border-stone bg-paper px-4 py-2 text-sm font-extrabold text-ink hover:bg-powder disabled:opacity-60"
      >
        {enabled ? (
          <BellOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <BellRing className="h-4 w-4" aria-hidden="true" />
        )}
        {busy ? 'Saving…' : enabled ? 'Disable Push' : 'Enable Push'}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-accent">
          {error}
        </p>
      )}
    </div>
  )
}

export default PushToggle
export { urlBase64ToUint8Array }
