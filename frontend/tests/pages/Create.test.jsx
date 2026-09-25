import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import Create from '../../src/pages/Create'
import { useAuth } from '../../src/contexts/AuthContext'

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
    useAuth.mockReturnValue({ isGuest: false })
  })

  it('describes drag and drop without emoji copy', () => {
    renderCreate()
    expect(screen.getByText('Drag and drop your file here, or browse to choose one.', { exact: false })).toBeInTheDocument()
    expect(screen.queryByText(/study modes grow from this file/)).toBeNull()
  })

  it('accepts a dropped PDF and shows confirmation', () => {
    renderCreate()
    const input = document.getElementById('sourceFile')
    fireEvent.drop(input, { dataTransfer: { files: [pdfFile()] } })
    expect(screen.getByText(/slides\.pdf.*looks perfect/)).toBeInTheDocument()
  })

  it('rejects a dropped non-PDF/PPTX file with an alert', () => {
    renderCreate()
    const input = document.getElementById('sourceFile')
    fireEvent.drop(input, { dataTransfer: { files: [new File(['x'], 'evil.exe', { type: 'application/octet-stream' })] } })
    expect(screen.getByRole('alert')).toHaveTextContent('Only PDF or PPTX')
  })
})
