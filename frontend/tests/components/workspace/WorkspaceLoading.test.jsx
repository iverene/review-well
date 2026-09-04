import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WorkspaceLoading from '../../../src/components/workspace/WorkspaceLoading'

describe('WorkspaceLoading', () => {
  it('renders branded loading screen with both logos', () => {
    render(<WorkspaceLoading />)
    expect(screen.getByRole('status', { name: 'Loading your study desk' })).toBeInTheDocument()
    const logos = screen.getAllByAltText('Review Well')
    expect(logos.length).toBe(2)
    expect(logos[0]).toHaveAttribute('src', '/logo.png')
    expect(logos[1]).toHaveAttribute('src', '/word-logo.png')
    expect(screen.getByText(/Preparing your study desk/)).toBeInTheDocument()
  })
})
