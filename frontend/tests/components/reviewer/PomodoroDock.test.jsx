import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import axios from 'axios'

import PomodoroDock from '../../../src/components/PomodoroDock'

vi.mock('axios')

const signedProps = { reviewerId: 'reviewer-1', guest: false }

beforeEach(() => {
  vi.useFakeTimers()
  axios.post.mockResolvedValue({ data: { session: { id: 'session-1' } } })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('PomodoroDock', () => {
  it('renders the 25/5 and 50/10 presets plus a custom option', () => {
    render(<PomodoroDock {...signedProps} />)
    expect(screen.getByRole('button', { name: '25/5' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '50/10' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Custom' })).toBeInTheDocument()
  })

  it('starts the countdown and advances with timestamp math', () => {
    render(<PomodoroDock {...signedProps} />)
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('25:00')

    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('24:59')
  })

  it('pauses and resumes without losing elapsed time', () => {
    render(<PomodoroDock {...signedProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('24:55')

    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    act(() => {
      vi.advanceTimersByTime(10000)
    })
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('24:55')

    fireEvent.click(screen.getByRole('button', { name: 'Resume' }))
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('24:50')
  })

  it('posts the completed session with the attached reviewer for signed users', () => {
    render(<PomodoroDock {...signedProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
    fireEvent.change(screen.getByLabelText('Focus minutes'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    act(() => {
      vi.advanceTimersByTime(60 * 1000 + 500)
    })

    // The POST fires synchronously inside the completion tick (only the
    // promise settles async), so no waitFor — it deadlocks under fake timers.
    expect(axios.post).toHaveBeenCalledWith(
      '/api/pomodoro/sessions',
      expect.objectContaining({ reviewerId: 'reviewer-1', focusSeconds: 60 }),
      { withCredentials: true }
    )
  })

  it('never POSTs for guests — the timer stays fully client-side', () => {
    render(<PomodoroDock reviewerId="reviewer-1" guest />)
    fireEvent.click(screen.getByRole('button', { name: 'Custom' }))
    fireEvent.change(screen.getByLabelText('Focus minutes'), { target: { value: '1' } })
    fireEvent.click(screen.getByRole('button', { name: 'Start' }))

    act(() => {
      vi.advanceTimersByTime(60 * 1000 + 500)
    })

    expect(axios.post).not.toHaveBeenCalled()
    expect(screen.getByLabelText('Time remaining')).toHaveTextContent('Break')
  })
})
