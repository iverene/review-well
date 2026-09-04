import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Privacy from '../../src/pages/Privacy'
import Terms from '../../src/pages/Terms'

describe('Legal pages', () => {
  it('renders the Privacy Policy with back navigation', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to About/ })).toHaveAttribute('href', '/about')
  })

  it('renders the Terms and Conditions with back navigation', () => {
    render(<MemoryRouter><Terms /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Terms and Conditions' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Back to About/ })).toHaveAttribute('href', '/about')
  })
})
