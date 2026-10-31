import { useRef } from 'react'

export const tabIds = (idBase, value) => ({
  tab: `${idBase}-tab-${value}`,
  panel: `${idBase}-panel-${value}`,
})

// Segmented tablist with roving focus: Left/Right/Home/End move between
// tabs and select them, as the WAI-ARIA tabs pattern expects.
const Tabs = ({ label, tabs, value, onChange, idBase, className = '' }) => {
  const refs = useRef({})

  const select = (index) => {
    const next = tabs[(index + tabs.length) % tabs.length]
    onChange(next.value)
    refs.current[next.value]?.focus()
  }

  const onKeyDown = (event, index) => {
    if (event.key === 'ArrowRight') select(index + 1)
    else if (event.key === 'ArrowLeft') select(index - 1)
    else if (event.key === 'Home') select(0)
    else if (event.key === 'End') select(tabs.length - 1)
    else return
    event.preventDefault()
  }

  return (
    <div role="tablist" aria-label={label} className={`flex gap-1 rounded-club border-2 border-stone bg-paper p-1 ${className}`}>
      {tabs.map(({ value: tabValue, label: tabLabel, icon: Icon, count }, index) => {
        const selected = tabValue === value
        const ids = tabIds(idBase, tabValue)
        return (
          <button
            key={tabValue}
            ref={(element) => { refs.current[tabValue] = element }}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tabValue)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`flex min-h-10 flex-1 items-center justify-center gap-2 rounded-soft px-3 py-2 text-sm font-extrabold transition-colors duration-150 ${selected ? 'bg-blush text-ink shadow-sticker-sm' : 'text-muted hover:bg-cream hover:text-ink'}`}
          >
            {Icon && <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />}
            <span>{tabLabel}</span>
            {typeof count === 'number' && <span className="font-mono text-xs">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default Tabs
