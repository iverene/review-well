import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import ContentBlock from '../../../src/components/blocks/ContentBlock'

describe('ContentBlock', () => {
  it('renders with default content', () => {
    render(<ContentBlock content={{ heading: '', body: '' }} onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Term or heading' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Normal text body' })).toBeInTheDocument()
  })

  it('renders with provided content', () => {
    render(
      <ContentBlock
        content={{ heading: 'Photosynthesis', body: 'Process by which plants make food' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Term or heading' })).toHaveTextContent('Photosynthesis')
    expect(screen.getByRole('textbox', { name: 'Normal text body' })).toHaveTextContent('Process by which plants make food')
  })

  it('calls onChange when term blurs', () => {
    const onChange = vi.fn()
    render(<ContentBlock content={{ heading: '', body: '' }} onChange={onChange} />)
    const el = screen.getByRole('textbox', { name: 'Term or heading' })
    el.textContent = 'New Term'
    fireEvent.blur(el)
    expect(onChange).toHaveBeenCalledWith({ heading: 'New Term', body: '' })
  })

  it('calls onChange when definition blurs', () => {
    const onChange = vi.fn()
    render(<ContentBlock content={{ heading: '', body: '' }} onChange={onChange} />)
    const el = screen.getByRole('textbox', { name: 'Normal text body' })
    el.textContent = 'New definition'
    fireEvent.blur(el)
    expect(onChange).toHaveBeenCalled()
  })
})
