import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'

import Account from '../../src/pages/Account'
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

describe('Account', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
    useAuth.mockReturnValue({
      refreshUser: vi.fn().mockResolvedValue({}),
    })
    axios.get.mockResolvedValue({ data: { user: profile } })
  })

  it('renders the account form with a back link to settings', async () => {
    render(<MemoryRouter><Account /></MemoryRouter>)
    expect(await screen.findByRole('heading', { name: 'Account' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to settings/ })).toHaveAttribute('href', '/settings')
  })

  it('uploads a new avatar when a valid image is chosen', async () => {
    axios.put.mockResolvedValue({ data: { user: { ...profile, avatarUrl: 'https://cdn.example.com/a.png' } } })
    render(<MemoryRouter><Account /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Account' })
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Upload profile photo'), { target: { files: [file] } })
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith(
      '/api/profile/me/avatar',
      expect.any(FormData),
      expect.objectContaining({ withCredentials: true })
    ))
  })

  it('rejects non-image files before uploading', async () => {
    render(<MemoryRouter><Account /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Account' })
    const file = new File(['data'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Upload profile photo'), { target: { files: [file] } })
    expect(await screen.findByText(/JPG, PNG, WEBP, or GIF/)).toBeInTheDocument()
    expect(axios.put).not.toHaveBeenCalled()
  })
})
