import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: () => ({
    error: null,
    isAuthenticated: false,
    loading: false,
    signInWithGoogle: vi.fn(),
  }),
}))

import Layout from '../../src/components/Layout'

describe('Layout shell', () => {
  it('renders exactly one main landmark owned by the shell', () => {
    render(
      <MemoryRouter>
        <Layout><p>page content</p></Layout>
      </MemoryRouter>
    )

    const mains = screen.getAllByRole('main')
    expect(mains).toHaveLength(1)
    expect(mains[0]).toHaveAttribute('id', 'main-content')
    expect(mains[0]).toHaveClass('show-scroll')
    expect(screen.getByRole('link', { name: 'Skip to main content' }))
      .toHaveAttribute('href', '#main-content')
    expect(mains[0]).toContainElement(screen.getByText('page content'))
  })
})
