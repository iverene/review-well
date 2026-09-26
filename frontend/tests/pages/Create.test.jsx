import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Create from '../../src/pages/Create'
import { useAuth } from '../../src/contexts/AuthContext'
import useQueryCache from '../../src/stores/queryCache'

vi.mock('../../src/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}))

vi.mock('axios')

const renderCreate = () => render(
  <MemoryRouter initialEntries={['/create']}>
    <Routes>
      <Route path="/create" element={<Create />} />
    </Routes>
  </MemoryRouter>
)

const pdfFile = (name = 'slides.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' })

describe('Create file dropzone', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQueryCache.getState().reset()
    useAuth.mockReturnValue({ isGuest: false })
  })

  it('defaults new reviewers to public visibility', () => {
    renderCreate()
    expect(screen.getByRole('radio', { name: /Public/ })).toBeChecked()
  })

  it('describes drag and drop without emoji copy', () => {    renderCreate()
    expect(screen.getByText('Drag and drop your file here, or browse to choose one.', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText(/study modes grow from this file/)).toBeNull()
  })

  it('accepts a dropped PDF and shows confirmation', () => {
    renderCreate()
    const input = document.getElementById('sourceFile')
    fireEvent.drop(input, { dataTransfer: { files: [pdfFile()] } })
    // Filename and size render as adjacent text nodes — match the whole line.
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent.includes('slides.pdf'))
    ).toBeInTheDocument()
    expect(screen.getByText(/looks perfect|MB\)/)).toBeInTheDocument()
  })

  it('rejects a dropped non-PDF/PPTX file with an alert', () => {
    renderCreate()
    const input = document.getElementById('sourceFile')
    fireEvent.drop(input, { dataTransfer: { files: [new File(['x'], 'evil.exe', { type: 'application/octet-stream' })] } })
    expect(screen.getByRole('alert')).toHaveTextContent('Only PDF or PPTX')
  })
})
