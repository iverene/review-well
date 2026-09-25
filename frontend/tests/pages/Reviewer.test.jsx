import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import Reviewer from '../../src/pages/Reviewer'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'user-1' }, isAuthenticated: true },
}))

const mockGet = vi.hoisted(() => vi.fn())
const mockPut = vi.hoisted(() => vi.fn())
const mockPatch = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { get: mockGet, put: mockPut, patch: mockPatch, post: mockPost, delete: mockDelete },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

const mockReviewer = {
  id: 'r1',
  title: 'Calculus',
  courseCode: 'MATH 101',
  courseDescription: 'Calculus I',
  semester: 'Fall 2026',
  examType: 'midterm',
  visibility: 'private',
  authorId: 'user-1',
  updatedAt: '2026-09-01T00:00:00.000Z',
  user: { displayName: 'Iverene Grace Causapin' },
  _count: { saves: 3 },
  fileUrl: 'https://storage.example.com/v1.pdf',
  cards: [
    { id: 'card-1', front: 'Front 1', back: 'Back 1', known: false },
    { id: 'card-2', front: 'Front 2', back: 'Back 2', known: true },
  ],
  prompts: ['Explain the light reactions'],
  quota: { decksLeft: 3, gradesLeft: 5 },
}

const renderReviewer = () => render(
  <MemoryRouter initialEntries={['/reviewer/r1']}>
    <Routes>
      <Route path="/reviewer/:id" element={<Reviewer />} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => {
  mockGet.mockReset()
  mockPut.mockReset()
  mockPatch.mockReset()
  mockPost.mockReset()
  mockDelete.mockReset()
  mockGet.mockImplementation((url) => {
    if (String(url).includes('/save')) {
      return Promise.resolve({ data: { saved: false, saveCount: 3 } })
    }
    return Promise.resolve({ data: { reviewer: mockReviewer } })
  })
  authState.user = { id: 'user-1' }
  authState.isAuthenticated = true
  window.localStorage.clear()
})

describe('Reviewer', () => {
  it('renders the study hub with Source, Flashcards, and Blurting tabs', async () => {
    renderReviewer()
    expect(await screen.findByLabelText('Study hub')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Source' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Flashcards' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Blurting' })).toBeInTheDocument()
    expect(screen.getByTestId('study-source-pdf')).toBeInTheDocument()
    expect(screen.getByLabelText('Pomodoro timer')).toBeInTheDocument()
  })

  it('wires flashcards with real data and persists Known toggles', async () => {
    mockPatch.mockResolvedValue({ data: { card: { ...mockReviewer.cards[0], known: true } } })
    renderReviewer()
    fireEvent.click(await screen.findByRole('tab', { name: 'Flashcards' }))
    expect(await screen.findByText('Front 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Mark as known' }))
    await waitFor(() => expect(axios.patch).toHaveBeenCalledWith('/api/cards/card-1', { known: true }, { withCredentials: true }))
  })

  it('wires the blurting prompt with remaining grades', async () => {
    renderReviewer()
    fireEvent.click(await screen.findByRole('tab', { name: 'Blurting' }))
    expect(await screen.findByTestId('blurting-prompt')).toHaveTextContent('Explain the light reactions')
    expect(screen.getByTestId('blurting-counter')).toHaveTextContent('5/5 AI reviews left')
  })

  it('shows the owner upload banner when the reviewer has no source file', async () => {
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 3 } })
      }
      return Promise.resolve({ data: { reviewer: { ...mockReviewer, fileUrl: null } } })
    })
    renderReviewer()
    expect(await screen.findByTestId('study-upload-banner')).toHaveTextContent(
      'Please upload the source file to enable study modes'
    )
  })

  it('shows guests a sign-in nudge with a return URL and zero writes', async () => {
    authState.user = null
    authState.isAuthenticated = false
    renderReviewer()
    const nudge = await screen.findByTestId('study-guest-nudge')
    expect(nudge).toBeInTheDocument()
    expect(nudge.querySelector('a')).toHaveAttribute('href', '/login?returnTo=%2Freviewer%2Fr1')
    fireEvent.click(screen.getByRole('tab', { name: 'Flashcards' }))
    expect(await screen.findByTestId('deck-guest-banner')).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
    expect(mockPatch).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('lets the owner change visibility', async () => {
    mockPut.mockResolvedValue({ data: { reviewer: { ...mockReviewer, visibility: 'public' } } })
    renderReviewer()
    const group = await screen.findByRole('radiogroup', { name: 'Visibility' })
    expect(group).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Public' }))
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/reviewers/r1', { visibility: 'public', isDraft: false }, { withCredentials: true }))
    expect(await screen.findByRole('radio', { name: 'Public', checked: true })).toBeInTheDocument()
  })

  it('shows a static visibility badge to non-owners', async () => {
    authState.user = { id: 'someone-else' }
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.queryByRole('radiogroup', { name: 'Visibility' })).toBeNull()
    expect(screen.getByText('private')).toBeInTheDocument()
  })

  it('copies a share link with visibility semantics', async () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('dialog', { name: 'Share this reviewer' })).toBeInTheDocument()
    expect(screen.getAllByText((content, el) => el?.textContent === 'Unlisted — only people with the shared link can view it.')).toHaveLength(2)
    const expectedUrl = screen.getByLabelText('Share link').value
    expect(expectedUrl).toMatch(/\/reviewer\/r1$/)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedUrl))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('shows a fixed Reviewer header above the study hub', async () => {
    renderReviewer()
    expect(await screen.findByRole('heading', { name: 'Reviewer', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('Study guide')).not.toBeInTheDocument()
  })

  it('shows the delete button to the owner only', async () => {
    renderReviewer()
    expect(await screen.findByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('hides the delete button from non-owners and guests', async () => {
    authState.user = { id: 'someone-else' }
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()

    authState.user = null
    authState.isAuthenticated = false
    renderReviewer()
    await screen.findByTestId('study-guest-nudge')
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
  })

  it('asks for confirmation and deletes, then leaves for My Reviewers', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    mockDelete.mockResolvedValue({ data: {} })
    render(
      <MemoryRouter initialEntries={['/reviewer/r1']}>
        <Routes>
          <Route path="/reviewer/:id" element={<Reviewer />} />
          <Route path="/reviewer/my" element={<div>My reviewers</div>} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/api/reviewers/r1', { withCredentials: true }))
    expect(await screen.findByText('My reviewers')).toBeInTheDocument()
    confirmSpy.mockRestore()
  })

  it('does not delete when the confirmation is dismissed', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false)
    renderReviewer()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
    expect(await screen.findByLabelText('Study hub')).toBeInTheDocument()
    confirmSpy.mockRestore()
  })
})
