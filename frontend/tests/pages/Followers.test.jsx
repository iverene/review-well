import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Followers from '../../src/pages/Followers'

const { authState } = vi.hoisted(() => ({
  authState: { user: { id: 'me' }, isAuthenticated: true },
}))

const mockGet = vi.hoisted(() => vi.fn())

vi.mock('axios', () => ({
  default: { get: mockGet },
}))

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => authState,
}))

const renderFollowers = (type) => render(
  <MemoryRouter initialEntries={['/profile/user-9/followers']}>
    <Routes>
      <Route path="/profile/:userId/followers" element={<Followers type={type} />} />
      <Route path="/profile/:userId/following" element={<Followers type={type} />} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => {
  mockGet.mockReset()
  mockGet.mockImplementation((url) => {
    if (url === '/api/profile/user-9') {
      return Promise.resolve({ data: { user: { id: 'user-9', displayName: 'Ann Lee' } } })
    }
    if (url === '/api/social/users/user-9/followers') {
      return Promise.resolve({ data: { users: [{ id: 'user-10', displayName: 'Ben Cruz', school: 'State University' }] } })
    }
    if (url.endsWith('/follow')) {
      return Promise.resolve({ data: { following: false, followerCount: 0 } })
    }
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
})

describe('Followers', () => {
  it('renders the followers page with user rows and follow actions', async () => {
    renderFollowers('followers')
    expect(await screen.findByText('Followers')).toBeInTheDocument()
    expect(await screen.findByText('Ben Cruz')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to profile/ })).toHaveAttribute('href', '/profile/user-9')
  })

  it('shows an empty state when there is nothing to list', async () => {
    mockGet.mockImplementation((url) => {
      if (url === '/api/profile/user-9') {
        return Promise.resolve({ data: { user: { id: 'user-9', displayName: 'Ann Lee' } } })
      }
      return Promise.resolve({ data: { users: [] } })
    })
    renderFollowers('following')
    expect(await screen.findByText('Following')).toBeInTheDocument()
    expect(await screen.findByText('No following yet.')).toBeInTheDocument()
  })
})
