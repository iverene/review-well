import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import axios from 'axios'

import FollowButton from '../../../src/components/social/FollowButton'
import SaveButton from '../../../src/components/social/SaveButton'

vi.mock('axios', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

vi.mock('../../../src/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'me' }, isAuthenticated: true }),
}))

vi.mock('../../../src/contexts/ToastContext', () => ({
  useToast: () => ({ success: vi.fn(), info: vi.fn(), error: vi.fn() }),
}))

describe('social buttons', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not re-fetch follow status when the parent already knows it', () => {
    render(<FollowButton userId="user-2" initialFollowing={false} />)

    expect(axios.get).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Follow' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('does not re-fetch save status when the parent already knows it', () => {
    render(<SaveButton reviewerId="reviewer-1" initialSaved={false} initialSaveCount={3} />)

    expect(axios.get).not.toHaveBeenCalled()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('still loads follow status when no initial state was supplied', async () => {
    axios.get.mockResolvedValue({ data: { following: true, followerCount: 2 } })

    render(<FollowButton userId="user-2" initialFollowing={undefined} />)

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/social/users/user-2/follow', {
        withCredentials: true,
      })
    })
    expect(await screen.findByRole('button', { name: 'Following' })).toBeInTheDocument()
  })

  it('still loads save status when no initial state was supplied', async () => {
    axios.get.mockResolvedValue({ data: { saved: true, saveCount: 4 } })

    render(<SaveButton reviewerId="reviewer-1" initialSaved={undefined} />)

    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith('/api/social/reviewers/reviewer-1/save', {
        withCredentials: true,
      })
    })
    expect(await screen.findByText('4')).toBeInTheDocument()
  })
})
