export const PAPER_SIZES = {
  Letter: { label: '8.5 × 11 in', width: 816, height: 1056 },
  A4: { label: '210 × 297 mm', width: 794, height: 1123 },
  Legal: { label: '8.5 × 14 in', width: 816, height: 1344 },
}

export const estimateBlock = (block) => {
  const data = block.contentData || {}
  switch (block.blockType) {
    case 'lesson_banner':
      return 104
    case 'topic_banner':
      return 56
    case 'sub_topic_banner':
      return 52
    case 'divider':
      return 30
    case 'page_break':
      return 0
    case 'table':
      return 84 + (data.rows?.length || 1) * 34
    case 'image':
      return data.src ? 260 : 90
    case 'terms_card':
      return 92 + (data.terms?.length || 1) * 60
    case 'content_block':
      return 64 + Math.ceil(((data.body || '').length + (data.heading || '').length) / 110) * 20
    case 'main_title':
      return 100
    case 'two_column':
      return 150
    default:
      return 90
  }
}

// Split blocks into bounded, printable pages. `page_break` blocks force a new page.
export const paginateBlocks = (blocks, paperKey) => {
  const paper = PAPER_SIZES[paperKey] || PAPER_SIZES.A4
  const budget = (pageIdx) => (pageIdx === 0 ? paper.height - 64 - 170 - 60 : paper.height - 64 - 60)
  const pages = [[]]
  const breakBefore = [false]
  let used = 0
  blocks.forEach((b) => {
    if (b.blockType === 'page_break') {
      pages.push([])
      breakBefore.push(true)
      used = 0
      return
    }
    const est = estimateBlock(b)
    const idx = pages.length - 1
    if (pages[idx].length > 0 && used + est > budget(idx)) {
      pages.push([b])
      breakBefore.push(false)
      used = est + 16
    } else {
      pages[idx].push(b)
      used += est + 16
    }
  })
  return { pages, breakBefore }
}
