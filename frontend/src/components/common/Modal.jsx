import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

const TONES = {
  paper: 'bg-paper',
  mint: 'bg-mint',
}

const SIZES = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
}

// Accessible dialog: bottom sheet on phones, centered card from `sm` up.
// Traps Tab inside, closes on Escape or a backdrop click, and returns focus
// to whatever opened it.
const Modal = ({
  open,
  onClose,
  title,
  role = 'dialog',
  tone = 'paper',
  size = 'sm',
  closeLabel,
  initialFocusRef,
  describedBy,
  children,
}) => {
  const panelRef = useRef(null)
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose
  const titleId = useId()

  useEffect(() => {
    if (!open) return undefined
    const opener = document.activeElement
    const panel = panelRef.current
    const target = initialFocusRef?.current || panel?.querySelector(FOCUSABLE) || panel
    target?.focus()

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        onCloseRef.current?.()
        return
      }
      if (event.key !== 'Tab' || !panel) return
      const focusable = [...panel.querySelectorAll(FOCUSABLE)]
      if (focusable.length === 0) {
        event.preventDefault()
        return
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (opener instanceof HTMLElement && document.contains(opener)) opener.focus()
    }
  }, [open, initialFocusRef])

  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-ink/35" aria-hidden="true" data-testid="modal-backdrop" onMouseDown={() => onCloseRef.current?.()} />
      <div
        ref={panelRef}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={`relative max-h-[90dvh] w-full overflow-y-auto rounded-t-club border-2 border-b-0 border-stone p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-sticker club-rise focus:outline-none sm:mx-auto sm:rounded-club sm:border-b-2 sm:pb-5 ${TONES[tone] || TONES.paper} ${SIZES[size] || SIZES.sm}`}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 id={titleId} className="font-display text-xl font-bold text-ink">{title}</h2>
          {closeLabel && (
            <button
              type="button"
              onClick={() => onCloseRef.current?.()}
              aria-label={closeLabel}
              className="-mr-1 -mt-1 rounded-soft p-1.5 text-ink hover:bg-stone/50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body
  )
}

export default Modal
