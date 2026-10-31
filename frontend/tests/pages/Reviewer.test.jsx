import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom'
import axios from 'axios'

import Reviewer from '../../src/pages/Reviewer'
import useQueryCache from '../../src/stores/queryCache'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'user-1' }, isAuthenticated: true },
}))

const mockGet = vi.hoisted(() => vi.fn())
const mockPut = vi.hoisted(() => vi.fn())
const mockPatch = vi.hoisted(() => vi.fn())
const mockPost = vi.hoisted(() => vi.fn())
const mockDelete = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: {
    get: mockGet,
    put: mockPut,
    patch: mockPatch,
    post: mockPost,
    delete: mockDelete,
    isAxiosError: (error) => !!error?.response || error?.code === 'ERR_NETWORK',
  },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

// PdfViewer pulls the real pdf.js engine, which needs modern JS globals
// (Iterator helpers) absent on older Node — and this suite only cares that
// the hub renders the source viewer slot, which PdfViewer.test.jsx covers
// against a mocked engine.
vi.mock('../../src/components/PdfViewer', () => ({
  default: ({ fileUrl }) => (fileUrl ? <div data-testid="study-source-pdf" /> : null),
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
  useQueryCache.getState().reset()
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
    expect(await screen.findByTestId('study-source-pdf')).toBeInTheDocument()
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
    const banner = await screen.findByTestId('study-upload-banner')
    expect(banner).toHaveTextContent('Add your source file')
    expect(screen.getByRole('link', { name: /Upload a PDF or PPTX/ })).toHaveAttribute('href', '/create?edit=r1')
  })

  it('shows guests the source with no sign-in nudge and zero writes', async () => {
    authState.user = null
    authState.isAuthenticated = false
    renderReviewer()
    expect(await screen.findByTestId('study-source-pdf')).toBeInTheDocument()
    expect(screen.queryByTestId('study-guest-nudge')).toBeNull()
    expect(screen.queryByText('Sign in with Google to save this')).toBeNull()
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
  }, 15000)

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
    expect(await screen.findByRole('dialog', { name: 'Share This Reviewer' })).toBeInTheDocument()
    fireEvent.mouseDown(screen.getByTestId('modal-backdrop'))
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

  it('warns the owner when the shared link only works for them', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await screen.findByRole('dialog', { name: 'Share This Reviewer' })
    expect(screen.getByText((content, el) => el?.tagName === 'SPAN' && el?.textContent?.startsWith('Only you can open this link'))).toBeInTheDocument()
  })

  it('shows no link warning once the reviewer is unlisted', async () => {
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 3 } })
      }
      return Promise.resolve({ data: { reviewer: { ...mockReviewer, visibility: 'unlisted', isDraft: false } } })
    })
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await screen.findByRole('dialog', { name: 'Share This Reviewer' })
    expect(screen.queryByText((content, el) => el?.tagName === 'SPAN' && el?.textContent?.startsWith('Only you can open this link'))).toBeNull()
  })

  it('uses the reviewer title and description as the page header', async () => {
    renderReviewer()
    expect(await screen.findByRole('heading', { name: 'Calculus', level: 1 })).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Reviewer', level: 1 })).toBeNull()
  })

  it('shows study details inline instead of behind a dialog', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    const details = screen.getByLabelText('Study details')
    expect(details).toHaveTextContent('Iverene Grace Causapin')
    expect(details).toHaveTextContent('Midterm')
    expect(details).toHaveTextContent('Fall 2026')
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it('gives owners an edit entry point, including in the mobile menu', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.getByRole('link', { name: 'Edit' })).toHaveAttribute('href', '/create?edit=r1')
    fireEvent.click(screen.getByRole('button', { name: 'More actions' }))
    expect(screen.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('href', '/create?edit=r1')
    expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument()
  })

  it('closes the share dialog with Escape', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    await screen.findByRole('dialog', { name: 'Share This Reviewer' })
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: 'Share This Reviewer' })).toBeNull()
  })

  it('sends guests to sign in, then back, when they try to save', async () => {
    authState.user = null
    authState.isAuthenticated = false
    renderReviewer()
    await screen.findByLabelText('Study hub')
    const save = screen.getByRole('link', { name: 'Sign in to save this reviewer' })
    expect(save.getAttribute('href')).toMatch(/^\/login\?returnTo=/)
    expect(mockPost).not.toHaveBeenCalled()
  })
  it('purges ghost entries from Recently Viewed on 404', async () => {
    window.localStorage.setItem('review-well-recent-reviewers:user-1', JSON.stringify([{ id: 'r1' }]))
    mockGet.mockRejectedValue({ response: { status: 404, data: { error: 'Reviewer not found' } } })
    renderReviewer()
    expect(await screen.findByText('Reviewer not found')).toBeInTheDocument()
    expect(window.localStorage.getItem('review-well-recent-reviewers:user-1')).toBeNull()
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
    const { unmount } = renderReviewer()
    await screen.findByLabelText('Study hub')
    expect(screen.queryByRole('button', { name: 'Delete' })).toBeNull()
    unmount()

    authState.user = null
    authState.isAuthenticated = false
    renderReviewer()
    await screen.findByTestId('study-source-pdf')
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

  it('keeps the source viewer after a visibility change', async () => {
    // The update endpoint returns the bare row: no fileUrl, cards, or quota.
    const row = Object.fromEntries(
      Object.entries(mockReviewer).filter(([key]) => !['fileUrl', 'cards', 'prompts', 'quota', '_count'].includes(key))
    )
    mockPut.mockResolvedValue({ data: { reviewer: { ...row, visibility: 'unlisted', isDraft: false } } })
    renderReviewer()
    await screen.findByTestId('study-source-pdf')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    fireEvent.click(await screen.findByRole('radio', { name: 'Unlisted' }))
    expect(await screen.findByRole('radio', { name: 'Unlisted', checked: true })).toBeInTheDocument()
    expect(screen.getByTestId('study-source-pdf')).toBeInTheDocument()
  })

  it('starts fresh when navigating straight to another reviewer', async () => {
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/save')) return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      if (String(url).endsWith('/r2')) {
        return Promise.resolve({ data: { reviewer: { ...mockReviewer, id: 'r2', title: 'Biology' } } })
      }
      return Promise.resolve({ data: { reviewer: mockReviewer } })
    })
    render(
      <MemoryRouter initialEntries={['/reviewer/r1']}>
        <Link to="/reviewer/r2">Next reviewer</Link>
        <Routes>
          <Route path="/reviewer/:id" element={<Reviewer />} />
        </Routes>
      </MemoryRouter>
    )
    await screen.findByRole('heading', { name: 'Calculus' })
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(await screen.findByRole('dialog', { name: 'Share This Reviewer' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('link', { name: 'Next reviewer' }))

    expect(await screen.findByRole('heading', { name: 'Biology' })).toBeInTheDocument()
    expect(screen.queryByRole('dialog', { name: 'Share This Reviewer' })).toBeNull()
  })

  it('stores only a light preview in Recently Viewed', async () => {
    renderReviewer()
    await screen.findByLabelText('Study hub')
    const [entry] = JSON.parse(window.localStorage.getItem('review-well-recent-reviewers:user-1'))
    expect(entry).toMatchObject({ id: 'r1', title: 'Calculus', courseCode: 'MATH 101' })
    expect(entry).not.toHaveProperty('fileUrl')
    expect(entry).not.toHaveProperty('cards')
    expect(entry).not.toHaveProperty('quota')
  })

  it('uses the saved state from the detail payload instead of fetching it', async () => {
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/save')) return Promise.resolve({ data: { saved: false, saveCount: 3 } })
      return Promise.resolve({ data: { reviewer: { ...mockReviewer, isSaved: true } } })
    })
    renderReviewer()
    expect(await screen.findByRole('button', { name: 'Remove bookmark' })).toHaveAttribute('aria-pressed', 'true')
    expect(mockGet.mock.calls.some(([url]) => String(url).includes('/save'))).toBe(false)
  })
})
