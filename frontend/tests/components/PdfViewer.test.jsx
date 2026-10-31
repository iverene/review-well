import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import * as pdfjsLib from 'pdfjs-dist'

import PdfViewer, { currentPageFromTops } from '../../src/components/PdfViewer'
import useQueryCache from '../../src/stores/queryCache'

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
    render: vi.fn(() => ({ promise: Promise.resolve(), cancel: vi.fn() })),
    pageNumber,
  })),
})

const waitForLoaded = async (count = '1 / 2') => {
  await waitFor(() => {
    expect(screen.getByTestId('study-doc-count')).toHaveTextContent(count)
  })
  await screen.findByTestId('study-doc-canvas-1')
}

describe('PdfViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    useQueryCache.getState().reset()
    pdfjsLib.getDocument.mockReturnValue({ promise: Promise.resolve(pdfDouble(2)) })
  })

  it('loads the document from the file URL and shows the page count', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    expect(pdfjsLib.getDocument).toHaveBeenCalledWith({ url: 'https://storage.example.com/v1.pdf' })
    expect(await screen.findByTestId('study-doc-count')).toHaveTextContent('1 / 2')
  })

  it('keeps the open document when only the signed URL token rotates', async () => {
    const { rerender } = render(<PdfViewer fileUrl="https://storage.example.com/u/r1/v1.pdf?token=a" title="Guide" />)
    await waitForLoaded()
    fireEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(await screen.findByTestId('study-doc-count')).toHaveTextContent('2 / 2')

    rerender(<PdfViewer fileUrl="https://storage.example.com/u/r1/v1.pdf?token=b" title="Guide" />)

    expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('study-doc-count')).toHaveTextContent('2 / 2')
  })

  it('loads the new file when the file itself changes', async () => {
    const { rerender } = render(<PdfViewer fileUrl="https://storage.example.com/u/r1/v1.pdf?token=a" title="Guide" />)
    await waitForLoaded()
    rerender(<PdfViewer fileUrl="https://storage.example.com/u/r1/v2.pdf?token=b" title="Guide" />)
    await waitFor(() => expect(pdfjsLib.getDocument).toHaveBeenCalledTimes(2))
    expect(pdfjsLib.getDocument).toHaveBeenLastCalledWith({ url: 'https://storage.example.com/u/r1/v2.pdf?token=b' })
  })

  it('retries with a refreshed URL after an expired one failed to load', async () => {
    pdfjsLib.getDocument.mockReturnValueOnce({ promise: Promise.reject(new Error('expired')) })
    const { rerender } = render(<PdfViewer fileUrl="https://storage.example.com/u/r1/v1.pdf?token=old" title="Guide" />)
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    rerender(<PdfViewer fileUrl="https://storage.example.com/u/r1/v1.pdf?token=new" title="Guide" />)

    await waitForLoaded()
    expect(pdfjsLib.getDocument).toHaveBeenLastCalledWith({ url: 'https://storage.example.com/u/r1/v1.pdf?token=new' })
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('navigates pages and clamps at the ends', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitForLoaded()
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

  it('shows a friendly loader with rotating tips while opening', () => {
    pdfjsLib.getDocument.mockReturnValue({ promise: new Promise(() => {}) })
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    expect(screen.getByLabelText('Loading document')).toBeInTheDocument()
    expect(screen.getByText('Opening Your Document…')).toBeInTheDocument()
    expect(screen.getByText('Sharpening every page…')).toBeInTheDocument()
  })

  it('updates the count in real time as the user scrolls', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitForLoaded()
    const scroller = screen.getByTestId('study-doc-scroll')
    const pages = scroller.querySelector('[data-testid="study-doc-pages"]').children
    Object.defineProperty(scroller, 'clientHeight', { value: 800, configurable: true })
    Object.defineProperty(pages[0], 'offsetTop', { value: 0, configurable: true })
    Object.defineProperty(pages[1], 'offsetTop', { value: 1200, configurable: true })
    Object.defineProperty(scroller, 'scrollTop', { value: 1000, writable: true, configurable: true })
    fireEvent.scroll(scroller)
    expect(await screen.findByTestId('study-doc-count')).toHaveTextContent('2 / 2')
  })

  it('renders above CSS resolution on hidpi screens', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true })
    try {
      render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
      await waitForLoaded()
      const canvas = screen.getByTestId('study-doc-canvas-1')
      const cssWidth = parseInt(canvas.style.width, 10)
      expect(canvas.width).toBe(cssWidth * 2)
    } finally {
      Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true })
    }
  })

  it('caps the backing store at 2x device pixels to bound canvas memory', async () => {
    Object.defineProperty(window, 'devicePixelRatio', { value: 3, configurable: true })
    try {
      render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
      await waitForLoaded()
      const canvas = screen.getByTestId('study-doc-canvas-1')
      const cssWidth = parseInt(canvas.style.width, 10)
      expect(canvas.width).toBe(cssWidth * 2)
      expect(canvas.width).toBeLessThan(cssWidth * 3)
    } finally {
      Object.defineProperty(window, 'devicePixelRatio', { value: 1, configurable: true })
    }
  })

  it('only mounts canvases for a bounded window of pages', async () => {
    pdfjsLib.getDocument.mockReturnValue({ promise: Promise.resolve(pdfDouble(12)) })
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitForLoaded('1 / 12')

    const canvases = screen.getByTestId('study-doc-pages').querySelectorAll('canvas')
    expect(canvases.length).toBeGreaterThan(0)
    expect(canvases.length).toBeLessThan(12)
    expect(canvases.length).toBeLessThanOrEqual(3)
  })

  it('releases off-screen canvases when the user scrolls away', async () => {
    pdfjsLib.getDocument.mockReturnValue({ promise: Promise.resolve(pdfDouble(12)) })
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitForLoaded('1 / 12')

    const scroller = screen.getByTestId('study-doc-scroll')
    Object.defineProperty(scroller, 'clientHeight', { value: 800, configurable: true })
    Object.defineProperty(scroller, 'scrollTop', { value: 9000, writable: true, configurable: true })
    fireEvent.scroll(scroller)

    await waitFor(() => {
      expect(screen.queryByTestId('study-doc-canvas-1')).toBeNull()
      const canvases = screen.getByTestId('study-doc-pages').querySelectorAll('canvas')
      expect(canvases.length).toBeGreaterThan(0)
      expect(canvases.length).toBeLessThanOrEqual(3)
    })
  })

  it('coalesces rapid scroll events into one render frame', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitForLoaded()
    const scheduleSpy = vi.spyOn(window, 'requestAnimationFrame')
    scheduleSpy.mockClear()

    const scroller = screen.getByTestId('study-doc-scroll')
    fireEvent.scroll(scroller)
    fireEvent.scroll(scroller)
    fireEvent.scroll(scroller)

    expect(scheduleSpy).toHaveBeenCalledTimes(1)
    scheduleSpy.mockRestore()
  })

  it('cancels an in-flight render when the layout changes', async () => {
    const inFlight = { promise: new Promise(() => {}), cancel: vi.fn() }
    const page = {
      getViewport: ({ scale }) => ({ width: 100 * scale, height: 129 * scale }),
      render: vi.fn(() => inFlight),
    }
    pdfjsLib.getDocument.mockReturnValue({
      promise: Promise.resolve({
        numPages: 2,
        destroy: vi.fn(),
        getPage: vi.fn(async () => page),
      }),
    })

    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitFor(() => expect(page.render).toHaveBeenCalled())

    Object.defineProperty(document, 'fullscreenElement', {
      value: document.createElement('div'),
      configurable: true,
    })
    try {
      fireEvent(document, new Event('fullscreenchange'))
      await waitFor(() => expect(inFlight.cancel).toHaveBeenCalled())
    } finally {
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    }
  })

  it('starts fullscreen at 50% and restores 100% on exit', async () => {
    render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
    await waitForLoaded()
    expect(screen.queryByTestId('study-doc-zoom')).toBeNull()
    Object.defineProperty(document, 'fullscreenElement', { value: document.createElement('div'), configurable: true })
    fireEvent(document, new Event('fullscreenchange'))
    expect(await screen.findByTestId('study-doc-zoom')).toHaveTextContent('50%')
    Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    fireEvent(document, new Event('fullscreenchange'))
    expect(screen.queryByTestId('study-doc-zoom')).toBeNull()
  })

  it('starts mobile fullscreen at 100%', async () => {
    Object.defineProperty(window, 'matchMedia', {
      value: () => ({ matches: true }),
      configurable: true,
    })
    try {
      render(<PdfViewer fileUrl="https://storage.example.com/v1.pdf" title="Guide" />)
      await waitForLoaded()
      Object.defineProperty(document, 'fullscreenElement', { value: document.createElement('div'), configurable: true })
      fireEvent(document, new Event('fullscreenchange'))
      expect(await screen.findByTestId('study-doc-zoom')).toHaveTextContent('100%')
    } finally {
      delete window.matchMedia
      Object.defineProperty(document, 'fullscreenElement', { value: null, configurable: true })
    }
  })
})

describe('currentPageFromTops', () => {
  it('returns 1 for an empty list or a zero viewport', () => {
    expect(currentPageFromTops([], 0, 800)).toBe(1)
    expect(currentPageFromTops([0, 1200], 0, 0)).toBe(1)
  })

  it('picks the page under the probe line', () => {
    expect(currentPageFromTops([0, 1200], 0, 800)).toBe(1)
    expect(currentPageFromTops([0, 1200], 1000, 800)).toBe(2)
  })
})
