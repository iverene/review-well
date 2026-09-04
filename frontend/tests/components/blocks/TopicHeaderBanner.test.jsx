import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import TopicHeaderBanner from '../../../src/components/blocks/TopicHeaderBanner'

describe('TopicHeaderBanner', () => {
  it('renders with default content', () => {
    render(<TopicHeaderBanner content={{}} onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Main topic heading' })).toBeInTheDocument()
  })

  it('renders with provided content', () => {
    render(
      <TopicHeaderBanner
        content={{ heading: 'Chapter 1' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Main topic heading' })).toHaveTextContent('Chapter 1')
  })

  it('calls onChange when heading blurs', () => {
    const onChange = vi.fn()
    render(<TopicHeaderBanner content={{}} onChange={onChange} />)
    const el = screen.getByRole('textbox', { name: 'Main topic heading' })
    el.textContent = 'New Topic'
    fireEvent.blur(el)
    expect(onChange).toHaveBeenCalledWith({ heading: 'New Topic' })
  })
})
