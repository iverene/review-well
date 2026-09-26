import { useEffect, useRef, useState } from 'react'
import { Check, ChevronDown, SlidersHorizontal, X } from 'lucide-react'

export const ASSESSMENT_OPTIONS = [
  { value: 'prelim', label: 'Prelim' },
  { value: 'midterm', label: 'Midterm' },
  { value: 'final', label: 'Finals' },
  { value: 'quiz', label: 'Quiz' },
]

export const SEMESTER_OPTIONS = [
  { value: 'First Semester', label: 'First Semester' },
  { value: 'Second Semester', label: 'Second Semester' },
  { value: 'Summer', label: 'Summer' },
]

// Compact custom dropdown (native selects render oversized OS-styled
// popups on mobile). Single-open: opening one closes the other; Escape
// and outside clicks close.
const FilterSelect = ({ id, label, allLabel, value, options, onPick, openName, setOpenName }) => {
  const open = openName === id
  const ref = useRef(null)
  const selected = options.find((option) => option.value === value)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event) => {
      if (ref.current && !ref.current.contains(event.target)) setOpenName(null)
    }
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpenName(null)
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open, setOpenName])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        title={label}
        onClick={() => setOpenName(open ? null : id)}
        className={`inline-flex max-w-40 items-center gap-1.5 rounded-soft border-2 px-3 py-2 text-sm font-bold transition-colors sm:max-w-none ${
          value ? 'border-accent bg-blush/40 text-ink' : 'border-stone bg-paper text-muted hover:bg-powder hover:text-ink'
        }`}
      >
        <span className="truncate">{selected ? selected.label : allLabel}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-label={label}
          className="absolute left-0 z-50 mt-1.5 max-h-56 w-44 overflow-y-auto rounded-soft border-2 border-stone bg-paper p-1 shadow-xl"
        >
          <li role="option" aria-selected={!value}>
            <button
              type="button"
              onClick={() => {
                onPick('')
                setOpenName(null)
              }}
              className={`flex w-full items-center justify-between gap-2 rounded-soft px-2.5 py-1.5 text-left text-sm font-bold ${!value ? 'bg-blush/60 text-ink' : 'text-muted hover:bg-stone/40 hover:text-ink'}`}
            >
              {allLabel}
              {!value && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
            </button>
          </li>
          {options.map(({ value: optionValue, label: optionLabel }) => {
            const selectedOption = value === optionValue
            return (
              <li key={optionValue} role="option" aria-selected={selectedOption}>
                <button
                  type="button"
                  onClick={() => {
                    onPick(optionValue)
                    setOpenName(null)
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-soft px-2.5 py-1.5 text-left text-sm font-bold ${selectedOption ? 'bg-blush/60 text-ink' : 'text-muted hover:bg-stone/40 hover:text-ink'}`}
                >
                  {optionLabel}
                  {selectedOption && <Check className="h-3.5 w-3.5 text-accent" aria-hidden="true" />}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

// Assessment + semester filter for public reviewer lists. Controlled:
// parent owns { examType, semester } and receives onChange patches.
const Filter = ({ examType = '', semester = '', onChange, onClear }) => {
  const activeCount = [examType, semester].filter(Boolean).length
  const [open, setOpen] = useState(false)
  const [openSelect, setOpenSelect] = useState(null)

  return (
    <div aria-label="Filter reviewers">
      <div className="flex justify-end sm:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle filters"
          title="Filters"
          className={`relative inline-flex items-center rounded-soft border-2 px-3 py-2 text-ink ${open || activeCount > 0 ? 'border-accent bg-blush/40' : 'border-stone bg-paper hover:bg-powder'}`}
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          {activeCount > 0 && (
            <span
              data-testid="filter-active-count-mobile"
              className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1 text-[11px] font-extrabold text-paper"
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>
      <div className={`${open ? 'mt-2 flex' : 'hidden'} flex-wrap items-center gap-2 sm:flex`} aria-label="Filter reviewers">
      <span className="hidden items-center gap-1.5 text-sm font-extrabold text-muted sm:inline-flex">
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        Filter
        {activeCount > 0 && (
          <span
            data-testid="filter-active-count"
            className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-extrabold text-paper"
          >
            {activeCount}
          </span>
        )}
      </span>
      <label className="sr-only" htmlFor="filter-assessment">
        Assessment
      </label>
      <FilterSelect
        id="assessment"
        label="Assessment"
        allLabel="All Assessments"
        value={examType}
        options={ASSESSMENT_OPTIONS}
        onPick={(examType) => onChange({ examType })}
        openName={openSelect}
        setOpenName={setOpenSelect}
      />
      <label className="sr-only" htmlFor="filter-semester">
        Semester
      </label>
      <FilterSelect
        id="semester"
        label="Semester"
        allLabel="All Semesters"
        value={semester}
        options={SEMESTER_OPTIONS}
        onPick={(semester) => onChange({ semester })}
        openName={openSelect}
        setOpenName={setOpenSelect}
      />
      {activeCount > 0 && (
        <button
          type="button"
          onClick={onClear}
          aria-label="Clear filters"
          className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-extrabold text-muted hover:bg-stone/40 hover:text-ink"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" /> Clear
        </button>
      )}
      </div>
    </div>
  )
}

export default Filter
