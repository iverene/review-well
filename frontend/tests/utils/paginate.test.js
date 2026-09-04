import { describe, it, expect } from 'vitest'
import { estimateBlock, paginateBlocks } from '../../src/utils/paginate'

describe('paginateBlocks', () => {
  it('keeps small content on a single page', () => {
    const blocks = [
      { id: '1', blockType: 'topic_banner', contentData: { heading: 'T' } },
      { id: '2', blockType: 'content_block', contentData: { body: 'Short.' } },
    ]
    const { pages, breakBefore } = paginateBlocks(blocks, 'A4')
    expect(pages).toHaveLength(1)
    expect(pages[0]).toHaveLength(2)
    expect(breakBefore).toEqual([false])
  })

  it('flows overflow onto the next page instead of breaking early', () => {
    const blocks = Array.from({ length: 12 }, (_, i) => ({
      id: `b${i}`,
      blockType: 'terms_card',
      contentData: { title: 'Terms', terms: [{ term: `T${i}`, definition: 'D'.repeat(60) }] },
    }))
    const { pages } = paginateBlocks(blocks, 'A4')
    expect(pages.length).toBeGreaterThan(1)
    // Every content block lands on exactly one page, in order
    expect(pages.flat().map((b) => b.id)).toEqual(blocks.map((b) => b.id))
  })

  it('forces a new page on page_break markers', () => {
    const blocks = [
      { id: '1', blockType: 'topic_banner', contentData: { heading: 'A' } },
      { id: '2', blockType: 'page_break', contentData: {} },
      { id: '3', blockType: 'topic_banner', contentData: { heading: 'B' } },
    ]
    const { pages, breakBefore } = paginateBlocks(blocks, 'A4')
    expect(pages).toHaveLength(2)
    expect(pages[0].map((b) => b.id)).toEqual(['1'])
    expect(pages[1].map((b) => b.id)).toEqual(['3'])
    expect(breakBefore).toEqual([false, true])
  })

  it('estimates empty image placeholders as small', () => {
    expect(estimateBlock({ blockType: 'image', contentData: {} })).toBeLessThan(
      estimateBlock({ blockType: 'image', contentData: { src: 'data:image/png;base64,x' } })
    )
  })
})
