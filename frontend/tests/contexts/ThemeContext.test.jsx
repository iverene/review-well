import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { ThemeProvider, STORAGE_KEY } from '../../src/contexts/ThemeContext'
import Settings from '../../src/pages/Settings'
import { useAuth } from '../../src/contexts/AuthContext'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

describe('Theme system', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    window.localStorage.clear()
    delete document.documentElement.dataset.theme
    useAuth.mockReturnValue({
      logout: vi.fn(),
      user: { id: 'me' },
      isAuthenticated: true,
    })
  })

  const renderSettings = () => render(
    <MemoryRouter>
      <ThemeProvider>
        <Settings />
      </ThemeProvider>
    </MemoryRouter>
  )

  it('defaults to light with no stored preference', () => {
    renderSettings()
    expect(document.documentElement.dataset.theme).toBeUndefined()
    expect(screen.getByRole('radio', { name: /Light/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('switches theme, persists it, and applies it to the document', () => {
    renderSettings()
    fireEvent.click(screen.getByRole('radio', { name: /Dark/ }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('dark')
    expect(screen.getByRole('radio', { name: /Dark/ })).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(screen.getByRole('radio', { name: /Reading/ }))
    expect(document.documentElement.dataset.theme).toBe('reading')
  })

  it('restores a stored theme on load', () => {
    window.localStorage.setItem(STORAGE_KEY, 'reading')
    renderSettings()
    expect(document.documentElement.dataset.theme).toBe('reading')
    expect(screen.getByRole('radio', { name: /Reading/ })).toHaveAttribute('aria-checked', 'true')
  })
})
