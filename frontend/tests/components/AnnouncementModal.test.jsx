import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'

import AnnouncementModal, { STORAGE_KEY, ANNOUNCEMENT_DELAY_MS } from '../../src/components/AnnouncementModal'

describe('AnnouncementModal', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const openModal = () => {
    render(<AnnouncementModal />)
    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_DELAY_MS)
    })
  }

  it('stays hidden during the entrance delay', () => {
    render(<AnnouncementModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('announces current and coming-soon features on first visit', () => {
    openModal()
    expect(screen.getByRole('dialog', { name: 'Welcome to Review Well' })).toBeInTheDocument()
    expect(screen.getByText('Upload Reviewers as PDF or PPTX')).toBeInTheDocument()
    expect(screen.getByText('AI Flashcards')).toBeInTheDocument()
    expect(screen.getByText('Pomodoro Technique')).toBeInTheDocument()
    expect(screen.getByText('Blurting')).toBeInTheDocument()
  })

  it('never shows again after closing', () => {
    const { unmount } = render(<AnnouncementModal />)
    act(() => {
      vi.advanceTimersByTime(ANNOUNCEMENT_DELAY_MS)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Got It' }))
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dismissed')
    expect(screen.queryByRole('dialog')).toBeNull()
    unmount()
    render(<AnnouncementModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('stays hidden when already dismissed in this browser', () => {
    window.localStorage.setItem(STORAGE_KEY, 'dismissed')
    render(<AnnouncementModal />)
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('fails visible when storage is blocked', () => {
    const getItem = window.localStorage.getItem
    window.localStorage.getItem = () => { throw new Error('blocked') }
    try {
      render(<AnnouncementModal />)
      act(() => {
        vi.advanceTimersByTime(ANNOUNCEMENT_DELAY_MS)
      })
      expect(screen.getByRole('dialog', { name: 'Welcome to Review Well' })).toBeInTheDocument()
    } finally {
      window.localStorage.getItem = getItem
    }
  })

  it('shows the waving character illustration', () => {
    openModal()
    expect(screen.getByAltText('Waving student illustration')).toBeInTheDocument()
  })
})
