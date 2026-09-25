import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import { ToastProvider, useToast } from '../../src/contexts/ToastContext'

const ShowButton = ({ message = 'Saved to Your Library', type = 'success' }) => {
  const toast = useToast()
  return (
    <button type="button" onClick={() => toast[type](message)}>
      show
    </button>
  )
}

describe('ToastProvider', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a toast and dismisses it after a few seconds', () => {
    render(<ToastProvider><ShowButton /></ToastProvider>)
    expect(screen.queryByRole('status')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'show' }))
    expect(screen.getByRole('status')).toHaveTextContent('Saved to Your Library')
    act(() => {
      vi.advanceTimersByTime(4000)
    })
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('never stacks: a new toast replaces the current one', () => {
    render(<ToastProvider><ShowButton /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'show' }))
    expect(screen.getByRole('status')).toHaveTextContent('Saved to Your Library')
    fireEvent.click(screen.getByRole('button', { name: 'show' }))
    expect(screen.getAllByRole('status')).toHaveLength(1)
  })

  it('dismisses immediately from the close button', () => {
    render(<ToastProvider><ShowButton /></ToastProvider>)
    fireEvent.click(screen.getByRole('button', { name: 'show' }))
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss notification' }))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('falls back to no-op functions outside the provider', () => {
    const Probe = () => {
      const toast = useToast()
      return (
        <button type="button" onClick={() => toast.success('hi')}>
          probe
        </button>
      )
    }
    render(<Probe />)
    expect(() => fireEvent.click(screen.getByRole('button', { name: 'probe' }))).not.toThrow()
    expect(screen.queryByRole('status')).toBeNull()
  })
})
