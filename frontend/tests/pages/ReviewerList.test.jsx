import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import ReviewerList from '../../src/pages/ReviewerList'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const reviewers = [
  { id: 'r1', title: 'Photosynthesis Guide', courseCode: 'BIO 101', courseDescription: 'Plant biology', _count: { saves: 1 } },
  { id: 'r2', title: 'Algebra Notes', courseCode: 'MATH 101', courseDescription: 'Equations', _count: { saves: 0 } },
]

describe('ReviewerList search', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({ user: null })
    axios.get.mockResolvedValue({ data: { reviewers } })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderList = () => render(
    <MemoryRouter initialEntries={['/reviewer/public']}>
      <ReviewerList />
    </MemoryRouter>
  )

  it('sends the debounced query to the server', async () => {
    renderList()
    await screen.findByText('Photosynthesis Guide')
    fireEvent.change(screen.getByLabelText('Search reviewers'), { target: { value: 'photo' } })
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith(
      '/api/reviewers/public',
      expect.objectContaining({ params: expect.objectContaining({ search: 'photo' }) })
    ), { timeout: 3000 })
  }, 10000)

  it('sends assessment and semester filters to the server', async () => {
    renderList()
    await screen.findByText('Photosynthesis Guide')
    fireEvent.click(screen.getByRole('button', { name: 'Assessment' }))
    fireEvent.click(screen.getByRole('button', { name: 'Midterm' }))
    fireEvent.click(screen.getByRole('button', { name: 'Semester' }))
    fireEvent.click(screen.getByRole('button', { name: 'Summer' }))
    await waitFor(() => expect(axios.get).toHaveBeenCalledWith(
      '/api/reviewers/public',
      expect.objectContaining({ params: expect.objectContaining({ examType: 'midterm', semester: 'Summer' }) })
    ), { timeout: 3000 })
  }, 10000)

  it('clears the query with the X button', async () => {
    renderList()
    await screen.findByText('Photosynthesis Guide')
    fireEvent.change(screen.getByLabelText('Search reviewers'), { target: { value: 'photo' } })
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(screen.getByLabelText('Search reviewers')).toHaveValue('')
  })

  it('shows an inline New button and FAB on My Reviewers', async () => {    render(
      <MemoryRouter initialEntries={['/reviewer/my']}>
        <ReviewerList mine />
      </MemoryRouter>
    )
    await screen.findByText('Photosynthesis Guide')
    expect(screen.getByRole('link', { name: 'New' })).toHaveAttribute('href', '/create')
    expect(screen.getByRole('link', { name: 'New reviewer' })).toHaveAttribute('href', '/create')
  })

  it('shows an upload empty state with logo when My Reviewers is empty', async () => {
    axios.get.mockResolvedValue({ data: { reviewers: [] } })
    render(
      <MemoryRouter initialEntries={['/reviewer/my']}>
        <ReviewerList mine />
      </MemoryRouter>
    )
    expect(await screen.findByText('No Reviewers Yet')).toBeInTheDocument()
    expect(screen.getByText('Upload your first reviewer to start your personal library.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'New Reviewer' })).toHaveAttribute('href', '/create')
  })
})
