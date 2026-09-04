import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PageHeader from '../../../src/components/common/PageHeader'

describe('PageHeader', () => {
  it('renders only the page name as a level-one heading', () => {
    render(<PageHeader title="Home" />)
    const heading = screen.getByRole('heading', { name: 'Home', level: 1 })
    expect(heading).toBeInTheDocument()
    expect(heading.tagName).toBe('H1')
    expect(heading).toHaveClass('font-display', 'text-4xl', 'font-bold', 'text-ink')
  })
})
