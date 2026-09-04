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

vi.mock('axios', () => ({
  default: { get: mockGet, put: mockPut },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

vi.mock('../../src/utils/exportPdf', () => ({
  EXAM_LABELS: { prelim: 'Prelim', midterm: 'Midterm', final: 'Finals' },
  reviewerPdfFilename: (reviewer) => `${reviewer?.courseDescription || 'reviewer'}.pdf`,
  exportSheetsToPdf: vi.fn(),
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
  blocks: [
    { id: 'b1', blockType: 'topic_banner', contentData: { heading: 'Chapter 1' } },
    {
      id: 'b2',
      blockType: 'table',
      contentData: { headers: ['Term', 'Meaning'], rows: [['Alpha', 'First'], ['Beta', 'Second']] },
    },
    {
      id: 'b3',
      blockType: 'terms_card',
      contentData: {
        title: 'Key Terms',
        terms: [
          { term: 'T1', definition: 'D1' },
          { term: 'T2', definition: 'D2' },
          { term: 'T3', definition: 'D3' },
          { term: 'T4', definition: 'D4' },
        ],
      },
    },
    { id: 'b4', blockType: 'content_block', contentData: { heading: 'Notes', body: 'Some study notes here.' } },
  ],
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
  it('renders a truncated preview instead of the exact blocks', async () => {
    renderReviewer()
    const preview = await screen.findByLabelText('Reviewer preview')
    expect(preview).toBeInTheDocument()
    expect(screen.getByText('Chapter 1')).toBeInTheDocument()
    expect(screen.getByText('+1 more terms')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Print' })).toBeInTheDocument()
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
    await screen.findByLabelText('Reviewer preview')
    expect(screen.queryByRole('radiogroup', { name: 'Visibility' })).toBeNull()
    expect(screen.getByText('private')).toBeInTheDocument()
  })

  it('copies a share link with visibility semantics', async () => {
    const writeText = vi.fn().mockResolvedValue()
    Object.assign(navigator, { clipboard: { writeText } })
    renderReviewer()
    await screen.findByLabelText('Reviewer preview')
    fireEvent.click(screen.getByRole('button', { name: 'Share' }))
    expect(screen.getByRole('dialog', { name: 'Share this reviewer' })).toBeInTheDocument()
    expect(screen.getAllByText((content, el) => el?.textContent === 'Unlisted — only people with the shared link can view it.')).toHaveLength(2)
    const expectedUrl = screen.getByLabelText('Share link').value
    expect(expectedUrl).toMatch(/\/reviewer\/r1$/)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(expectedUrl))
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument()
  })

  it('disables preview actions when the reviewer has no content', async () => {
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      }
      return Promise.resolve({ data: { reviewer: { ...mockReviewer, blocks: [] } } })
    })
    renderReviewer()
    await screen.findByText('No content to preview yet')
    expect(screen.queryByLabelText('Reviewer preview')).toBeNull()
    expect(screen.getByRole('button', { name: 'View' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Download' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Print' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Share' })).not.toBeDisabled()
  })

  it('previews the first page inline and paginates the fullscreen view', async () => {
    const manyTerms = Array.from({ length: 10 }, (_, i) => ({ term: `T${i}`, definition: `Definition ${i}` }))
    mockGet.mockImplementation((url) => {
      if (String(url).includes('/save')) {
        return Promise.resolve({ data: { saved: false, saveCount: 0 } })
      }
      return Promise.resolve({
        data: {
          reviewer: {
            ...mockReviewer,
            blocks: [
              ...mockReviewer.blocks,
              { id: 'b5', blockType: 'terms_card', contentData: { title: 'More Terms', terms: manyTerms } },
            ],
          },
        },
      })
    })
    renderReviewer()
    await screen.findByText('Page 1 / 2')
    // Inline preview is restricted to the first page
    expect(document.getElementById('reviewer-preview-root')).toHaveClass('preview-first-only')
    fireEvent.click(screen.getByRole('button', { name: 'View' }))
    expect(screen.getByRole('dialog', { name: 'Fullscreen reviewer preview' })).toBeInTheDocument()
    // Scrollable view carries a live page indicator
    expect(screen.getByText('Page 2 / 2')).toBeInTheDocument()
    expect(screen.getByTestId('page-indicator')).toHaveTextContent('Page 1 / 2')
  })

  it('opens a fullscreen preview with View and exports with Download', async () => {
    const { exportSheetsToPdf } = await import('../../src/utils/exportPdf')
    renderReviewer()
    await screen.findByLabelText('Reviewer preview')
    fireEvent.click(screen.getByRole('button', { name: 'View' }))
    expect(screen.getByRole('dialog', { name: 'Fullscreen reviewer preview' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close preview' }))
    expect(screen.queryByRole('dialog', { name: 'Fullscreen reviewer preview' })).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Download' }))
    await waitFor(() => expect(exportSheetsToPdf).toHaveBeenCalledWith(
      expect.objectContaining({ rootId: 'reviewer-preview-root', pageSelector: '.preview-page' })
    ))
  })

  it('shows a fixed Reviewer header above the document card', async () => {
    renderReviewer()
    expect(await screen.findByRole('heading', { name: 'Reviewer', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('Study guide')).not.toBeInTheDocument()
  })
})
