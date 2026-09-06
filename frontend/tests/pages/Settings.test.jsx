import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import Settings from '../../src/pages/Settings'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('axios')
vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

const profile = {
  id: 'me',
  displayName: 'Me User',
  email: 'me@example.com',
  avatarUrl: null,
  school: 'State University',
  program: 'BSCS',
  major: '',
  yearLevel: 'junior',
}

describe('Settings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    useAuth.mockReturnValue({
      user: { email: 'me@example.com' },
      logout: vi.fn(),
      refreshUser: vi.fn().mockResolvedValue({}),
    })
    axios.get.mockResolvedValue({ data: { user: profile } })
  })

  it('renders the redesigned sections with legal links', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Privacy Policy' })).toHaveAttribute('href', '/privacy')
    expect(screen.getByRole('link', { name: 'Terms and Conditions' })).toHaveAttribute('href', '/terms')
    expect(screen.getByRole('button', { name: /Sign out/ })).toBeInTheDocument()
  })

  it('links to the account page from the Account section', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Settings' })
    expect(screen.getByRole('link', { name: /Account information/ })).toHaveAttribute('href', '/settings/account')
    expect(screen.queryByText('me@example.com')).toBeNull()
  })
})
