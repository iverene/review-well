import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import NotFound from '../../src/pages/NotFound'

describe('NotFound', () => {
  it('explains the missing page and offers a way back', () => {
    render(<MemoryRouter><NotFound /></MemoryRouter>)
    expect(screen.getByRole('heading', { level: 1, name: 'This page wandered off' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Back home' })).toHaveAttribute('href', '/')
    expect(screen.getByRole('link', { name: 'Public reviewers' })).toHaveAttribute('href', '/reviewer/public')
  })
})
