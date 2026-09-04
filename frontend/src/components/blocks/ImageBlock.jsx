import { useEffect, useRef, useState } from 'react'

const MIN_W = 120
const MAX_W = 700

const ImageBlock = ({ content, onChange }) => {
  const boxRef = useRef(null)
  const [width, setWidth] = useState(content?.width || 480)
  const resizingRef = useRef(null)

  useEffect(() => {
    setWidth(content?.width || 480)
  }, [content?.width])

  const beginResize = (e) => {
    e.stopPropagation()
    e.preventDefault()
    const startX = e.clientX
    const startW = boxRef.current?.offsetWidth || width
    resizingRef.current = { width: startW }
    const onMove = (mv) => {
      const next = Math.min(MAX_W, Math.max(MIN_W, startW + (mv.clientX - startX)))
      resizingRef.current.width = Math.round(next)
      setWidth(Math.round(next))
    }
    const onUp = () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      onChange({ ...content, width: resizingRef.current?.width || startW })
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  if (!content?.src) {
    return (
      <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-xs text-gray-500">
        Image block — use Insert then Image to attach a picture.
      </div>
    )
  }

  return (
    <figure className="w-full min-w-0 space-y-1">
      <div
        ref={boxRef}
        className="relative mx-auto"
        style={{ width: `min(100%, ${width}px)` }}
      >
        <img
          src={content.src}
          alt={content?.caption || 'Inserted study image'}
          className="h-auto w-full rounded-md bg-gray-50 object-contain"
          draggable={false}
        />
        <button
          type="button"
          onMouseDown={beginResize}
          onClick={(e) => e.stopPropagation()}
          className="no-print absolute -bottom-1 -right-1 h-5 w-5 cursor-nwse-resize rounded-sm border border-gray-400 bg-white shadow"
          title="Drag to resize image"
          aria-label="Resize image"
        >
          <span className="block h-full w-full" style={{ background: 'linear-gradient(135deg, transparent 50%, #6b7280 50%)' }} />
        </button>
      </div>
      <div
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-label="Image caption"
        onBlur={(e) => onChange({ ...content, caption: e.currentTarget.textContent?.trim() || '' })}
        className="sheet-editable text-center text-xs text-gray-500"
      >
        {content?.caption || 'Add a caption…'}
      </div>
    </figure>
  )
}

export default ImageBlock
