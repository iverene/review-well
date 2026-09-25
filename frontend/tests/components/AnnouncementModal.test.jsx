import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import AnnouncementModal, { STORAGE_KEY } from '../../src/components/AnnouncementModal'

describe('AnnouncementModal', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('announces current and coming-soon features on first visit', () => {
    render(<AnnouncementModal />)
    expect(screen.getByRole('dialog', { name: 'Welcome to Review Well' })).toBeInTheDocument()
    expect(screen.getByText('Upload Reviewers as PDF or PPTX')).toBeInTheDocument()
    expect(screen.getByText('AI Flashcards')).toBeInTheDocument()
    expect(screen.getByText('Pomodoro Technique')).toBeInTheDocument()
    expect(screen.getByText('Blurting')).toBeInTheDocument()
  })

  it('never shows again after closing', () => {
    const { unmount } = render(<AnnouncementModal />)
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
      expect(screen.getByRole('dialog', { name: 'Welcome to Review Well' })).toBeInTheDocument()
    } finally {
      window.localStorage.getItem = getItem
    }
  })

  it('dismisses when clicking outside the card', () => {
    const { container } = render(<AnnouncementModal />)
    fireEvent.click(container.querySelector('.fixed.inset-0.z-40'))
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dismissed')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('shows the waving character illustration', () => {
    render(<AnnouncementModal />)
    expect(screen.getByAltText('Waving student illustration')).toBeInTheDocument()
  })
})
