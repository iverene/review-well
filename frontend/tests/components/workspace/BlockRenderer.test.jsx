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
    expect(screen.getByDisplayValue('Test Topic')).toBeInTheDocument()
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
    expect(screen.getByDisplayValue('Term')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Definition')).toBeInTheDocument()
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
    fireEvent.click(screen.getByDisplayValue('Test'))
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
    expect(container.firstChild).toHaveClass('border-accent')
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
