import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TermsCard from '../../../src/components/blocks/TermsCard'

describe('TermsCard', () => {
  it('renders title and terms', () => {
    render(
      <TermsCard
        content={{ title: 'Key Terms', terms: [{ term: 'Alpha', definition: 'First letter' }] }}
        onChange={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Terms card title' })).toHaveTextContent('Key Terms')
    expect(screen.getByRole('textbox', { name: 'Term 1' })).toHaveTextContent('Alpha')
    expect(screen.getByRole('textbox', { name: 'Definition 1' })).toHaveTextContent('First letter')
  })

  it('adds a term when clicking Add term', () => {
    const onChange = vi.fn()
    render(
      <TermsCard
        content={{ title: 'Key Terms', terms: [{ term: 'Alpha', definition: 'First' }] }}
        onChange={onChange}
      />
    )
    fireEvent.click(screen.getByText('Add term'))
    expect(onChange).toHaveBeenCalledWith({
      title: 'Key Terms',
      terms: [
        { term: 'Alpha', definition: 'First' },
        { term: 'Term 2', definition: 'Definition — click to edit.' },
      ],
    })
  })
})
