import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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

  it('uploads a new avatar when a valid image is chosen', async () => {
    axios.put.mockResolvedValue({ data: { user: { ...profile, avatarUrl: 'https://cdn.example.com/a.png' } } })
    render(<MemoryRouter><Settings /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Settings' })
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Upload profile photo'), { target: { files: [file] } })
    await waitFor(() => expect(axios.put).toHaveBeenCalledWith(
      '/api/profile/me/avatar',
      expect.any(FormData),
      expect.objectContaining({ withCredentials: true })
    ))
  })

  it('rejects non-image files before uploading', async () => {
    render(<MemoryRouter><Settings /></MemoryRouter>)
    await screen.findByRole('heading', { name: 'Settings' })
    const file = new File(['data'], 'notes.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Upload profile photo'), { target: { files: [file] } })
    expect(await screen.findByText(/JPG, PNG, WEBP, or GIF/)).toBeInTheDocument()
    expect(axios.put).not.toHaveBeenCalled()
  })
})
