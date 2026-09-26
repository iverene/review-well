import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { CircleCheck, CircleX, Info } from 'lucide-react'

const ToastContext = createContext(null)

const noop = () => {}

// Module-level singleton so the fallback identity is stable across renders
// (a fresh object per call would retrigger any effect depending on it).
const fallbackToast = { toast: noop, success: noop, error: noop, info: noop, dismiss: noop }

export const useToast = () => {
  const context = useContext(ToastContext)
  // No-op stub outside the provider so unit-tested pages/components work
  // without wrapping; the real provider is mounted once in App.
  return context ?? fallbackToast
}

const TOAST_STYLES = {
  success: { Icon: CircleCheck, bar: 'bg-mint', icon: 'text-ink' },
  error: { Icon: CircleX, bar: 'bg-accent', icon: 'text-accent' },
  info: { Icon: Info, bar: 'bg-powder', icon: 'text-ink' },
}

const TOAST_DURATION_MS = 3500

// Single-toast provider: a new toast replaces the current one (never
// stacks) and the dismiss timer restarts on every show.
export const ToastProvider = ({ children }) => {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const dismiss = useCallback(() => {
    clearTimeout(timerRef.current)
    timerRef.current = null
    setToast(null)
  }, [])

  const show = useCallback((message, type = 'info') => {
    clearTimeout(timerRef.current)
    setToast({ id: Date.now(), message, type: TOAST_STYLES[type] ? type : 'info' })
    timerRef.current = setTimeout(() => {
      timerRef.current = null
      setToast(null)
    }, TOAST_DURATION_MS)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const success = useCallback((message) => show(message, 'success'), [show])
  const error = useCallback((message) => show(message, 'error'), [show])
  const info = useCallback((message) => show(message, 'info'), [show])

  // Stable identity so consumers' effects don't refire on every toast.
  const value = useMemo(
    () => ({ toast: show, success, error, info, dismiss }),
    [show, success, error, info, dismiss]
  )

  const { Icon, bar, icon } = toast ? TOAST_STYLES[toast.type] : {}

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <div
          className="fixed inset-x-0 top-0 z-[100] p-3 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-80 sm:p-0"
          aria-live="polite"
        >
          <div
            key={toast.id}
            role="status"
            className="flex items-center gap-3 rounded-soft border-2 border-stone bg-paper px-4 py-3 club-shadow"
          >
            <span className={`h-8 w-1.5 shrink-0 rounded-full ${bar}`} aria-hidden="true" />
            <Icon className={`h-5 w-5 shrink-0 ${icon}`} aria-hidden="true" />
            <p className="min-w-0 flex-1 text-sm font-bold text-ink">{toast.message}</p>
            <button
              type="button"
              onClick={dismiss}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-full p-1 text-muted hover:bg-stone/40 hover:text-ink"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </ToastContext.Provider>
  )
}
