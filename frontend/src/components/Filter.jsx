import { useState } from 'react'
import { SlidersHorizontal, X } from 'lucide-react'

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

const selectClassName =
  'rounded-soft border-2 border-stone bg-paper px-3 py-2 text-sm font-bold text-ink focus:border-accent focus:outline-none'

// Assessment + semester filter for public reviewer lists. Controlled:
// parent owns { examType, semester } and receives onChange patches.
const Filter = ({ examType = '', semester = '', onChange, onClear }) => {
  const activeCount = [examType, semester].filter(Boolean).length
  const [open, setOpen] = useState(false)

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
      <select
        id="filter-assessment"
        value={examType}
        onChange={(e) => onChange({ examType: e.target.value })}
        className={selectClassName}
      >
        <option value="">All Assessments</option>
        {ASSESSMENT_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="filter-semester">
        Semester
      </label>
      <select
        id="filter-semester"
        value={semester}
        onChange={(e) => onChange({ semester: e.target.value })}
        className={selectClassName}
      >
        <option value="">All Semesters</option>
        {SEMESTER_OPTIONS.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
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
