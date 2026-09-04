import { FilePlus2, GripVertical, X } from 'lucide-react'

import MainTitleBlock from '../blocks/MainTitleBlock'
import TopicHeaderBanner from '../blocks/TopicHeaderBanner'
import SubTopicBanner from '../blocks/SubTopicBanner'
import LessonBanner from '../blocks/LessonBanner'
import ContentBlock from '../blocks/ContentBlock'
import TableBlock from '../blocks/TableBlock'
import ImageBlock from '../blocks/ImageBlock'
import DividerBlock from '../blocks/DividerBlock'
import TwoColumnBlock from '../blocks/TwoColumnBlock'
import TermsCard from '../blocks/TermsCard'

const BlockRenderer = ({
  block,
  selected,
  onSelect,
  onUpdate,
  onDelete,
  styleProps,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
}) => {
  const renderBlock = () => {
    const content = block.contentData || {}
    const onChange = (next) => onUpdate({ contentData: next })
    switch (block.blockType) {
      case 'main_title':
        return <MainTitleBlock content={content} onChange={onChange} />
      case 'lesson_banner':
        return <LessonBanner content={content} onChange={onChange} />
      case 'topic_banner':
        return <TopicHeaderBanner content={content} onChange={onChange} />
      case 'sub_topic_banner':
        return <SubTopicBanner content={content} onChange={onChange} />
      case 'content_block':
        return <ContentBlock content={content} onChange={onChange} {...styleProps} />
      case 'table':
        return <TableBlock content={content} onChange={onChange} />
      case 'image':
        return <ImageBlock content={content} onChange={onChange} />
      case 'divider':
        return <DividerBlock content={content} onChange={onChange} />
      case 'two_column':
        return <TwoColumnBlock content={content} onChange={onChange} />
      case 'terms_card':
        return <TermsCard content={content} onChange={onChange} fontSize={styleProps?.fontSize} align={styleProps?.align} />
      case 'page_break':
        return (
          <div className="no-print flex items-center justify-center gap-2 rounded-md border border-dashed border-gray-300 bg-gray-50 py-3 text-xs font-semibold text-gray-400">
            <FilePlus2 className="h-4 w-4" aria-hidden="true" /> Blank page break
          </div>
        )
      default:
        return <div className="text-sm text-gray-500">Unknown block type: {block.blockType}</div>
    }
  }

  return (
    <div
      data-block-id={block.id}
      className={`group relative w-full min-w-0 rounded-md transition-colors ${
        selected ? 'bg-blue-50/60 outline outline-1 outline-blue-300' : 'hover:bg-gray-50'
      }`}
      onClick={(e) => { e.stopPropagation(); onSelect?.(e) }}
      draggable={!!draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="no-print absolute -left-2 top-1 z-10 hidden -translate-x-full items-center gap-1 group-hover:flex">
        {draggable && (
          <span
            className="cursor-grab rounded border border-gray-200 bg-white p-1 text-gray-400 shadow-sm active:cursor-grabbing"
            title="Drag to move image"
            aria-hidden="true"
          >
            <GripVertical className="h-3.5 w-3.5" />
          </span>
        )}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete?.() }}
          className="rounded border border-gray-200 bg-white p-1 text-gray-500 shadow-sm hover:text-red-600"
          title="Delete block"
          aria-label="Delete block"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
      <div className={block.blockType === 'divider' ? '' : 'w-full min-w-0 p-2'}>{renderBlock()}</div>
    </div>
  )
}

export default BlockRenderer
