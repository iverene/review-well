import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import ContentBlock from '../../../src/components/blocks/ContentBlock'

describe('ContentBlock', () => {
  it('renders with default content', () => {
    render(<ContentBlock content={{}} onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Term')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Definition')).toBeInTheDocument()
  })

  it('renders with provided content', () => {
    render(
      <ContentBlock
        content={{ heading: 'Photosynthesis', body: 'Process by which plants make food' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByDisplayValue('Photosynthesis')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Process by which plants make food')).toBeInTheDocument()
  })

  it('calls onChange when term changes', () => {
    const onChange = vi.fn()
    render(<ContentBlock content={{}} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Term'), {
      target: { value: 'New Term' },
    })
    expect(onChange).toHaveBeenCalledWith({ heading: 'New Term' })
  })

  it('calls onChange when definition changes', () => {
    const onChange = vi.fn()
    render(<ContentBlock content={{}} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Definition'), {
      target: { value: 'New definition' },
    })
    expect(onChange).toHaveBeenCalledWith({ body: 'New definition' })
  })
})
