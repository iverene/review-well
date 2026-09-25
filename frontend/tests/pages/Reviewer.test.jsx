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
  it('renders the source-only hub with no study-mode tabs', async () => {
    renderReviewer()
    expect(await screen.findByLabelText('Study hub')).toBeInTheDocument()
    expect(screen.getByTestId('study-source-pdf')).toBeInTheDocument()
    expect(screen.queryByRole('tablist', { name: 'Study modes' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Flashcards' })).toBeNull()
    expect(screen.queryByRole('tab', { name: 'Blurting' })).toBeNull()
    expect(screen.queryByLabelText('Pomodoro timer')).toBeNull()
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
    expect(await screen.findByTestId('study-source-pdf')).toBeInTheDocument()
    expect(mockPost).not.toHaveBeenCalled()
    expect(mockPatch).not.toHaveBeenCalled()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('lets the owner change visibility from inside Share', async () => {
    mockPut.mockResolvedValue({ data: { reviewer: { ...mockReviewer, visibility: 'public' } } })
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.queryByRole('radiogroup', { name: 'Visibility' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    const group = await screen.findByRole('radiogroup', { name: 'Visibility' })
    expect(group).toBeInTheDocument()
    fireEvent.click(screen.getByRole('radio', { name: 'Public' }))
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith('/api/reviewers/r1', { visibility: 'public', isDraft: false }, { withCredentials: true }))
    expect(await screen.findByRole('radio', { name: 'Public', checked: true })).toBeInTheDocument()
  })

  it('shows no visibility badge to non-owners', async () => {
    authState.user = { id: 'someone-else' }
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.queryByRole('radiogroup', { name: 'Visibility' })).toBeNull()
    expect(screen.queryByText('private')).toBeNull()
  })

  it('closes the share dialog when clicking anywhere outside the card', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    const dialog = await screen.findByRole('dialog', { name: 'Share This Reviewer' })
    expect(dialog).toBeInTheDocument()
    fireEvent.click(dialog.parentElement)
    expect(screen.queryByRole('dialog', { name: 'Share This Reviewer' })).toBeNull()
  })

  it('copies a share link with visibility semantics', async () => {    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('dialog', { name: 'Share This Reviewer' })).toBeInTheDocument()
    expect(screen.getAllByText((content, el) => el?.textContent === 'Unlisted — only people with the shared link can view it.')).toHaveLength(2)
    const expectedUrl = screen.getByLabelText('Share link').value
    expect(expectedUrl).toMatch(/\/reviewer\/r1$/)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedUrl))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('uses the reviewer title and description as the page header', async () => {
    renderReviewer()
    expect(await screen.findByRole('heading', { name: 'Calculus', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Reviewer', level: 1 })).toBeNull()
  })

  it('opens study details from the more menu and closes on backdrop click', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'View Details' }))
    const dialog = await screen.findByRole('dialog', { name: 'Study details' })
    expect(dialog).toBeInTheDocument()
    expect(dialog).toHaveTextContent('Iverene Grace Causapin')
    fireEvent.click(document.querySelector('.fixed.inset-0.z-40'))
    expect(screen.queryByRole('dialog', { name: 'Study details' })).toBeNull()
  })

  it('shows the creator in Study Details instead of a header meta row', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.getByText('Creator')).toBeInTheDocument()
    expect(screen.getByText('Iverene Grace Causapin')).toBeInTheDocument()
    expect(screen.queryByText('By Iverene Grace Causapin')).toBeNull()
  })

  it('offers the exact uploaded file for download beside Save', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.getByRole('link', { name: 'Download this reviewer file' })).toHaveAttribute(
      'href',
      '/api/reviewer-files/r1/download'
    )
  })

  it('shows the upload date instead of last-updated', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.getByText('Uploaded')).toBeInTheDocument()
    expect(screen.queryByText('Last Updated')).toBeNull()
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
    window.localStorage.setItem('review-well-recent-reviewers:user-1', JSON.stringify([{ id: 'r1' }, { id: 'r2' }]))
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
    expect(await screen.findByRole('alertdialog', { name: 'Delete This Reviewer?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Yes, Delete' }))
    await waitFor(() => expect(axios.delete).toHaveBeenCalledWith('/api/reviewers/r1', { withCredentials: true }))
    expect(JSON.parse(window.localStorage.getItem('review-well-recent-reviewers:user-1'))).toEqual([{ id: 'r2' }])
    expect(await screen.findByText('My reviewers')).toBeInTheDocument()
  })

  it('does not delete when the confirmation is dismissed', async () => {
    renderReviewer()
    fireEvent.click(await screen.findByRole('button', { name: 'Delete' }))
    expect(await screen.findByRole('alertdialog', { name: 'Delete This Reviewer?' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Keep It' }))
    expect(mockDelete).not.toHaveBeenCalled()
    expect(await screen.findByLabelText('Study hub')).toBeInTheDocument()
  })
})
