import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import BlurtingMode from '../../../src/components/BlurtingMode'

const baseProps = {
  prompt: 'Explain the key ideas from this material in your own words.',
  guest: false,
  gradesLeft: 4,
  onSubmit: () => {},
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BlurtingMode', () => {
  it('shows the active prompt with a dump box and the AI reviews counter', () => {
    render(<BlurtingMode {...baseProps} />)
    expect(screen.getByText(baseProps.prompt)).toBeInTheDocument()
    expect(screen.getByLabelText('Your Recall')).toBeInTheDocument()
    expect(screen.getByText('4/5 AI reviews left')).toBeInTheDocument()
  })

  it('submits the dump through onSubmit and shows the AI result view', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      gradedVia: 'ai',
      aiScore: 8,
      aiFeedback: 'Strong recall, missed the base cases.',
      missedPoints: ['Base cases'],
      gradesLeft: 3,
    })
    render(<BlurtingMode {...baseProps} onSubmit={onSubmit} />)

    fireEvent.change(screen.getByLabelText('Your Recall'), {
      target: { value: 'Everything I remember...' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Recall' }))

    expect(onSubmit).toHaveBeenCalledWith('Everything I remember...')
    await waitFor(() => {
      expect(screen.getByText('8/10')).toBeInTheDocument()
    })
    expect(screen.getByText('Strong recall, missed the base cases.')).toBeInTheDocument()
    expect(screen.getByText('Base cases')).toBeInTheDocument()
    expect(screen.getByText('3/5 AI reviews left')).toBeInTheDocument()
  })

  it('shows the self-review view with excerpt side-by-side and rating buttons', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      gradedVia: 'self',
      sourceExcerpt: 'Big-O — Growth rate',
      keyPoints: ['Big-O'],
      attemptId: 'attempt-2',
      gradesLeft: 0,
      notice: 'AI feedback limit reached — self-review mode',
    })
    render(<BlurtingMode {...baseProps} gradesLeft={0} onSubmit={onSubmit} />)

    expect(screen.getByText('AI feedback limit reached — self-review mode')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Your Recall'), {
      target: { value: 'Everything I remember...' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Recall' }))

    await waitFor(() => {
      expect(screen.getByText('Big-O — Growth rate')).toBeInTheDocument()
    })
    expect(screen.getByText('Big-O')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Missed' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Partial' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Nailed' })).toBeInTheDocument()
  })

  it('calls the rating callback when a self-rating is picked', async () => {
    const onSubmit = vi.fn().mockResolvedValue({
      gradedVia: 'self',
      sourceExcerpt: 'Big-O — Growth rate',
      keyPoints: ['Big-O'],
      attemptId: 'attempt-2',
      gradesLeft: 0,
    })
    const onRate = vi.fn()
    render(<BlurtingMode {...baseProps} onSubmit={onSubmit} onRate={onRate} />)

    fireEvent.change(screen.getByLabelText('Your Recall'), {
      target: { value: 'Everything I remember...' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Recall' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Nailed' })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: 'Nailed' }))
    expect(onRate).toHaveBeenCalledWith('attempt-2', 'nailed')
  })

  it('stays fully in-memory for guests without calling onSubmit', () => {
    const onSubmit = vi.fn()
    render(<BlurtingMode {...baseProps} guest onSubmit={onSubmit} />)

    expect(screen.getByText('Sign in with Google to save progress')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Your Recall'), {
      target: { value: 'Everything I remember...' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Submit Recall' }))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByText('Everything I remember...')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Nailed' }))
    expect(screen.getByText('Nailed — nice work.')).toBeInTheDocument()
  })
})
