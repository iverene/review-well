import { useState } from 'react'

const TOKENS = {
  '--deck-cream': '#FFF7E8',
  '--deck-cocoa': '#604A3A',
  '--deck-blush': '#F6C6D2',
  '--deck-powder': '#C9E6F2',
  '--deck-mint': '#CDE8D2',
  '--deck-butter': '#F9E4A8',
  '--deck-berry': '#C96A83',
}

const shuffleIndices = (indices) => {
  const order = [...indices]
  for (let i = order.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  return order
}

// Presentational deck: cards come in as props (no data fetching inside).
// Callbacks: onToggleKnown(id, known), onAdd({ front, back }),
// onEdit(id, { front, back }), onDelete(id), onGenerate().
const FlashcardDeck = ({
  cards = [],
  guest = false,
  onToggleKnown = () => {},
  onAdd = () => {},
  onEdit = () => {},
  onDelete = () => {},
  remaining,
  onGenerate,
}) => {
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [order, setOrder] = useState(null)
  const [formMode, setFormMode] = useState(null)
  const [front, setFront] = useState('')
  const [back, setBack] = useState('')

  const total = cards.length
  const knownCount = cards.filter((card) => card.known).length
  const baseOrder = cards.map((_, i) => i)
  const activeOrder = order && order.length === total ? order : baseOrder
  const current = total === 0 ? null : cards[activeOrder[index % total]]

  const goTo = (next) => {
    setIndex(((next % total) + total) % total)
    setFlipped(false)
  }

  const handleCardKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      setFlipped((value) => !value)
    } else if (event.key === 'ArrowRight') {
      goTo(index + 1)
    } else if (event.key === 'ArrowLeft') {
      goTo(index - 1)
    }
  }

  const openForm = (mode) => {
    setFormMode(mode)
    setFront(mode === 'edit' && current ? current.front : '')
    setBack(mode === 'edit' && current ? current.back : '')
  }

  const saveForm = () => {
    if (!front.trim() || !back.trim()) return
    if (formMode === 'edit' && current) {
      onEdit(current.id, { front: front.trim(), back: back.trim() })
    } else {
      onAdd({ front: front.trim(), back: back.trim() })
    }
    setFormMode(null)
    setFront('')
    setBack('')
  }

  const canGenerate = Number(remaining) > 0 && typeof onGenerate === 'function'

  return (
    <div aria-label="Flashcard deck" style={{ ...TOKENS, color: 'var(--deck-cocoa)' }}>
      <style>{'@media (prefers-reduced-motion: reduce) { .deck-flip { transition: none !important; } }'}</style>

      {guest && (
        <p data-testid="deck-guest-banner" style={{ background: 'var(--deck-powder)' }}>
          Sign in with Google to save progress
        </p>
      )}

      {total === 0 ? (
        <div data-testid="deck-empty">
          {canGenerate ? (
            <button
              type="button"
              onClick={onGenerate}
              style={{ background: 'var(--deck-butter)' }}
            >
              Generate starter deck
            </button>
          ) : (
            <p>No cards yet — add cards manually below.</p>
          )}
        </div>
      ) : (
        <div>
          <p data-testid="deck-progress">
            {knownCount} / {total} known
          </p>
          <div
            role="progressbar"
            aria-label="Deck progress"
            aria-valuenow={total === 0 ? 0 : Math.round((knownCount / total) * 100)}
            aria-valuemin={0}
            aria-valuemax={100}
            style={{ background: 'var(--deck-cream)' }}
          >
            <div
              style={{
                width: `${total === 0 ? 0 : (knownCount / total) * 100}%`,
                background: 'var(--deck-mint)',
              }}
            />
          </div>

          <div
            role="button"
            tabIndex={0}
            aria-label="Flip card"
            onClick={() => setFlipped((value) => !value)}
            onKeyDown={handleCardKeyDown}
            className="deck-flip"
            style={{
              background: flipped ? 'var(--deck-blush)' : 'var(--deck-cream)',
              transition: 'background 200ms ease',
            }}
          >
            {flipped ? current.back : current.front}
          </div>

          <div>
            <button type="button" aria-label="Previous card" onClick={() => goTo(index - 1)}>
              Previous
            </button>
            <button type="button" aria-label="Next card" onClick={() => goTo(index + 1)}>
              Next
            </button>
            <button
              type="button"
              aria-label="Shuffle deck"
              onClick={() => {
                setOrder(shuffleIndices(baseOrder))
                setIndex(0)
                setFlipped(false)
              }}
            >
              Shuffle
            </button>
            <button
              type="button"
              aria-label={current.known ? 'Mark as still learning' : 'Mark as known'}
              onClick={() => onToggleKnown(current.id, !current.known)}
              style={{ background: current.known ? 'var(--deck-mint)' : 'var(--deck-butter)' }}
            >
              {current.known ? 'Still learning' : 'Known'}
            </button>
            <button type="button" aria-label="Edit card" onClick={() => openForm('edit')}>
              Edit
            </button>
            <button type="button" aria-label="Delete card" onClick={() => onDelete(current.id)}>
              Delete
            </button>
          </div>
        </div>
      )}

      {formMode === null && (
        <button type="button" aria-label="Add card" onClick={() => openForm('add')}>
          Add card
        </button>
      )}
      {formMode && (
        <div>
          <label htmlFor="deck-front">Front</label>
          <input
            id="deck-front"
            value={front}
            onChange={(event) => setFront(event.target.value)}
          />
          <label htmlFor="deck-back">Back</label>
          <input
            id="deck-back"
            value={back}
            onChange={(event) => setBack(event.target.value)}
          />
          <button type="button" aria-label="Save card" onClick={saveForm}>
            Save card
          </button>
          <button type="button" aria-label="Cancel" onClick={() => setFormMode(null)}>
            Cancel
          </button>
        </div>
      )}
    </div>
  )
}

export default FlashcardDeck
