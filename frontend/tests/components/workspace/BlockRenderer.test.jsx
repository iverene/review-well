import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

import BlockRenderer from '../../../src/components/workspace/BlockRenderer'

describe('BlockRenderer', () => {
  it('renders topic_banner block', () => {
    const block = {
      id: '1',
      blockType: 'topic_banner',
      contentData: { heading: 'Test Topic' },
    }
    render(
      <BlockRenderer
        block={block}
        selected={false}
        onSelect={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Main topic heading' })).toHaveTextContent('Test Topic')
  })

  it('renders content_block block', () => {
    const block = {
      id: '2',
      blockType: 'content_block',
      contentData: { heading: 'Term', body: 'Definition' },
    }
    render(
      <BlockRenderer
        block={block}
        selected={false}
        onSelect={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />
    )
    expect(screen.getByRole('textbox', { name: 'Term or heading' })).toHaveTextContent('Term')
    expect(screen.getByRole('textbox', { name: 'Normal text body' })).toHaveTextContent('Definition')
  })

  it('renders terms_card block', () => {
    const block = {
      id: '7',
      blockType: 'terms_card',
      contentData: { title: 'Key Terms', terms: [{ term: 'Alpha', definition: 'First letter' }] },
    }
    render(
      <BlockRenderer block={block} selected={false} onSelect={() => {}} onUpdate={() => {}} onDelete={() => {}} />
    )
    expect(screen.getByRole('textbox', { name: 'Terms card title' })).toHaveTextContent('Key Terms')
    expect(screen.getByRole('textbox', { name: 'Term 1' })).toHaveTextContent('Alpha')
  })

  it('renders page_break marker', () => {
    const block = { id: '8', blockType: 'page_break', contentData: {} }
    render(
      <BlockRenderer block={block} selected={false} onSelect={() => {}} onUpdate={() => {}} onDelete={() => {}} />
    )
    expect(screen.getByText('Blank page break')).toBeInTheDocument()
  })

  it('renders lesson_banner block', () => {
    const block = {
      id: '6',
      blockType: 'lesson_banner',
      contentData: { heading: 'LESSON 1', subtitle: 'Intro' },
    }
    render(
      <BlockRenderer block={block} selected={false} onSelect={() => {}} onUpdate={() => {}} onDelete={() => {}} />
    )
    expect(screen.getByRole('textbox', { name: 'Lesson banner heading' })).toHaveTextContent('LESSON 1')
  })

  it('calls onSelect when clicking block', () => {
    const onSelect = vi.fn()
    const block = {
      id: '3',
      blockType: 'topic_banner',
      contentData: { heading: 'Test' },
    }
    render(
      <BlockRenderer
        block={block}
        selected={false}
        onSelect={onSelect}
        onUpdate={() => {}}
        onDelete={() => {}}
      />
    )
    fireEvent.click(screen.getByRole('textbox', { name: 'Main topic heading' }))
    expect(onSelect).toHaveBeenCalled()
  })

  it('applies selected styles when selected', () => {
    const block = {
      id: '4',
      blockType: 'topic_banner',
      contentData: { heading: 'Test' },
    }
    const { container } = render(
      <BlockRenderer
        block={block}
        selected={true}
        onSelect={() => {}}
        onUpdate={() => {}}
        onDelete={() => {}}
      />
    )
    expect(container.firstChild).toHaveClass('bg-blue-50/60')
  })

  it('shows delete button on hover', () => {
    const onDelete = vi.fn()
    const block = {
      id: '5',
      blockType: 'topic_banner',
      contentData: { heading: 'Test' },
    }
    render(
      <BlockRenderer
        block={block}
        selected={false}
        onSelect={() => {}}
        onUpdate={() => {}}
        onDelete={onDelete}
      />
    )
    // Delete button exists but is hidden until hover
    expect(screen.getByTitle('Delete block')).toBeInTheDocument()
  })
})
