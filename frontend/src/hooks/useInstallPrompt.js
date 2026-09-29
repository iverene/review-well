import { useCallback, useEffect, useState } from 'react'

// Captures the browser's install prompt so the app can offer installation
// on demand (Settings → Install app). Without this, installation depends
// entirely on the browser surfacing its own prompt, which users miss or
// dismiss — and a dismissed prompt is suppressed for months.
const useInstallPrompt = () => {
  const [promptEvent, setPromptEvent] = useState(null)

  useEffect(() => {
    const onBeforeInstall = (event) => {
      event.preventDefault()
      setPromptEvent(event)
    }
    const onInstalled = () => setPromptEvent(null)
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const install = useCallback(async () => {
    if (!promptEvent) return false
    promptEvent.prompt()
    const choice = await promptEvent.userChoice
    const accepted = choice?.outcome === 'accepted'
    if (accepted) setPromptEvent(null)
    return accepted
  }, [promptEvent])

  return { canInstall: !!promptEvent, install }
}

export default useInstallPrompt
