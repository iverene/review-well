const TableBlock = ({ content, onChange }) => {
  const headers = content?.headers || ['Column 1', 'Column 2']
  const rows = content?.rows || [['', '']]

  const handleHeaderBlur = (index, value) => {
    const newHeaders = [...headers]
    newHeaders[index] = value
    onChange({ ...content, headers: newHeaders })
  }

  const handleCellBlur = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row
    )
    onChange({ ...content, rows: newRows })
  }

  const addRow = (e) => {
    e?.stopPropagation()
    onChange({ ...content, rows: [...rows, new Array(headers.length).fill('')] })
  }

  const addColumn = (e) => {
    e?.stopPropagation()
    onChange({
      ...content,
      headers: [...headers, `Column ${headers.length + 1}`],
      rows: rows.map((row) => [...row, '']),
    })
  }

  return (
    <div className="w-full min-w-0 space-y-2" onClick={(e) => e.stopPropagation()}>
      <div className="w-full min-w-0 overflow-hidden rounded-md border" style={{ borderColor: 'var(--sheet-primary, #604A3A)' }}>
        <table className="w-full min-w-0 table-fixed border-collapse text-sm">
          <colgroup>
            {headers.map((_, i) => (
              <col key={i} style={{ width: `${100 / Math.max(headers.length, 1)}%` }} />
            ))}
          </colgroup>
          <thead>
            <tr style={{ background: 'var(--sheet-primary, #604A3A)', color: '#fff' }}>
              {headers.map((header, index) => (
                <th key={index} className="w-0 border border-white/20 p-2 align-top">
                  <div
                    contentEditable
                    suppressContentEditableWarning
                    role="textbox"
                    aria-label={`Table header ${index + 1}`}
                    onBlur={(e) => handleHeaderBlur(index, e.currentTarget.textContent?.trim() || '')}
                    className="sheet-editable min-w-0 whitespace-pre-wrap break-words text-center font-bold"
                    style={{ color: '#fff', overflowWrap: 'anywhere' }}
                  >
                    {header}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className={rowIndex % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="w-0 border border-gray-200 p-2 align-top">
                    <div
                      contentEditable
                      suppressContentEditableWarning
                      role="textbox"
                      aria-label={`Row ${rowIndex + 1} column ${colIndex + 1}`}
                      onBlur={(e) => handleCellBlur(rowIndex, colIndex, e.currentTarget.textContent || '')}
                      className="sheet-editable min-h-[1.2em] min-w-0 whitespace-pre-wrap break-words"
                      style={{ overflowWrap: 'anywhere' }}
                    >
                      {cell}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="no-print flex gap-3">
        <button type="button" onClick={addRow} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          + Add Row
        </button>
        <button type="button" onClick={addColumn} className="text-xs font-semibold text-gray-500 hover:text-gray-900">
          + Add Column
        </button>
      </div>
    </div>
  )
}

export default TableBlock
