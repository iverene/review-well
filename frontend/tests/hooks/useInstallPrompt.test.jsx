import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import useInstallPrompt from '../../src/hooks/useInstallPrompt'

const Probe = () => {
  const { canInstall, install } = useInstallPrompt()
  return <button type="button" onClick={() => install()}>{canInstall ? 'Install app' : 'No prompt'}</button>
}

const fireInstallPrompt = (outcome = 'accepted') => {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  event.prompt = vi.fn()
  event.userChoice = Promise.resolve({ outcome })
  window.dispatchEvent(event)
  return event
}

describe('useInstallPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reports not installable until the browser fires the prompt', () => {
    render(<Probe />)
    expect(screen.getByRole('button', { name: 'No prompt' })).toBeInTheDocument()
  })

  it('captures the prompt and triggers the install flow on demand', async () => {
    render(<Probe />)
    const event = fireInstallPrompt()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Install app' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Install app' }))
    expect(event.prompt).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.getByRole('button', { name: 'No prompt' })).toBeInTheDocument())
  })

  it('stays installable when the user dismisses the choice', async () => {
    render(<Probe />)
    fireInstallPrompt('dismissed')
    await waitFor(() => expect(screen.getByRole('button', { name: 'Install app' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Install app' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Install app' })).toBeInTheDocument())
  })

  it('hides after the appinstalled event', async () => {
    render(<Probe />)
    fireInstallPrompt()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Install app' })).toBeInTheDocument())
    window.dispatchEvent(new Event('appinstalled'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'No prompt' })).toBeInTheDocument())
  })
})
