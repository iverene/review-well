import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import Toolbar from '../../../src/components/workspace/Toolbar'

describe('Toolbar', () => {
  const mockReviewer = {
    id: '1',
    title: 'Test Reviewer',
    courseCode: 'MATH 101',
    visibility: 'public',
    isDraft: false,
  }

  it('renders reviewer info', () => {
    render(
      <Toolbar
        reviewer={mockReviewer}
        saving={false}
        onSave={() => {}}
        onAddBlock={() => {}}
      />
    )
    expect(screen.getByText('MATH 101')).toBeInTheDocument()
    expect(screen.getByText('public')).toBeInTheDocument()
  })

  it('shows saving state', () => {
    render(
      <Toolbar
        reviewer={mockReviewer}
        saving={true}
        onSave={() => {}}
        onAddBlock={() => {}}
      />
    )
    expect(screen.getByText('Saving...')).toBeInTheDocument()
  })

  it('calls onSave when clicking save button', () => {
    const onSave = vi.fn()
    render(
      <Toolbar
        reviewer={mockReviewer}
        saving={false}
        onSave={onSave}
        onAddBlock={() => {}}
      />
    )
    fireEvent.click(screen.getByText('Save'))
    expect(onSave).toHaveBeenCalled()
  })

  it('opens add block menu when clicking Add Block', () => {
    render(
      <Toolbar
        reviewer={mockReviewer}
        saving={false}
        onSave={() => {}}
        onAddBlock={() => {}}
      />
    )
    fireEvent.click(screen.getByText('Add Block'))
    expect(screen.getByText('Topic Header')).toBeInTheDocument()
    expect(screen.getByText('Content Block')).toBeInTheDocument()
  })
})
