import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ChevronLeft, ChevronRight, Maximize, Minimize } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

// PDF viewer: renders every page to canvas inside a responsive scroll
// container (custom .study-doc-scroll scrollbar), with prev/next navigation,
// a "current / total" count, and fullscreen toggle. All browser APIs are
// guarded so server-side rendering and jsdom never crash.
const PdfViewer = ({ fileUrl, title = 'Document' }) => {
  const scrollRef = useRef(null)
  const pagesRef = useRef([])
  const docRef = useRef(null)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  const renderAll = useCallback(async (pdf, signal) => {
    const container = scrollRef.current
    if (!container) return
    const containerWidth = container.clientWidth || 800
    pagesRef.current = []
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (signal.aborted) return
      // eslint-disable-next-line no-await-in-loop
      const page = await pdf.getPage(pageNumber)
      if (signal.aborted) return
      const baseViewport = page.getViewport({ scale: 1 })
      const scale = containerWidth / baseViewport.width
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.className = 'w-full h-auto'
      const context = canvas.getContext('2d')
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: context, viewport }).promise
      if (signal.aborted) return
      const wrapper = document.createElement('div')
      wrapper.dataset.page = String(pageNumber)
      wrapper.appendChild(canvas)
      container.querySelector('[data-testid="study-doc-pages"]').appendChild(wrapper)
      pagesRef.current.push(wrapper)
    }
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setNumPages(0)
    setCurrentPage(1)
    const pagesEl = scrollRef.current?.querySelector('[data-testid="study-doc-pages"]')
    if (pagesEl) pagesEl.innerHTML = ''

    pdfjsLib
      .getDocument({ url: fileUrl })
      .promise.then(async (pdf) => {
        if (controller.signal.aborted) return
        docRef.current = pdf
        setNumPages(pdf.numPages)
        await renderAll(pdf, controller.signal)
        if (!controller.signal.aborted) setLoading(false)
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return
        console.error('Failed to load PDF:', loadError)
        setError('Unable to display this PDF. Try downloading it instead.')
        setLoading(false)
      })

    const onResize = () => {
      if (docRef.current && !controller.signal.aborted) {
        const pagesElNow = scrollRef.current?.querySelector('[data-testid="study-doc-pages"]')
        if (pagesElNow) pagesElNow.innerHTML = ''
        renderAll(docRef.current, controller.signal)
      }
    }
    let resizeTimer = null
    const onResizeDebounced = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(onResize, 250)
    }
    window.addEventListener('resize', onResizeDebounced)
    return () => {
      controller.abort()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResizeDebounced)
      docRef.current?.destroy?.()
      docRef.current = null
    }
  }, [fileUrl, renderAll])

  // Track the page most visible in the scroll container.
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const container = scrollRef.current
    if (!container || numPages === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible?.target?.dataset?.page) {
          setCurrentPage(Number(visible.target.dataset.page))
        }
      },
      { root: container, threshold: [0.25, 0.5, 0.75] }
    )
    // Observe after a tick so freshly rendered pages are in the DOM.
    const timer = setTimeout(() => {
      pagesRef.current.forEach((el) => observer.observe(el))
    }, 0)
    return () => {
      clearTimeout(timer)
      observer.disconnect()
    }
  }, [numPages, loading])

  useEffect(() => {
    const onFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  const goToPage = (pageNumber) => {
    const clamped = Math.min(Math.max(1, pageNumber), Math.max(1, numPages))
    setCurrentPage(clamped)
    pagesRef.current[clamped - 1]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const toggleFullscreen = () => {
    const container = scrollRef.current?.closest('[data-testid="study-source-pdf"]')
    if (document.fullscreenElement) {
      document.exitFullscreen?.()
    } else {
      container?.requestFullscreen?.()
    }
  }

  return (
    <div data-testid="study-source-pdf" className="overflow-hidden rounded-soft border-2 border-stone bg-paper">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-stone bg-cream px-3 py-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            aria-label="Previous page"
            className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <p data-testid="study-doc-count" aria-label="Page count" className="min-w-16 px-1 text-center font-mono text-xs font-bold text-ink">
            {numPages > 0 ? `${currentPage} / ${numPages}` : '…'}
          </p>
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            aria-label="Next page"
            className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <button
          type="button"
          onClick={toggleFullscreen}
          aria-label={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
          className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40"
        >
          {fullscreen ? <Minimize className="h-4 w-4" aria-hidden="true" /> : <Maximize className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>

      <div ref={scrollRef} data-testid="study-doc-scroll" className="study-doc-scroll h-[62vh] overflow-y-auto bg-cream/50 p-3 md:h-[72vh] md:p-4">
        {loading && (
          <div data-testid="study-doc-loading" className="space-y-3" aria-label="Loading document">
            <div className="h-6 w-24 animate-pulse rounded-soft bg-stone/40" />
            {[0, 1].map((i) => (
              <div key={i} className="aspect-[1/1.29] w-full animate-pulse rounded-soft bg-stone/40" />
            ))}
          </div>
        )}
        {error && !loading && (
          <p role="alert" className="rounded-soft border-2 border-blush bg-blush/40 px-4 py-3 text-sm font-bold text-ink">
            {error}
          </p>
        )}
        <div data-testid="study-doc-pages" aria-label={`${title} pages`} className="space-y-3" />
      </div>
    </div>
  )
}

export default PdfViewer
