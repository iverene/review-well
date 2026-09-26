import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import Filter from '../../src/components/Filter'

describe('Filter', () => {
  it('renders assessment and semester dropdowns with an active count', () => {
    render(<Filter examType="midterm" semester="" onChange={() => {}} onClear={() => {}} />)
    expect(screen.getByRole('button', { name: 'Assessment' })).toHaveTextContent('Midterm')
    expect(screen.getByRole('button', { name: 'Semester' })).toHaveTextContent('All Semesters')
    expect(screen.getByTestId('filter-active-count')).toHaveTextContent('1')
  })

  it('emits picks and clears', () => {
    const onChange = vi.fn()
    const onClear = vi.fn()
    render(<Filter examType="" semester="Summer" onChange={onChange} onClear={onClear} />)
    fireEvent.click(screen.getByRole('button', { name: 'Assessment' }))
    fireEvent.click(screen.getByRole('button', { name: 'Quiz' }))
    expect(onChange).toHaveBeenCalledWith({ examType: 'quiz' })
    fireEvent.click(screen.getByRole('button', { name: 'Clear filters' }))
    expect(onClear).toHaveBeenCalled()
  })

  it('hides the clear action with no active filters', () => {
    render(<Filter examType="" semester="" onChange={() => {}} onClear={() => {}} />)
    expect(screen.queryByTestId('filter-active-count')).toBeNull()
    expect(screen.queryByRole('button', { name: 'Clear filters' })).toBeNull()
  })

  it('toggles the selects behind an icon button on mobile', () => {
    render(<Filter examType="midterm" semester="" onChange={() => {}} onClear={() => {}} />)
    expect(screen.getByTestId('filter-active-count-mobile')).toHaveTextContent('1')
    const toggle = screen.getByRole('button', { name: 'Toggle filters' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
  })
})
