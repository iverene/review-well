// frontend/tests/pages/Home.test.jsx
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import Home from '../../src/pages/Home'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('axios')

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
    expect(screen.getByText('Upload a PDF or PPTX, browse public study guides, and keep everything in one cozy study club.')).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Join the study club' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Try public reviewers' })).toHaveAttribute('href', '/reviewer/public')
  })

  it('frames the trio around current features', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.getByText('Upload your slides')).toBeTruthy()
    expect(screen.getByText('Drop in a PDF or PPTX and keep every reviewer in one personal library.')).toBeTruthy()
    expect(screen.getByText('Discover Study Guides')).toBeTruthy()
    expect(screen.getByText('Browse public reviewers made by fellow students and start with the topics you need most.')).toBeTruthy()
    expect(screen.getByText('Save What Matters')).toBeTruthy()
    expect(screen.getByText('Bookmark the guides you love and follow creators to see their new reviewers.')).toBeTruthy()
  })

  it('contains no workspace-era wording', () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(screen.queryByText('Make studying feel a little more like you.')).toBeNull()
    expect(screen.queryByText('Make it yours')).toBeNull()
    expect(screen.queryByText('Tiny wins count')).toBeNull()
  })
})

describe('Home desk saves display', () => {
  const deskReviewer = (id, saves) => ({
    id,
    title: `Guide ${id}`,
    courseCode: 'CS 101',
    authorId: 'user-1',
    user: { displayName: 'Iverene' },
    _count: { saves },
  })

  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    useAuth.mockReturnValue({
      user: { id: 'user-1', displayName: 'Iverene' },
      isAuthenticated: true,
      isGuest: false,
      loading: false,
    })
    axios.get.mockImplementation((url, config) => {
      if (String(url).includes('/api/reviewers/my')) {
        return Promise.resolve({ data: { reviewers: [deskReviewer('mine-1', 7)] } })
      }
      if (String(url).includes('/api/reviewers/exists')) {
        const ids = String(config?.params?.ids || '').split(',').filter(Boolean)
        return Promise.resolve({ data: { ids: ids.filter((id) => !id.endsWith('-gone')) } })
      }
      return Promise.resolve({ data: { reviewers: [deskReviewer('pub-1', 3)] } })
    })
  })

  it('shows icon + count on recently viewed and same-course cards', async () => {
    window.localStorage.setItem(
      'review-well-recent-reviewers:user-1',
      JSON.stringify([deskReviewer('recent-1', 5)])
    )
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByLabelText('5 saves')).toBeInTheDocument()
    expect(screen.queryByText('5 saves', { exact: false })).toBeNull()
  })

  it('hides saves entirely on My Reviewers cards', async () => {
    render(<MemoryRouter><Home /></MemoryRouter>)
    await screen.findByText('Guide mine-1')
    expect(screen.queryByLabelText('7 saves')).toBeNull()
    expect(screen.queryByText('7 saves')).toBeNull()
  })

  it('prunes deleted reviewers from Recently Viewed on load', async () => {
    window.localStorage.setItem(
      'review-well-recent-reviewers:user-1',
      JSON.stringify([deskReviewer('recent-1', 5), deskReviewer('old-1-gone', 2)])
    )
    render(<MemoryRouter><Home /></MemoryRouter>)
    expect(await screen.findByLabelText('5 saves')).toBeInTheDocument()
    expect(screen.queryByText('Guide old-1-gone')).toBeNull()
    expect(JSON.parse(window.localStorage.getItem('review-well-recent-reviewers:user-1')).map((r) => r.id)).toEqual(['recent-1'])
  })
})
