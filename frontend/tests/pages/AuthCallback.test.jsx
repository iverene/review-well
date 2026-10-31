import { describe, it, expect, beforeEach } from 'vitest'
import { StrictMode } from 'react'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import AuthCallback from '../../src/pages/AuthCallback'
import { useAuth } from '../../src/contexts/AuthContext'
import { rememberReturnTo } from '../../src/utils/returnTo'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const completeUser = { id: 'u1', displayName: 'Ann', school: 'UP', program: 'BSCS', major: 'SE', yearLevel: '3rd Year' }

const renderCallback = () => render(
  <MemoryRouter initialEntries={['/auth/callback']}>
    <Routes>
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route path="/reviewer/:id" element={<div>Study hub</div>} />
      <Route path="/onboarding" element={<div>Onboarding</div>} />
      <Route path="/" element={<div>Home page</div>} />
    </Routes>
  </MemoryRouter>
)

describe('AuthCallback', () => {
  beforeEach(() => {
    window.sessionStorage.clear()
  })

  it('returns a signed-in user to the page they started sign-in from', async () => {
    rememberReturnTo('/reviewer/r1')
    useAuth.mockReturnValue({ loading: false, refreshUser: vi.fn().mockResolvedValue(completeUser) })
    renderCallback()
    expect(await screen.findByText('Study hub')).toBeInTheDocument()
  })

  it('lands on home when no page was remembered', async () => {
    useAuth.mockReturnValue({ loading: false, refreshUser: vi.fn().mockResolvedValue(completeUser) })
    renderCallback()
    expect(await screen.findByText('Home page')).toBeInTheDocument()
  })

  it('sends first-time users to onboarding and keeps the page for later', async () => {
    rememberReturnTo('/reviewer/r1')
    useAuth.mockReturnValue({ loading: false, refreshUser: vi.fn().mockResolvedValue({ id: 'u1', displayName: 'Ann' }) })
    renderCallback()
    expect(await screen.findByText('Onboarding')).toBeInTheDocument()
    expect(window.sessionStorage.getItem('review-well-return-to')).toBe('/reviewer/r1')
  })

  it('still returns to the remembered page when effects run twice (StrictMode)', async () => {
    rememberReturnTo('/reviewer/r1')
    useAuth.mockReturnValue({ loading: false, refreshUser: vi.fn().mockResolvedValue(completeUser) })
    render(
      <StrictMode>
        <MemoryRouter initialEntries={['/auth/callback']}>
          <Routes>
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/reviewer/:id" element={<div>Study hub</div>} />
            <Route path="/" element={<div>Home page</div>} />
          </Routes>
        </MemoryRouter>
      </StrictMode>
    )
    expect(await screen.findByText('Study hub')).toBeInTheDocument()
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(screen.queryByText('Home page')).toBeNull()
  })
})
