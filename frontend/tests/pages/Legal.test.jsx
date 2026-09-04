import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Privacy from '../../src/pages/Privacy'
import Terms from '../../src/pages/Terms'

describe('Legal pages', () => {
  it('renders the Privacy Policy', () => {
    render(<MemoryRouter><Privacy /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Privacy Policy' })).toBeInTheDocument()
    expect(screen.getByText(/What we collect/)).toBeInTheDocument()
  })

  it('renders the Terms and Conditions', () => {
    render(<MemoryRouter><Terms /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: 'Terms and Conditions' })).toBeInTheDocument()
    expect(screen.getByText(/Fair use/)).toBeInTheDocument()
  })
})
