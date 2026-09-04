import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

import PageContainer from '../../../src/components/common/PageContainer'

describe('PageContainer', () => {
  it('wraps children in the shared page container', () => {
    render(<PageContainer><p>child content</p></PageContainer>)
    const child = screen.getByText('child content')
    expect(child.parentElement).toHaveClass('mx-auto', 'w-full', 'max-w-5xl', 'px-4', 'pb-10', 'md:px-6')
  })

  it('merges an extra className without dropping the shared classes', () => {
    render(<PageContainer className="space-y-8"><p>extra class child</p></PageContainer>)
    const child = screen.getByText('extra class child')
    expect(child.parentElement).toHaveClass('max-w-5xl', 'space-y-8')
  })
})
