import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import axios from 'axios'
import Notifications from '../../src/pages/Notifications'

vi.mock('axios')

const notification = (id, actionType = 'follow') => ({
  id,
  actor: { displayName: 'Ann Lee', avatarUrl: null },
  actionType,
  reviewer: { id: 'r1', title: 'Calculus' },
  isRead: false,
  createdAt: new Date().toISOString(),
})

describe('Notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('merges newly arrived notifications to the top on window focus', async () => {
    axios.get
      .mockResolvedValueOnce({ data: { notifications: [notification('n1')] } })
      .mockResolvedValue({ data: { notifications: [notification('n2', 'new_reviewer'), notification('n1')] } })

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()
    expect(screen.queryByText('published a new reviewer')).toBeNull()

    await act(async () => {
      window.dispatchEvent(new Event('focus'))
    })

    expect(await screen.findByText('published a new reviewer')).toBeInTheDocument()
    expect(screen.getAllByText(/Ann Lee/).length).toBeGreaterThanOrEqual(2)
  })

  it('polls for new notifications on a 20 second interval', async () => {
    axios.get.mockResolvedValue({ data: { notifications: [notification('n1')] } })
    const setIntervalSpy = vi.spyOn(window, 'setInterval')

    render(<MemoryRouter><Notifications /></MemoryRouter>)
    expect(await screen.findByText('started following you')).toBeInTheDocument()

    expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 20000)
    setIntervalSpy.mockRestore()
  })
})
