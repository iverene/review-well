import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ChevronLeft, ChevronRight, Maximize, Minimize, Minus, Plus } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const ZOOM_STEP = 25
const ZOOM_MIN = 50
const ZOOM_MAX = 300

// Pure helper (exported for tests): given page top offsets (px, relative to
// the scroll container) pick the page under a probe line partway down the
// viewport. Scroll math — unlike IntersectionObserver thresholds — stays
// correct even when a single page is taller than the container.
export const currentPageFromTops = (tops, scrollTop, viewportHeight, probeRatio = 0.4) => {
  if (tops.length === 0) return 1
  const probe = scrollTop + viewportHeight * probeRatio
  if (probe <= 0) return 1
  let current = 1
  tops.forEach((top, index) => {
    if (top <= probe) current = index + 1
  })
  return current
}

// PDF viewer: every page rendered to canvas at a readable width (never
// stretched full-bleed), inside a responsive scroll container with a custom
// cocoa scrollbar. Toolbar has prev/next, a live "current / total" count
// driven by scroll position, fullscreen toggle, and — in fullscreen only —
// percent zoom controls.
const PdfViewer = ({ fileUrl, title = 'Document' }) => {
  const scrollRef = useRef(null)
  const pagesRef = useRef([])
  const docRef = useRef(null)
  const pageRef = useRef(1)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomPct, setZoomPct] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)

  pageRef.current = currentPage

  // Re-renders triggered outside the load effect (zoom, fullscreen
  // transitions) share one abortable controller so rapid changes and
  // unmounts never leave orphaned renders.
  const renderControllerRef = useRef(null)

  const zoomRef = useRef(100)
  zoomRef.current = zoomPct

  const updateCurrentFromScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container || pagesRef.current.length === 0) return
    const tops = pagesRef.current.map((el) => el.offsetTop)
    const next = currentPageFromTops(tops, container.scrollTop, container.clientHeight)
    setCurrentPage((previous) => (previous === next ? previous : next))
  }, [])

  const renderAll = useCallback(async (pdf, signal, zoomFactor) => {
    const container = scrollRef.current
    const pagesEl = container?.querySelector('[data-testid="study-doc-pages"]')
    if (!container || !pagesEl) return
    pagesEl.innerHTML = ''
    pagesRef.current = []
    const containerWidth = container.clientWidth || 800
    // Render above CSS resolution (device pixels) so pages stay sharp on
    // hidpi screens and when zoomed — the canvas backing store is denser
    // than its displayed CSS size.
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (signal.aborted) return
      // eslint-disable-next-line no-await-in-loop
      const page = await pdf.getPage(pageNumber)
      if (signal.aborted) return
      const baseViewport = page.getViewport({ scale: 1 })
      const cssWidth = (containerWidth * 0.92) * zoomFactor
      const scale = (cssWidth / baseViewport.width) * dpr
      const viewport = page.getViewport({ scale })
      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${Math.floor(cssWidth)}px`
      canvas.style.height = 'auto'
      const context = canvas.getContext('2d')
      // eslint-disable-next-line no-await-in-loop
      await page.render({ canvasContext: context, viewport }).promise
      if (signal.aborted) return
      const wrapper = document.createElement('div')
      wrapper.dataset.page = String(pageNumber)
      wrapper.className = 'study-doc-page'
      wrapper.style.width = `${Math.floor(cssWidth)}px`
      wrapper.appendChild(canvas)
      pagesEl.appendChild(wrapper)
      pagesRef.current.push(wrapper)
    }
  }, [])

  const rerenderAt = useCallback((zoomFactor) => {
    if (!docRef.current) return Promise.resolve()
    renderControllerRef.current?.abort()
    const controller = new AbortController()
    renderControllerRef.current = controller
    return renderAll(docRef.current, controller.signal, zoomFactor).then(() => {
      if (!controller.signal.aborted) {
        const el = pagesRef.current[pageRef.current - 1]
        el?.scrollIntoView?.({ block: 'start' })
        updateCurrentFromScroll()
      }
    })
  }, [renderAll, updateCurrentFromScroll])

  useEffect(() => () => {
    renderControllerRef.current?.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setNumPages(0)
    setCurrentPage(1)
    setZoomPct(100)
    const pagesEl = scrollRef.current?.querySelector('[data-testid="study-doc-pages"]')
    if (pagesEl) pagesEl.innerHTML = ''

    pdfjsLib
      .getDocument({ url: fileUrl })
      .promise.then(async (pdf) => {
        if (controller.signal.aborted) return
        docRef.current = pdf
        setNumPages(pdf.numPages)
        await renderAll(pdf, controller.signal, 1)
        if (!controller.signal.aborted) {
          setLoading(false)
          updateCurrentFromScroll()
        }
      })
      .catch((loadError) => {
        if (controller.signal.aborted) return
        console.error('Failed to load PDF:', loadError)
        setError('Unable to display this PDF. Try downloading it instead.')
        setLoading(false)
      })

    const onResize = () => {
      if (docRef.current && !controller.signal.aborted) {
        renderAll(docRef.current, controller.signal, zoomRef.current / 100)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileUrl, renderAll])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.addEventListener('scroll', updateCurrentFromScroll, { passive: true })
    return () => container.removeEventListener('scroll', updateCurrentFromScroll)
  }, [updateCurrentFromScroll])

  useEffect(() => {
    const onFullscreenChange = () => {
      const isFullscreen = !!document.fullscreenElement
      setFullscreen(isFullscreen)
      // Fullscreen starts zoomed out on desktop; on mobile it starts at
      // 100% since the narrow viewport is already at reading size.
      // Leaving restores the fixed 100% windowed scale so the embedded
      // view is never zoomed.
      if (!docRef.current) return
      const isCoarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false
      const next = !isFullscreen ? 100 : isCoarsePointer ? 100 : 50
      setZoomPct(next)
      rerenderAt(next / 100)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [rerenderAt])

  const goToPage = (pageNumber) => {
    const clamped = Math.min(Math.max(1, pageNumber), Math.max(1, numPages))
    setCurrentPage(clamped)
    pagesRef.current[clamped - 1]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }

  const changeZoom = (delta) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomPct + delta))
    if (next === zoomPct || !docRef.current) return
    setZoomPct(next)
    rerenderAt(next / 100)
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
    <div data-testid="study-source-pdf" className="study-source-pdf overflow-hidden rounded-soft border-2 border-stone bg-paper">
      <div className="relative flex flex-wrap items-center justify-between gap-2 border-b-2 border-stone bg-cream px-3 py-2">
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
        </div>
        <p data-testid="study-doc-count" aria-label="Page count" className="min-w-16 flex-1 px-1 text-center font-mono text-xs font-bold text-ink">
          {numPages > 0 ? `${currentPage} / ${numPages}` : '…'}
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            aria-label="Next page"
            className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40 disabled:opacity-40"
          >
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
          {fullscreen && (
            <>
              <button
                type="button"
                onClick={() => changeZoom(-ZOOM_STEP)}
                disabled={zoomPct <= ZOOM_MIN}
                aria-label="Zoom out"
                className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40 disabled:opacity-40"
              >
                <Minus className="h-4 w-4" aria-hidden="true" />
              </button>
              <p data-testid="study-doc-zoom" aria-label="Zoom level" className="min-w-14 px-1 text-center font-mono text-xs font-bold text-ink">
                {zoomPct}%
              </p>
              <button
                type="button"
                onClick={() => changeZoom(ZOOM_STEP)}
                disabled={zoomPct >= ZOOM_MAX}
                aria-label="Zoom in"
                className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            className="rounded-soft border-2 border-transparent p-1.5 text-ink hover:bg-stone/40"
          >
            {fullscreen ? <Minimize className="h-4 w-4" aria-hidden="true" /> : <Maximize className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <div ref={scrollRef} data-testid="study-doc-scroll" className="study-doc-scroll relative h-[62vh] overflow-auto bg-cream/50 p-3 md:h-[72vh] md:p-4">
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
