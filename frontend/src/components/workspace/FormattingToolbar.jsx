import { useState } from 'react'

const FormattingToolbar = ({ block, onUpdate }) => {
  const [showColorPicker, setShowColorPicker] = useState(false)

  const colors = [
    '#000000', '#434343', '#666666', '#999999', '#B7B7B7', '#CCCCCC', '#D9D9D9', '#EFEFEF', '#F3F3F3', '#FFFFFF',
    '#980000', '#FF0000', '#FF9900', '#FFFF00', '#00FF00', '#00FFFF', '#4A86E8', '#0000FF', '#9900FF', '#FF00FF',
    '#E6B8AF', '#F4CCCC', '#FCE5CD', '#FFF2CC', '#D9EAD3', '#D0E0E3', '#C9DAF8', '#CFE2F3', '#D9D2E9', '#EAD1DC',
    '#DD7E6B', '#EA9999', '#F9CB9C', '#FFE599', '#B6D7A8', '#A2C4C9', '#A4C2F4', '#9FC5E8', '#B4A7D6', '#D5A6BD',
    '#CC4125', '#E06666', '#F6B26B', '#FFD966', '#93C47D', '#76A5AF', '#6D9EEB', '#6FA8DC', '#8E7CC3', '#C27BA0',
    '#A61C00', '#CC0000', '#E69138', '#F1C232', '#6AA84F', '#45818E', '#3C78D8', '#3D85C6', '#674EA7', '#A64D79',
    '#85200C', '#990000', '#B45F06', '#BF9000', '#38761D', '#134F5C', '#1155CC', '#0B5394', '#351C75', '#741B47',
    '#5B0F00', '#660000', '#783F04', '#7F6000', '#274E13', '#0C343D', '#1C4587', '#073763', '#20124D', '#4C1130',
  ]

  const handleColorChange = (color) => {
    if (block?.contentData) {
      onUpdate({
        contentData: {
          ...block.contentData,
          color,
        },
      })
    }
    setShowColorPicker(false)
  }

  return (
    <div className="flex items-center gap-2 border-b border-stone bg-paper px-4 py-2 md:px-6">
      {/* Text Formatting */}
      <div className="flex items-center gap-1 border-r border-stone pr-2">
        <button className="rounded p-2 text-ink hover:bg-stone" title="Bold">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
          </svg>
        </button>
        <button className="rounded p-2 text-ink hover:bg-stone" title="Italic">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4h4m-2 0l-4 16m-2 0h4m2-16l4 16" />
          </svg>
        </button>
        <button className="rounded p-2 text-ink hover:bg-stone" title="Underline">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v7a5 5 0 0010 0V4M5 21h14" />
          </svg>
        </button>
      </div>

      {/* Alignment */}
      <div className="flex items-center gap-1 border-r border-stone pr-2">
        <button className="rounded p-2 text-ink hover:bg-stone" title="Align Left">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h10M4 18h14" />
          </svg>
        </button>
        <button className="rounded p-2 text-ink hover:bg-stone" title="Align Center">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M7 12h10M5 18h14" />
          </svg>
        </button>
      </div>

      {/* Color */}
      <div className="relative">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="flex items-center gap-1 rounded p-2 text-ink hover:bg-stone"
          title="Text Color"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10M5 3h14M9 7h6M9 11h6M9 15h6" />
          </svg>
          <div
            className="h-3 w-3 rounded border border-stone"
            style={{ backgroundColor: block?.contentData?.color || '#000000' }}
          />
        </button>

        {showColorPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowColorPicker(false)}
            />
            <div className="absolute left-0 z-50 mt-2 w-64 rounded border border-stone bg-paper p-2 shadow-lg">
              <div className="grid grid-cols-10 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className="h-6 w-6 rounded border border-stone hover:scale-110"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Block Type Info */}
      <div className="ml-auto text-xs text-muted">
        {block?.blockType?.replace('_', ' ')}
      </div>
    </div>
  )
}

export default FormattingToolbar
