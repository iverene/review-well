import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MainTitleBlock from '../../../src/components/blocks/MainTitleBlock'

describe('MainTitleBlock', () => {
  it('renders with default content', () => {
    render(<MainTitleBlock content={{}} onChange={() => {}} />)
    expect(screen.getByPlaceholderText('Main Title')).toBeInTheDocument()
  })

  it('renders with provided content', () => {
    render(
      <MainTitleBlock
        content={{ heading: 'Test Title', subtitle: 'Test Subtitle' }}
        onChange={() => {}}
      />
    )
    expect(screen.getByDisplayValue('Test Title')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Subtitle')).toBeInTheDocument()
  })

  it('calls onChange when heading changes', () => {
    const onChange = vi.fn()
    render(<MainTitleBlock content={{}} onChange={onChange} />)
    fireEvent.change(screen.getByPlaceholderText('Main Title'), {
      target: { value: 'New Title' },
    })
    expect(onChange).toHaveBeenCalledWith({ heading: 'New Title' })
  })
})
