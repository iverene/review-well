import { useState } from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Button from '../../../src/components/common/Button'
import EmptyState from '../../../src/components/common/EmptyState'
import Modal from '../../../src/components/common/Modal'
import Tabs from '../../../src/components/common/Tabs'

const ModalHarness = ({ onClose = () => {} }) => {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>Open</button>
      <Modal open={open} onClose={() => { onClose(); setOpen(false) }} title="Share This Reviewer" closeLabel="Close share dialog">
        <input aria-label="Share link" readOnly value="https://example.com" />
        <button type="button">Copy</button>
      </Modal>
    </>
  )
}

describe('Modal', () => {
  it('is named by its title and moves focus inside when opened', () => {
    render(<ModalHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    const dialog = screen.getByRole('dialog', { name: 'Share This Reviewer' })
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toContainElement(document.activeElement)
  })

  it('closes on Escape and returns focus to the opener', () => {
    const onClose = vi.fn()
    render(<ModalHarness onClose={onClose} />)
    const opener = screen.getByRole('button', { name: 'Open' })
    opener.focus()
    fireEvent.click(opener)
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(document.activeElement).toBe(opener)
  })

  it('keeps Tab focus cycling inside the dialog', () => {
    render(<ModalHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    const close = screen.getByRole('button', { name: 'Close share dialog' })
    const copy = screen.getByRole('button', { name: 'Copy' })
    copy.focus()
    fireEvent.keyDown(document, { key: 'Tab' })
    expect(document.activeElement).toBe(close)
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true })
    expect(document.activeElement).toBe(copy)
  })
})

describe('Tabs', () => {
  const TabsHarness = () => {
    const [value, setValue] = useState('reviewers')
    return (
      <Tabs
        label="Profile collections"
        idBase="profile"
        value={value}
        onChange={setValue}
        tabs={[{ value: 'reviewers', label: 'Reviewers' }, { value: 'saved', label: 'Saved' }]}
      />
    )
  }

  it('moves selection and focus with the arrow keys', () => {
    render(<TabsHarness />)
    const reviewers = screen.getByRole('tab', { name: 'Reviewers' })
    expect(reviewers).toHaveAttribute('tabindex', '0')
    fireEvent.keyDown(reviewers, { key: 'ArrowRight' })
    const saved = screen.getByRole('tab', { name: 'Saved' })
    expect(saved).toHaveAttribute('aria-selected', 'true')
    expect(document.activeElement).toBe(saved)
    fireEvent.keyDown(saved, { key: 'ArrowRight' })
    expect(screen.getByRole('tab', { name: 'Reviewers' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('Button', () => {
  it('renders a router link when given `to`', () => {
    render(<MemoryRouter><Button to="/create" variant="primary">New Reviewer</Button></MemoryRouter>)
    expect(screen.getByRole('link', { name: 'New Reviewer' })).toHaveAttribute('href', '/create')
  })

  it('defaults to a non-submitting button', () => {
    render(<Button>Cancel</Button>)
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveAttribute('type', 'button')
  })
})

describe('EmptyState', () => {
  it('shows a title, copy, and action', () => {
    render(<MemoryRouter><EmptyState title="No Reviewers Yet" action={<Button to="/create">Create</Button>}>Make your first one.</EmptyState></MemoryRouter>)
    expect(screen.getByText('No Reviewers Yet')).toBeInTheDocument()
    expect(screen.getByText('Make your first one.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Create' })).toBeInTheDocument()
  })
})
