import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import Toolbar from '../../../src/components/workspace/Toolbar'

describe('Toolbar', () => {
  const mockReviewer = {
    id: '1',
    title: 'Test Reviewer',
    courseCode: 'MATH 101',
    courseDescription: 'Calculus',
    semester: 'Fall 2026',
    examType: 'midterm',
    visibility: 'public',
    isDraft: false,
  }

  const palettes = [
    { name: 'Cocoa Classic', primary: '#604A3A', secondary: '#F9E4A8', accent: '#FFF7E8' },
  ]
  const paperSizes = {
    A4: { label: '210 × 297 mm', width: 794, height: 1123 },
    Letter: { label: '8.5 × 11 in', width: 816, height: 1056 },
  }

  const baseProps = {
    saving: false,
    extracting: false,
    lastSavedAt: null,
    saveError: null,
    onSave: () => {},
    onAddBlock: () => {},
    onDocTitleChange: () => {},
    onAiExtract: () => {},
    onNew: () => {},
    onOpenReviewer: () => {},
    onDownloadPdf: () => {},
    onInsertImage: () => {},
    palettes,
    paletteName: 'Cocoa Classic',
    onPalettePick: () => {},
    paperSize: 'A4',
    paperSizes,
    onPaperSizeChange: () => {},
    columns: '2',
    onColumnsChange: () => {},
    onSaveAsPdf: () => {},
  }

  const renderToolbar = (props = {}) => render(
    <MemoryRouter><Toolbar reviewer={mockReviewer} {...baseProps} {...props} /></MemoryRouter>
  )

  it('renders brand mark and doc title from course description', () => {
    renderToolbar()
    expect(screen.getByAltText('Review Well')).toBeInTheDocument()
    expect(screen.getByLabelText('Document title')).toHaveValue('Calculus')
  })

  it('shows examination period and semester in the subtitle', () => {
    renderToolbar()
    expect(screen.getByText('Midterm · Fall 2026')).toBeInTheDocument()
  })

  it('shows a distinct save pill that updates after saving', () => {
    const { rerender } = renderToolbar()
    expect(screen.getByText('Saved')).toBeInTheDocument()
    rerender(<MemoryRouter><Toolbar reviewer={mockReviewer} {...baseProps} saving /></MemoryRouter>)
    expect(screen.getByText('Saving…')).toBeInTheDocument()
    rerender(<MemoryRouter><Toolbar reviewer={mockReviewer} {...baseProps} saveError="boom" /></MemoryRouter>)
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
  })

  it('renders AI Extract with an icon, no emoji', () => {
    renderToolbar()
    const btn = screen.getByRole('button', { name: 'AI Extract' })
    expect(btn).toBeInTheDocument()
    expect(btn.textContent).not.toMatch(/✨/)
  })

  it('opens File menu with New / Open / Save / Save as PDF / Print', () => {
    renderToolbar()
    fireEvent.click(screen.getByRole('button', { name: 'File' }))
    expect(screen.getByRole('menuitem', { name: 'New' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Open…' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Save as PDF' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Print' })).toBeInTheDocument()
  })

  it('opens an in-app New modal that routes to the setup form', () => {
    const onNew = vi.fn()
    renderToolbar({ onNew })
    fireEvent.click(screen.getByRole('button', { name: 'File' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'New' }))
    expect(screen.getByRole('dialog', { name: 'Start a new document' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Discard and go to setup' }))
    expect(onNew).toHaveBeenCalled()
  })

  it('opens an archive picker for Open', () => {
    renderToolbar()
    fireEvent.click(screen.getByRole('button', { name: 'File' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Open…' }))
    expect(screen.getByRole('dialog', { name: 'Open a reviewer' })).toBeInTheDocument()
  })

  it('opens Insert menu with Blank Page first and no removed items', () => {
    const onAddBlock = vi.fn()
    renderToolbar({ onAddBlock })
    fireEvent.click(screen.getByRole('button', { name: 'Insert' }))
    const items = screen.getAllByRole('menuitem')
    expect(items[0]).toHaveTextContent('Blank Page')
    expect(screen.getByRole('menuitem', { name: 'Table' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Terms and Definitions Card' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: 'Normal text' })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: /Special characters/ })).toBeNull()
    expect(screen.queryByRole('menuitem', { name: /2-column/ })).toBeNull()
    fireEvent.click(screen.getByRole('menuitem', { name: 'Main Topic' }))
    expect(onAddBlock).toHaveBeenCalledWith('topic_banner')
  })

  it('houses theme picker, layout columns, and paper sizes in Format', () => {
    const onPalettePick = vi.fn()
    const onPaperSizeChange = vi.fn()
    const onColumnsChange = vi.fn()
    renderToolbar({ onPalettePick, onPaperSizeChange, onColumnsChange })
    fireEvent.click(screen.getByRole('button', { name: 'Format' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Cocoa Classic' }))
    expect(onPalettePick).toHaveBeenCalledWith('Cocoa Classic')
    fireEvent.click(screen.getByRole('button', { name: 'Format' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: '1-column' }))
    expect(onColumnsChange).toHaveBeenCalledWith('1')
    fireEvent.click(screen.getByRole('button', { name: 'Format' }))
    fireEvent.click(screen.getByRole('menuitemradio', { name: /Letter/ }))
    expect(onPaperSizeChange).toHaveBeenCalledWith('Letter')
  })

  it('documents insert shortcuts without platform-specific key names', () => {
    renderToolbar()
    fireEvent.click(screen.getByRole('button', { name: 'Help' }))
    fireEvent.click(screen.getByRole('menuitem', { name: 'Keyboard shortcuts' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Ctrl + Alt + L')
    expect(dialog).toHaveTextContent('Ctrl + Alt + M')
    expect(dialog).toHaveTextContent('Ctrl + Alt + S')
    expect(dialog.textContent).not.toMatch(/cmd/i)
  })
})
