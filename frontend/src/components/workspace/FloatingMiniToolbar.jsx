import { ClipboardPaste, Copy, CopyPlus, Trash2, X } from 'lucide-react'

const FloatingMiniToolbar = ({ position, canPaste, onCopy, onPaste, onDuplicate, onDelete, onClose }) => {
  if (!position) return null
  const style = {
    left: Math.min(Math.max(position.x, 8), window.innerWidth - 300),
    top: Math.max(position.y - 56, 8),
  }

  const item = 'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100'

  return (
    <div
      className="no-print fixed z-[70] flex items-center gap-0.5 rounded-xl border border-gray-200 bg-white px-1.5 py-1 shadow-xl"
      style={style}
      role="toolbar"
      aria-label="Quick actions"
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <button type="button" className={item} onClick={onCopy}>
        <Copy className="h-3.5 w-3.5" aria-hidden="true" /> Copy
      </button>
      <button type="button" className={item} onClick={onPaste} disabled={!canPaste} title={canPaste ? 'Paste copy below' : 'Copy something first'}>
        <ClipboardPaste className="h-3.5 w-3.5" aria-hidden="true" /> Paste
      </button>
      <button type="button" className={item} onClick={onDuplicate}>
        <CopyPlus className="h-3.5 w-3.5" aria-hidden="true" /> Duplicate
      </button>
      <button type="button" className={`${item} text-red-600 hover:bg-red-50`} onClick={onDelete}>
        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Delete
      </button>
      <button type="button" className="rounded-md px-1.5 py-1.5 text-xs text-gray-400 hover:bg-gray-100" onClick={onClose} aria-label="Dismiss quick actions">
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}

export default FloatingMiniToolbar
