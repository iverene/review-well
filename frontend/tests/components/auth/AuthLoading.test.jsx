import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import AuthLoading from '../../../src/components/auth/AuthLoading'

describe('AuthLoading', () => {
  it('renders the branded sign-in animation with public logos', () => {
    render(<AuthLoading />)
    expect(screen.getByRole('status', { name: 'Signing you in...' })).toBeInTheDocument()
    const logos = screen.getAllByAltText('Review Well')
    expect(logos.some((img) => img.getAttribute('src') === '/logo.png')).toBe(true)
    expect(logos.some((img) => img.getAttribute('src') === '/word-logo.png')).toBe(true)
    expect(screen.getByText('Please wait while we complete your authentication.')).toBeInTheDocument()
  })

  it('supports a custom message', () => {
    render(<AuthLoading message="Loading your desk..." />)
    expect(screen.getByRole('status', { name: 'Loading your desk...' })).toBeInTheDocument()
  })
})
