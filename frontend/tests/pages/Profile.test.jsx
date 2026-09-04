import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Profile from '../../src/pages/Profile'

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

const ownProfile = {
  id: 'me',
  displayName: 'Me User',
  email: 'me@example.com',
  avatarUrl: null,
  school: 'State University',
  program: 'BSCS',
  reviewerCount: 2,
  followerCount: 5,
  followingCount: 3,
}

const otherProfile = {
  id: 'user-9',
  displayName: 'Ann Lee',
  email: 'ann@example.com',
  avatarUrl: null,
  school: 'State University',
  reviewerCount: 1,
  followerCount: 2,
  followingCount: 0,
  isFollowing: false,
}

const ownReviewers = [
  { id: 'r1', title: 'My Guide', courseCode: 'CS 101', visibility: 'public', _count: { saves: 4 } },
]
const savedReviewers = [
  { id: 'r2', title: 'Saved Guide', courseCode: 'MATH 101', _count: { saves: 7 } },
]
const authorReviewers = [
  { id: 'r3', title: 'Ann Public Guide', courseCode: 'ENG 101', _count: { saves: 1 } },
]

const renderProfile = (entry, path) => render(
  <MemoryRouter initialEntries={[entry]}>
    <Routes>
      <Route path={path} element={<Profile />} />
    </Routes>
  </MemoryRouter>
)

beforeEach(() => {
  mockGet.mockReset()
  mockGet.mockImplementation((url) => {
    if (url === '/api/profile/me') return Promise.resolve({ data: { user: ownProfile } })
    if (url === '/api/profile/user-9') return Promise.resolve({ data: { user: otherProfile } })
    if (url === '/api/reviewers/my') return Promise.resolve({ data: { reviewers: ownReviewers } })
    if (url === '/api/reviewers/author/user-9') return Promise.resolve({ data: { reviewers: authorReviewers } })
    if (url === '/api/social/saved') return Promise.resolve({ data: { reviewers: savedReviewers } })
    if (url === '/api/social/users/me/followers') {
      return Promise.resolve({ data: { users: [{ id: 'user-9', displayName: 'Ann Lee', school: 'State University' }] } })
    }
    if (url === '/api/social/users/me/following') return Promise.resolve({ data: { users: [] } })
    if (url.endsWith('/follow')) return Promise.resolve({ data: { following: false, followerCount: 2, followingCount: 0 } })
    return Promise.reject(new Error(`Unexpected GET ${url}`))
  })
  authState.user = { id: 'me' }
  authState.isAuthenticated = true
})

describe('Profile', () => {
  it('renders the own profile with Reviewers and Saved Reviewers tabs', async () => {
    renderProfile('/profile', '/profile')
    expect(await screen.findByText('Me User')).toBeInTheDocument()
    expect(screen.queryByText('me@example.com')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Reviewers' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Saved Reviewers' })).toBeInTheDocument()
    expect(screen.queryByText('Recent Reviewers')).toBeNull()
    expect(await screen.findByText('My Guide')).toBeInTheDocument()
  })

  it('switches to the Saved Reviewers tab', async () => {
    renderProfile('/profile', '/profile')
    await screen.findByText('My Guide')
    fireEvent.click(screen.getByRole('tab', { name: 'Saved Reviewers' }))
    expect(await screen.findByText('Saved Guide')).toBeInTheDocument()
    expect(screen.queryByText('My Guide')).toBeNull()
  })

  it('links to dedicated followers and following pages', async () => {
    renderProfile('/profile', '/profile')
    await screen.findByText('Me User')
    expect(screen.getByRole('link', { name: /View followers/ })).toHaveAttribute('href', '/profile/me/followers')
    expect(screen.getByRole('link', { name: /View following/ })).toHaveAttribute('href', '/profile/me/following')
  })

  it('renders another user profile with follow button and public reviewers', async () => {
    renderProfile('/profile/user-9', '/profile/:userId')
    expect(await screen.findByText('Ann Lee')).toBeInTheDocument()
    // Email stays private on other profiles
    expect(screen.queryByText('ann@example.com')).toBeNull()
    // Saved tab is private to the owner
    expect(screen.queryByRole('tab', { name: /Saved Reviewers/ })).toBeNull()
    expect(screen.getByRole('button', { name: 'Follow' })).toBeInTheDocument()
    expect(await screen.findByText('Ann Public Guide')).toBeInTheDocument()
  })

  it('shows a fixed Profile header without the kicker', async () => {
    renderProfile('/profile', '/profile')
    expect(await screen.findByRole('heading', { name: 'Profile', level: 1 })).toBeInTheDocument()
    expect(screen.queryByText('Your study desk')).not.toBeInTheDocument()
    expect(screen.queryByText('Study buddy')).not.toBeInTheDocument()
  })
})
