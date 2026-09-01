import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TopicHeaderBanner from '../../../src/components/blocks/TopicHeaderBanner'

describe('TopicHeaderBanner', () => {
  it('renders with default content', () => {
    render(<TopicHeaderBanner content={{}} onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Topic Header')).toBeInTheDocument()
  })

  it('renders with provided content', () => {
    render(
      <TopicHeaderBanner
        content={{ heading: 'Chapter 1' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByDisplayValue('Chapter 1')).toBeInTheDocument()
  })

  it('calls onChange when heading changes', () => {
    const onChange = vi.fn()
    render(<TopicHeaderBanner content={{}} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Topic Header'), {
      target: { value: 'New Topic' },
    })
    expect(onChange).toHaveBeenCalledWith({ heading: 'New Topic' })
  })
})
