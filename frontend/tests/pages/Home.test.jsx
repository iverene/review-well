// frontend/tests/pages/Home.test.jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Home from '../../src/pages/Home'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('Home landing copy', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isGuest: false,
      loading: false,
    })
  })

  it('sells upload-first studying in the hero', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Upload your slides. Study them well.')).toBeTruthy()
    expect(screen.getByText('Turn lecture slides into study sessions.')).toBeTruthy()
    expect(screen.getByText('Upload a PDF or PPTX, get AI-made flashcards and blurting prompts, and review in focused Pomodoro sprints — all in one cozy study club.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Join the study club' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Try public reviewers' })).toHaveAttribute('href', '/reviewer/public')
  })

  it('frames the trio around the three study pillars', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Upload your slides')).toBeTruthy()
    expect(screen.getByText('Drop in a PDF or PPTX and keep every reviewer in one personal library.')).toBeTruthy()
    expect(screen.getByText('Study with techniques')).toBeTruthy()
    expect(screen.getByText('Flip AI-made flashcards and dump what you remember with blurting prompts.')).toBeTruthy()
    expect(screen.getByText('Stay in the zone')).toBeTruthy()
    expect(screen.getByText('Review in Pomodoro sprints, track daily focus, and grow a study streak.')).toBeTruthy()
  })

  it('contains no workspace-era wording', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.queryByText('Make studying feel a little more like you.')).toBeNull()
    expect(screen.queryByText('Make it yours')).toBeNull()
    expect(screen.queryByText('Tiny wins count')).toBeNull()
  })
})
