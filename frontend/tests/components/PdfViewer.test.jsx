import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import PdfViewer from '../../src/components/PdfViewer'
import * as pdfjsLib from 'pdfjs-dist'

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: {},
  getDocument: vi.fn(),
}))

vi.mock('pdfjs-dist/build/pdf.worker.min.mjs?url', () => ({
  default: 'mock-worker-url',
}))

const pdfDouble = (numPages = 2) => ({
  numPages,
  destroy: vi.fn(),
  getPage: vi.fn(async (pageNumber) => ({
    getViewport: ({ scale }) => ({ width: 100 * scale, height: 129 * scale }),
    render: vi.fn(() => ({ promise: Promise.resolve() })),
    pageNumber,
  })),
})

describe('PdfViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    pdfjsLib.getDocument.mockReturnValue({ promise: Promise.resolve(pdfDouble(2)) })
  })

  it('loads the document from the file URL and shows the page count', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ url: 'https://storage.example.com/v1.pdf' })
    expect(await screen.findByTestId('study-doc-count')).toHaveTextContent('1 / 2')
  })

  it('navigates pages and clamps at the ends', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await screen.findByTestId('study-doc-count')
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByTestId('study-doc-count')).toHaveTextContent('2 / 2')
    fireEvent.click(screen.getByRole('button', { name: 'Previous page' }))
    expect(await screen.findByTestId('study-doc-count')).toHaveTextContent('1 / 2')
  })

  it('offers fullscreen toggle and download-safe fallback on load failure', async () => {
    pdfjsLib.getDocument.mockReturnValue({ promise: Promise.reject(new Error('boom')) })
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Try downloading it instead.')
    expect(screen.getByRole('button', { name: 'View fullscreen' })).toBeInTheDocument()
  })
})
