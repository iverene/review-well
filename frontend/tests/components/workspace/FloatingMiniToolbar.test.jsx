import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FloatingMiniToolbar from '../../../src/components/workspace/FloatingMiniToolbar'

describe('FloatingMiniToolbar', () => {
  const baseProps = {
    position: { x: 100, y: 200 },
    canPaste: true,
    onCopy: () => {},
    onPaste: () => {},
    onDuplicate: () => {},
    onDelete: () => {},
    onClose: () => {},
  }

  it('renders quick actions', () => {
    render(<FloatingMiniToolbar {...baseProps} />)
    expect(screen.getByRole('toolbar', { name: 'Quick actions' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Paste' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('renders nothing without a position', () => {
    const { container } = render(<FloatingMiniToolbar {...baseProps} position={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('fires copy, paste, duplicate, delete handlers', () => {
    const onCopy = vi.fn()
    const onPaste = vi.fn()
    const onDuplicate = vi.fn()
    const onDelete = vi.fn()
    render(<FloatingMiniToolbar {...baseProps} onCopy={onCopy} onPaste={onPaste} onDuplicate={onDuplicate} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }))
    fireEvent.click(screen.getByRole('button', { name: 'Paste' }))
    fireEvent.click(screen.getByRole('button', { name: 'Duplicate' }))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(onCopy).toHaveBeenCalled()
    expect(onPaste).toHaveBeenCalled()
    expect(onDuplicate).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalled()
  })

  it('disables paste when nothing is copied', () => {
    render(<FloatingMiniToolbar {...baseProps} canPaste={false} />)
    expect(screen.getByRole('button', { name: 'Paste' })).toBeDisabled()
  })
})
