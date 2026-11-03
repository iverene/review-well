import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import axios from 'axios'

import NavigationShell from '../../src/components/layout/NavigationShell'
import ReviewerList from '../../src/pages/ReviewerList'
import { useAuth } from '../../src/contexts/AuthContext'
import useQueryCache from '../../src/stores/queryCache'

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const Where = () => {
  const location = useLocation()
  return <p data-testid="where">{`${location.pathname}${location.search}`}</p>
}

const renderShell = (path = '/') => render(
  <MemoryRouter initialEntries={[path]}>
    <NavigationShell>
      <Routes>
        <Route path="/reviewer/public" element={<ReviewerList />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </NavigationShell>
  </MemoryRouter>
)

describe('NavigationShell (Soft Pop)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQueryCache.getState().reset()
    useAuth.mockReturnValue({ user: { id: 'u1', displayName: 'Ann' }, isAuthenticated: true, logout: vi.fn() })
    axios.get.mockResolvedValue({ data: { reviewers: [], count: 0 } })
  })

  it('marks the current destination in the floating dock and labels it', () => {
    renderShell('/friends')
    const nav = screen.getByRole('navigation', { name: 'Primary navigation' })
    const current = nav.querySelector('[aria-current="page"]')
    expect(current).toHaveAccessibleName('Friends')
    expect(current).toHaveTextContent('Friends')
    expect(screen.getByRole('link', { name: 'Home' })).not.toHaveAttribute('aria-current')
  })

  it('sends a header search to the public library with the query', async () => {
    renderShell('/')
    fireEvent.change(screen.getByRole('searchbox', { name: 'Search reviewers' }), { target: { value: 'social issues' } })
    fireEvent.submit(screen.getByRole('search'))
    const libraryField = await screen.findByLabelText('Search reviewers', { selector: 'main input' })
    expect(libraryField).toHaveValue('social issues')
  })

  it('shows sign-in and no dock for visitors', () => {
    useAuth.mockReturnValue({ user: null, isAuthenticated: false, loading: false, signInWithGoogle: vi.fn() })
    renderShell('/')
    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeInTheDocument()
    expect(screen.queryByRole('navigation', { name: 'Primary navigation' })).toBeNull()
  })
})
