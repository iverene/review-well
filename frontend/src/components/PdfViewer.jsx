import { useCallback, useEffect, useRef, useState } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ChevronLeft, ChevronRight, Maximize, Minimize, Minus, Plus } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

const ZOOM_STEP = 25
const ZOOM_MIN = 50
const ZOOM_MAX = 300

// Keep the DOM light for long documents: only pages within half a viewport
// of the visible area keep a canvas mounted.
const PAGE_GAP_PX = 12
const VIEWPORT_BUFFER_RATIO = 0.5
const MAX_DEVICE_PIXEL_RATIO = 2
const MAX_CANVAS_PIXELS = 6_000_000

const LOADING_TIPS = [
  'Sharpening every page…',
  'Counting pages…',
  'Warming up the viewer…',
]

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

// PDF viewer: pages are laid out as sized placeholders and only the visible
// window is rendered to canvas. This keeps memory bounded for long PDFs while
// preserving the scroll-position page counter, zoom, and fullscreen behavior.
const PdfViewer = ({ fileUrl, title = 'Document' }) => {
  const scrollRef = useRef(null)
  const pagesRef = useRef([])
  const docRef = useRef(null)
  const pageRef = useRef(1)
  const pageSizeRef = useRef({ width: 100, height: 129 })
  const renderedRef = useRef(new Set())
  const inflightRef = useRef(new Map())
  const renderTasksRef = useRef(new Map())
  const wantedRef = useRef(new Set())
  const generationRef = useRef(0)
  const scrollFrameRef = useRef(null)
  const scrollUsesRafRef = useRef(true)
  const zoomRef = useRef(100)
  const [numPages, setNumPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [zoomPct, setZoomPct] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [fullscreen, setFullscreen] = useState(false)
  const [tipIndex, setTipIndex] = useState(0)
  // Signed URLs get a fresh token on every detail fetch, so a background
  // refresh would otherwise re-download the file and jump back to page 1.
  // Load per file (URL without its query); a new token only matters when
  // the last attempt failed, e.g. because the cached URL had expired.
  const filePath = fileUrl ? String(fileUrl).split('?')[0] : fileUrl
  const fileUrlRef = useRef(fileUrl)
  fileUrlRef.current = fileUrl
  const loadFailedRef = useRef(false)
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    if (loadFailedRef.current) setRetryToken((token) => token + 1)
  }, [fileUrl])

  useEffect(() => {
    if (!loading) return
    const timer = setInterval(() => {
      setTipIndex((i) => (i + 1) % LOADING_TIPS.length)
    }, 2500)
    return () => clearInterval(timer)
  }, [loading])

  pageRef.current = currentPage
  zoomRef.current = zoomPct

  const pageTops = useCallback(() => {
    let cursor = 0
    return pagesRef.current.map((element, index) => {
      const height = element.offsetHeight || parseInt(element.style.height, 10) || 0
      // jsdom reports 0 for every offsetTop; fall back to the height-based
      // layout there while using real browser measurements when available.
      const measured = element.offsetTop
      const top = measured > 0 || index === 0 ? measured : cursor
      cursor = Math.max(cursor, top + height + PAGE_GAP_PX)
      return top
    })
  }, [])

  const updateCurrentFromScroll = useCallback(() => {
    const container = scrollRef.current
    if (!container || pagesRef.current.length === 0) return
    const tops = pageTops()
    const next = currentPageFromTops(
      tops,
      container.scrollTop || 0,
      container.clientHeight || 800
    )
    pageRef.current = next
    setCurrentPage((previous) => (previous === next ? previous : next))
  }, [pageTops])

  const buildPlaceholders = useCallback((count, zoomFactor = 1) => {
    const container = scrollRef.current
    const pagesEl = container?.querySelector('[data-testid="study-doc-pages"]')
    if (!pagesEl) return

    pagesEl.innerHTML = ''
    pagesRef.current = []
    renderedRef.current.clear()
    inflightRef.current.clear()
    renderTasksRef.current.clear()
    wantedRef.current.clear()

    const width = Math.floor((container.clientWidth || 800) * 0.92 * zoomFactor)
    const base = pageSizeRef.current
    const height = Math.max(1, Math.floor(width * (base.height / base.width)))

    for (let pageNumber = 1; pageNumber <= count; pageNumber += 1) {
      const wrapper = document.createElement('div')
      wrapper.dataset.page = String(pageNumber)
      wrapper.className = 'study-doc-page'
      wrapper.style.width = `${width}px`
      wrapper.style.height = `${height}px`
      wrapper.style.marginInline = 'auto'
      wrapper.setAttribute('data-testid', `study-doc-page-${pageNumber}`)
      pagesEl.appendChild(wrapper)
      pagesRef.current.push(wrapper)
    }
  }, [])

  const applyLayout = useCallback((zoomFactor) => {
    const container = scrollRef.current
    if (!container) return
    const width = Math.floor((container.clientWidth || 800) * 0.92 * zoomFactor)
    const base = pageSizeRef.current
    const height = Math.max(1, Math.floor(width * (base.height / base.width)))
    pagesRef.current.forEach((wrapper) => {
      wrapper.style.width = `${width}px`
      wrapper.style.height = `${height}px`
    })
  }, [])

  const releasePage = useCallback((pageNumber) => {
    const task = renderTasksRef.current.get(pageNumber)
    task?.cancel?.()
    renderTasksRef.current.delete(pageNumber)

    const wrapper = pagesRef.current[pageNumber - 1]
    const canvas = wrapper?.querySelector('canvas')
    if (canvas) {
      canvas.width = 0
      canvas.height = 0
      canvas.remove()
    }
    renderedRef.current.delete(pageNumber)
  }, [])

  const clearRendered = useCallback(() => {
    generationRef.current += 1
    renderTasksRef.current.forEach((task) => task.cancel?.())
    renderTasksRef.current.clear()
    inflightRef.current.clear()
    wantedRef.current.clear()
    pagesRef.current.forEach((wrapper) => {
      const canvas = wrapper.querySelector('canvas')
      if (canvas) {
        canvas.width = 0
        canvas.height = 0
        canvas.remove()
      }
    })
    renderedRef.current.clear()
  }, [])

  const renderPage = useCallback(async (pageNumber) => {
    const pdf = docRef.current
    const wrapper = pagesRef.current[pageNumber - 1]
    if (!pdf || !wrapper) return
    if (renderedRef.current.has(pageNumber) || inflightRef.current.has(pageNumber)) return

    const generation = generationRef.current
    inflightRef.current.set(pageNumber, generation)

    try {
      const page = await pdf.getPage(pageNumber)
      if (generation !== generationRef.current || !wantedRef.current.has(pageNumber)) return

      const baseViewport = page.getViewport({ scale: 1 })
      const containerWidth = scrollRef.current?.clientWidth || 800
      const cssWidth = Math.floor(containerWidth * 0.92 * (zoomRef.current / 100))
      const cssHeight = Math.max(1, Math.floor(cssWidth * (baseViewport.height / baseViewport.width)))
      wrapper.style.width = `${cssWidth}px`
      wrapper.style.height = `${cssHeight}px`

      // Never allocate more than 2x device pixels. Very large zoom levels can
      // still produce huge canvases, so cap total backing-store pixels too.
      const dpr = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO)
      let scale = (cssWidth / baseViewport.width) * dpr
      let viewport = page.getViewport({ scale })
      const pixelCount = viewport.width * viewport.height
      if (pixelCount > MAX_CANVAS_PIXELS) {
        scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixelCount)
        viewport = page.getViewport({ scale })
      }

      const canvas = document.createElement('canvas')
      canvas.width = Math.floor(viewport.width)
      canvas.height = Math.floor(viewport.height)
      canvas.style.width = `${cssWidth}px`
      canvas.style.height = 'auto'
      canvas.className = 'block h-auto max-w-full'
      canvas.setAttribute('data-testid', `study-doc-canvas-${pageNumber}`)

      const context = canvas.getContext('2d')
      const task = page.render({ canvasContext: context, viewport })
      renderTasksRef.current.set(pageNumber, task)
      await task.promise
      if (renderTasksRef.current.get(pageNumber) === task) {
        renderTasksRef.current.delete(pageNumber)
      }

      if (generation !== generationRef.current || !wantedRef.current.has(pageNumber)) {
        canvas.width = 0
        canvas.height = 0
        return
      }
      if (pagesRef.current[pageNumber - 1] !== wrapper) {
        canvas.width = 0
        canvas.height = 0
        return
      }

      wrapper.querySelectorAll('canvas').forEach((existing) => existing.remove())
      wrapper.appendChild(canvas)
      renderedRef.current.add(pageNumber)
    } catch (renderError) {
      renderTasksRef.current.delete(pageNumber)
      if (generation === generationRef.current && wantedRef.current.has(pageNumber)) {
        console.error('Failed to render PDF page:', renderError)
      }
    } finally {
      if (inflightRef.current.get(pageNumber) === generation) {
        inflightRef.current.delete(pageNumber)
      }
    }
  }, [])

  const renderVisiblePages = useCallback(async () => {
    const container = scrollRef.current
    if (!container || pagesRef.current.length === 0) return

    const viewportHeight = container.clientHeight || 800
    const scrollTop = container.scrollTop || 0
    const buffer = viewportHeight * VIEWPORT_BUFFER_RATIO
    const start = scrollTop - buffer
    const end = scrollTop + viewportHeight + buffer
    const tops = pageTops()
    const wanted = new Set()

    tops.forEach((top, index) => {
      const wrapper = pagesRef.current[index]
      const height = wrapper.offsetHeight || parseInt(wrapper.style.height, 10) || 0
      if (top + height >= start && top <= end) wanted.add(index + 1)
    })
    if (pageRef.current >= 1 && pageRef.current <= pagesRef.current.length) {
      wanted.add(pageRef.current)
    }
    wantedRef.current = wanted

    renderedRef.current.forEach((pageNumber) => {
      if (!wanted.has(pageNumber)) releasePage(pageNumber)
    })

    await Promise.all([...wanted].map((pageNumber) => renderPage(pageNumber)))
  }, [pageTops, releasePage, renderPage])

  const cancelScheduledRender = useCallback(() => {
    if (scrollFrameRef.current === null) return
    if (scrollUsesRafRef.current && typeof window.cancelAnimationFrame === 'function') {
      window.cancelAnimationFrame(scrollFrameRef.current)
    } else {
      window.clearTimeout(scrollFrameRef.current)
    }
    scrollFrameRef.current = null
  }, [])

  const scheduleRenderVisible = useCallback(() => {
    if (scrollFrameRef.current !== null) return
    const run = () => {
      scrollFrameRef.current = null
      renderVisiblePages()
    }
    if (typeof window.requestAnimationFrame === 'function') {
      scrollUsesRafRef.current = true
      scrollFrameRef.current = window.requestAnimationFrame(run)
    } else {
      scrollUsesRafRef.current = false
      scrollFrameRef.current = window.setTimeout(run, 16)
    }
  }, [renderVisiblePages])

  const handleScroll = useCallback(() => {
    updateCurrentFromScroll()
    scheduleRenderVisible()
  }, [updateCurrentFromScroll, scheduleRenderVisible])

  const rerenderAt = useCallback((zoomFactor) => {
    if (!docRef.current) return Promise.resolve()
    cancelScheduledRender()
    clearRendered()
    applyLayout(zoomFactor)
    return renderVisiblePages().then(() => {
      const element = pagesRef.current[pageRef.current - 1]
      element?.scrollIntoView?.({ block: 'start' })
      updateCurrentFromScroll()
    })
  }, [applyLayout, cancelScheduledRender, clearRendered, renderVisiblePages, updateCurrentFromScroll])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    setNumPages(0)
    setCurrentPage(1)
    setZoomPct(100)
    zoomRef.current = 100
    pageRef.current = 1
    pagesRef.current = []
    const pagesEl = scrollRef.current?.querySelector('[data-testid="study-doc-pages"]')
    if (pagesEl) pagesEl.innerHTML = ''

    const load = async () => {
      let pdf = null
      loadFailedRef.current = false
      try {
        pdf = await pdfjsLib.getDocument({ url: fileUrlRef.current }).promise
        if (controller.signal.aborted) {
          pdf.destroy?.()
          return
        }
        const firstPage = await pdf.getPage(1)
        if (controller.signal.aborted) {
          pdf.destroy?.()
          return
        }

        const baseViewport = firstPage.getViewport({ scale: 1 })
        pageSizeRef.current = {
          width: baseViewport.width,
          height: baseViewport.height,
        }
        docRef.current = pdf
        setNumPages(pdf.numPages)
        buildPlaceholders(pdf.numPages, 1)
        await renderVisiblePages()
        if (!controller.signal.aborted) {
          setLoading(false)
          updateCurrentFromScroll()
        }
      } catch (loadError) {
        if (controller.signal.aborted) return
        loadFailedRef.current = true
        console.error('Failed to load PDF:', loadError)
        setError('Unable to display this PDF. Try downloading it instead.')
        setLoading(false)
      }
    }
    load()

    let resizeTimer = null
    const onResize = () => {
      if (docRef.current && !controller.signal.aborted) {
        rerenderAt(zoomRef.current / 100)
      }
    }
    const onResizeDebounced = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(onResize, 250)
    }
    window.addEventListener('resize', onResizeDebounced)
    return () => {
      controller.abort()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResizeDebounced)
      cancelScheduledRender()
      clearRendered()
      docRef.current?.destroy?.()
      docRef.current = null
    }
  }, [
    filePath,
    retryToken,
    buildPlaceholders,
    cancelScheduledRender,
    clearRendered,
    renderVisiblePages,
    rerenderAt,
    updateCurrentFromScroll,
  ])

  useEffect(() => {
    const container = scrollRef.current
    if (!container) return
    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => () => {
    cancelScheduledRender()
  }, [cancelScheduledRender])

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
      zoomRef.current = next
      setZoomPct(next)
      rerenderAt(next / 100)
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [rerenderAt])

  const goToPage = (pageNumber) => {
    const clamped = Math.min(Math.max(1, pageNumber), Math.max(1, numPages))
    pageRef.current = clamped
    setCurrentPage(clamped)
    pagesRef.current[clamped - 1]?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    scheduleRenderVisible()
  }

  const changeZoom = (delta) => {
    const next = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoomPct + delta))
    if (next === zoomPct || !docRef.current) return
    zoomRef.current = next
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
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1 px-2 py-2 sm:gap-2 sm:px-3 border-b-2 border-stone bg-cream">
        <div />
        <div className="flex items-center gap-1 justify-self-center">
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
        <div className="flex items-center gap-1 justify-self-end">
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
          <div data-testid="study-doc-loading" className="flex flex-col items-center px-6 py-14 text-center" aria-label="Loading document">
            <img src="/logo.webp" alt="" aria-hidden="true" className="auth-logo h-20 w-20 object-contain" />
            <p className="mt-4 font-display text-xl font-bold text-ink">Opening Your Document…</p>
            <p className="mt-1 text-sm font-semibold text-muted" aria-live="polite">{LOADING_TIPS[tipIndex]}</p>
            <span className="auth-bar mt-4" aria-hidden="true" />
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
