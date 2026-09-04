import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import TableBlock from '../../../src/components/blocks/TableBlock'

describe('TableBlock', () => {
  it('renders with default content', () => {
    render(<TableBlock content={{}} onChange={() => {}} />)
    expect(screen.getByRole('textbox', { name: 'Table header 1' })).toHaveTextContent('Column 1')
    expect(screen.getByRole('textbox', { name: 'Table header 2' })).toHaveTextContent('Column 2')
  })

  it('renders with provided content', () => {
    render(
      <TableBlock
        content={{
          headers: ['Name', 'Value'],
          rows: [['Item 1', '100']],
        }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Table header 1' })).toHaveTextContent('Name')
    expect(screen.getByRole('textbox', { name: 'Table header 2' })).toHaveTextContent('Value')
    expect(screen.getByRole('textbox', { name: 'Row 1 column 1' })).toHaveTextContent('Item 1')
    expect(screen.getByRole('textbox', { name: 'Row 1 column 2' })).toHaveTextContent('100')
  })

  it('calls onChange when header blurs', () => {
    const onChange = vi.fn()
    render(<TableBlock content={{ headers: ['Col 1'], rows: [['']] }} onChange={onChange} />)
    const el = screen.getByRole('textbox', { name: 'Table header 1' })
    el.textContent = 'New Header'
    fireEvent.blur(el)
    expect(onChange).toHaveBeenCalledWith({
      headers: ['New Header'],
      rows: [['']],
    })
  })

  it('calls onChange when cell blurs', () => {
    const onChange = vi.fn()
    render(
      <TableBlock
        content={{ headers: ['Col 1'], rows: [['Old Value']] }}
        onChange={onChange}
      />
    )
    const el = screen.getByRole('textbox', { name: 'Row 1 column 1' })
    el.textContent = 'New Value'
    fireEvent.blur(el)
    expect(onChange).toHaveBeenCalledWith({
      headers: ['Col 1'],
      rows: [['New Value']],
    })
  })

  it('adds row when clicking Add Row', () => {
    const onChange = vi.fn()
    render(<TableBlock content={{ headers: ['Col 1'], rows: [['']] }} onChange={onChange} />)
    fireEvent.click(screen.getByText('+ Add Row'))
    expect(onChange).toHaveBeenCalledWith({
      headers: ['Col 1'],
      rows: [[''], ['']],
    })
  })
})
