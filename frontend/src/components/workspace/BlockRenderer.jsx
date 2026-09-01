import MainTitleBlock from '../blocks/MainTitleBlock'
import TopicHeaderBanner from '../blocks/TopicHeaderBanner'
import SubTopicBanner from '../blocks/SubTopicBanner'
import ContentBlock from '../blocks/ContentBlock'
import TableBlock from '../blocks/TableBlock'

const BlockRenderer = ({ block, selected, onSelect, onUpdate, onDelete }) => {
  const renderBlock = () => {
    switch (block.blockType) {
      case 'main_title':
        return (
          <MainTitleBlock
            content={block.contentData}
            onChange={(content) => onUpdate({ contentData: content })}
          />
        )
      case 'topic_banner':
        return (
          <TopicHeaderBanner
            content={block.contentData}
            onChange={(content) => onUpdate({ contentData: content })}
          />
        )
      case 'sub_topic_banner':
        return (
          <SubTopicBanner
            content={block.contentData}
            onChange={(content) => onUpdate({ contentData: content })}
          />
        )
      case 'content_block':
        return (
          <ContentBlock
            content={block.contentData}
            onChange={(content) => onUpdate({ contentData: content })}
          />
        )
      case 'table':
        return (
          <TableBlock
            content={block.contentData}
            onChange={(content) => onUpdate({ contentData: content })}
          />
        )
      default:
        return <div className="text-muted">Unknown block type: {block.blockType}</div>
    }
  }

  return (
    <div
      className={`group relative rounded border transition-colors ${
        selected
          ? 'border-ink bg-stone/30'
          : 'border-transparent hover:border-stone hover:bg-stone/10'
      }`}
      onClick={onSelect}
    >
      {/* Block Controls */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="rounded p-1 text-muted hover:bg-stone hover:text-ink"
          title="Delete block"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Drag Handle */}
      <div className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
        <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
        </svg>
      </div>

      {/* Block Content */}
      <div className="p-4">{renderBlock()}</div>
    </div>
  )
}

export default BlockRenderer
