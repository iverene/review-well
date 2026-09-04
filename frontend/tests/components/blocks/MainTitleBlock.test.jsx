import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import MainTitleBlock from '../../../src/components/blocks/MainTitleBlock'

describe('MainTitleBlock', () => {
  it('renders with default content', () => {
    render(<MainTitleBlock content={{}} onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Main title' })).toBeInTheDocument()
  })

  it('renders with provided content', () => {
    render(
      <MainTitleBlock
        content={{ heading: 'Test Title', subtitle: 'Test Subtitle' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Main title' })).toHaveTextContent('Test Title')
    expect(screen.getByRole('textbox', { name: 'Subtitle' })).toHaveTextContent('Test Subtitle')
  })

  it('calls onChange when heading blurs', () => {
    const onChange = vi.fn()
    render(<MainTitleBlock content={{}} onChange={onChange} />)
    const el = screen.getByRole('textbox', { name: 'Main title' })
    el.textContent = 'New Title'
    fireEvent.blur(el)
    expect(onChange).toHaveBeenCalledWith({ heading: 'New Title' })
  })
})
