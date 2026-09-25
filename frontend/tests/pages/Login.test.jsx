import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import Login, { isGuestSafePath } from '../../src/pages/Login'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('../../src/components/auth/LoginButton', () => ({
  default: () => <button type="button">Sign in with Google</button>,
}))

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuest: false,
      loading: false,
      continueAsGuest: vi.fn(),
    })
  })

  it('links the Terms of Service and Privacy Policy', () => {
    render(<MemoryRouter><Login /></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'Terms of Service' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
  })

  // ?returnTo= (emitted by study-hub guest nudges) wins over location.state.
  const renderAt = (entry) => render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reviewer/:id" element={<div>Study hub</div>} />
        <Route path="/" element={<div>Home page</div>} />
      </Routes>
    </MemoryRouter>
  )

  it('sends signed-in users to ?returnTo= instead of home', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isGuest: false,
      loading: false,
      continueAsGuest: vi.fn(),
    })
    renderAt('/login?returnTo=%2Freviewer%2Fr1')
    expect(screen.getByText('Study hub')).toBeTruthy()
  })

  it('sends guests to ?returnTo= after Browse as Guest', () => {
    const continueAsGuest = vi.fn()
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuest: false,
      loading: false,
      continueAsGuest,
    })
    renderAt('/login?returnTo=%2Freviewer%2Fr1')
    fireEvent.click(screen.getByRole('button', { name: 'Browse as Guest' }))
    expect(continueAsGuest).toHaveBeenCalled()
    expect(screen.getByText('Study hub')).toBeTruthy()
  })

  it('falls back to location.state.from when no returnTo is present', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isGuest: false,
      loading: false,
      continueAsGuest: vi.fn(),
    })
    renderAt({ pathname: '/login', state: { from: { pathname: '/reviewer/r9' } } })
    expect(screen.getByText('Study hub')).toBeTruthy()
  })

  it('ignores an off-site returnTo', () => {
    useAuth.mockReturnValue({
      isAuthenticated: true,
      isGuest: false,
      loading: false,
      continueAsGuest: vi.fn(),
    })
    renderAt('/login?returnTo=https%3A%2F%2Fevil.example%2F')
    expect(screen.getByText('Home page')).toBeTruthy()
  })

  it('never auto-redirects guests (no ProtectedRoute loop)', () => {
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuest: true,
      loading: false,
      continueAsGuest: vi.fn(),
    })
    renderAt('/login?returnTo=%2Freviewer%2Fmy')
    expect(screen.getByRole('heading', { name: 'Pick Your Study Mode' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Browse as Guest' })).toBeInTheDocument()
  })

  it('sends guests home when Browse as Guest targets a protected route', () => {
    const continueAsGuest = vi.fn()
    useAuth.mockReturnValue({
      isAuthenticated: false,
      isGuest: false,
      loading: false,
      continueAsGuest,
    })
    render(
      <MemoryRouter initialEntries={['/login?returnTo=%2Freviewer%2Fmy']}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<div>Home page</div>} />
        </Routes>
      </MemoryRouter>
    )
    fireEvent.click(screen.getByRole('button', { name: 'Browse as Guest' }))
    expect(continueAsGuest).toHaveBeenCalled()
    expect(screen.getByText('Home page')).toBeTruthy()
  })
})

describe('isGuestSafePath', () => {
  it('allows public routes', () => {
    expect(isGuestSafePath('/')).toBe(true)
    expect(isGuestSafePath('/login')).toBe(true)
    expect(isGuestSafePath('/reviewer/public')).toBe(true)
    expect(isGuestSafePath('/reviewer/r1')).toBe(true)
    expect(isGuestSafePath('/review/r1')).toBe(true)
    expect(isGuestSafePath('/profile/user-9')).toBe(true)
    expect(isGuestSafePath('/about')).toBe(true)
  })

  it('blocks protected routes and off-site URLs', () => {
    expect(isGuestSafePath('/reviewer/my')).toBe(false)
    expect(isGuestSafePath('/create')).toBe(false)
    expect(isGuestSafePath('/notifications')).toBe(false)
    expect(isGuestSafePath('/profile')).toBe(false)
    expect(isGuestSafePath('/friends')).toBe(false)
    expect(isGuestSafePath('/settings/account')).toBe(false)
    expect(isGuestSafePath('/onboarding')).toBe(false)
    expect(isGuestSafePath('https://evil.example/')).toBe(false)
    expect(isGuestSafePath('//evil.example/')).toBe(false)
  })
})
