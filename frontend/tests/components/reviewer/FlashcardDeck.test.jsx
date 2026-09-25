import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import FlashcardDeck from '../../../src/components/FlashcardDeck'

const cards = [
  { id: 'card-1', front: 'Front 1', back: 'Back 1', known: true },
  { id: 'card-2', front: 'Front 2', back: 'Back 2', known: false },
]

const baseProps = {
  cards,
  guest: false,
  onToggleKnown: () => {},
  onAdd: () => {},
  onEdit: () => {},
  onDelete: () => {},
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('FlashcardDeck', () => {
  it('flips the card on click', () => {
    render(<FlashcardDeck {...baseProps} />)
    expect(screen.getByText('Front 1')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Flip Card' }))
    expect(screen.getByText('Back 1')).toBeInTheDocument()
  })

  it('flips the card on Enter key', () => {
    render(<FlashcardDeck {...baseProps} />)
    fireEvent.keyDown(screen.getByRole('button', { name: 'Flip Card' }), { key: 'Enter' })
    expect(screen.getByText('Back 1')).toBeInTheDocument()
  })

  it('navigates with next button and arrow keys, showing known/total progress', () => {
    render(<FlashcardDeck {...baseProps} />)
    expect(screen.getByTestId('deck-progress')).toHaveTextContent('1 / 2 Known')

    fireEvent.click(screen.getByRole('button', { name: 'Next Card' }))
    expect(screen.getByText('Front 2')).toBeInTheDocument()

    fireEvent.keyDown(screen.getByRole('button', { name: 'Flip Card' }), { key: 'ArrowLeft' })
    expect(screen.getByText('Front 1')).toBeInTheDocument()
  })

  it('shuffles the deck order', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0)
    render(<FlashcardDeck {...baseProps} />)
    fireEvent.click(screen.getByRole('button', { name: 'Shuffle Deck' }))
    // Fisher-Yates with Math.random() === 0 reverses a 2-card deck
    expect(screen.getByText('Front 2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Next Card' }))
    expect(screen.getByText('Front 1')).toBeInTheDocument()
  })

  it('toggles Known / Still learning via callback', () => {
    const onToggleKnown = vi.fn()
    render(<FlashcardDeck {...baseProps} onToggleKnown={onToggleKnown} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark as Still Learning' }))
    expect(onToggleKnown).toHaveBeenCalledWith('card-1', false)
  })

  it('shows a guest banner for guests', () => {
    render(<FlashcardDeck {...baseProps} guest />)
    expect(screen.getByText('Sign in with Google to save progress')).toBeInTheDocument()
  })

  it('adds a card through the form', () => {
    const onAdd = vi.fn()
    render(<FlashcardDeck {...baseProps} onAdd={onAdd} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add Card' }))
    fireEvent.change(screen.getByLabelText('Front'), { target: { value: 'Q' } })
    fireEvent.change(screen.getByLabelText('Back'), { target: { value: 'A' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Card' }))
    expect(onAdd).toHaveBeenCalledWith({ front: 'Q', back: 'A' })
  })

  it('edits and deletes the current card', () => {
    const onEdit = vi.fn()
    const onDelete = vi.fn()
    render(<FlashcardDeck {...baseProps} onEdit={onEdit} onDelete={onDelete} />)
    fireEvent.click(screen.getByRole('button', { name: 'Edit Card' }))
    fireEvent.change(screen.getByLabelText('Front'), { target: { value: 'Q2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save Card' }))
    expect(onEdit).toHaveBeenCalledWith('card-1', { front: 'Q2', back: 'Back 1' })

    fireEvent.click(screen.getByRole('button', { name: 'Delete Card' }))
    expect(onDelete).toHaveBeenCalledWith('card-1')
  })

  it('shows a Generate slot in the empty state when quota remains', () => {
    const onGenerate = vi.fn()
    render(<FlashcardDeck {...baseProps} cards={[]} remaining={2} onGenerate={onGenerate} />)
    fireEvent.click(screen.getByRole('button', { name: 'Generate Starter Deck' }))
    expect(onGenerate).toHaveBeenCalled()
  })

  it('shows a manual-only notice with no Generate button when quota is exhausted', () => {
    render(<FlashcardDeck {...baseProps} cards={[]} remaining={0} onGenerate={() => {}} />)
    expect(screen.getByText(/add cards manually/i)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Generate Starter Deck' })).not.toBeInTheDocument()
  })
})
