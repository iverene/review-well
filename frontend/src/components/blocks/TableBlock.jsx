const TableBlock = ({ content, onChange }) => {
  const headers = content?.headers || ['Column 1', 'Column 2']
  const rows = content?.rows || [['', '']]

  const handleHeaderChange = (index, value) => {
    const newHeaders = [...headers]
    newHeaders[index] = value
    onChange({ ...content, headers: newHeaders })
  }

  const handleCellChange = (rowIndex, colIndex, value) => {
    const newRows = rows.map((row, r) =>
      r === rowIndex ? row.map((cell, c) => (c === colIndex ? value : cell)) : row
    )
    onChange({ ...content, rows: newRows })
  }

  const addRow = () => {
    onChange({ ...content, rows: [...rows, new Array(headers.length).fill('')] })
  }

  const addColumn = () => {
    onChange({
      ...content,
      headers: [...headers, `Column ${headers.length + 1}`],
      rows: rows.map((row) => [...row, '']),
    })
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-stone">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="border border-stone bg-stone/50 p-2">
                  <input
                    type="text"
                    value={header}
                    onChange={(e) => handleHeaderChange(index, e.target.value)}
                    className="w-full bg-transparent text-center font-semibold text-ink border-none focus:outline-none"
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td key={colIndex} className="border border-stone p-2">
                    <input
                      type="text"
                      value={cell}
                      onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                      className="w-full bg-transparent text-ink border-none focus:outline-none"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex gap-2">
        <button
          onClick={addRow}
          className="text-xs text-muted hover:text-ink"
        >
          + Add Row
        </button>
        <button
          onClick={addColumn}
          className="text-xs text-muted hover:text-ink"
        >
          + Add Column
        </button>
      </div>
    </div>
  )
}

export default TableBlock
