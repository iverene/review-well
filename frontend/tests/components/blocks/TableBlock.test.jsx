import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TableBlock from '../../../src/components/blocks/TableBlock'

describe('TableBlock', () => {
  it('renders with default content', () => {
    render(<TableBlock content={{}} onChange={() => {}} />)
    expect(screen.getByDisplayValue('Column 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Column 2')).toBeInTheDocument()
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
    expect(screen.getByDisplayValue('Name')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Value')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Item 1')).toBeInTheDocument()
    expect(screen.getByDisplayValue('100')).toBeInTheDocument()
  })

  it('calls onChange when header changes', () => {
    const onChange = vi.fn()
    render(<TableBlock content={{ headers: ['Col 1'], rows: [['']] }} onChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('Col 1'), {
      target: { value: 'New Header' },
    })
    expect(onChange).toHaveBeenCalledWith({
      headers: ['New Header'],
      rows: [['']],
    })
  })

  it('calls onChange when cell changes', () => {
    const onChange = vi.fn()
    render(
      <TableBlock
        content={{ headers: ['Col 1'], rows: [['Old Value']] }}
        onChange={onChange}
      />
    )
    fireEvent.change(screen.getByDisplayValue('Old Value'), {
      target: { value: 'New Value' },
    })
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
