import { Fragment } from 'react'

import { type Inline, parseBlocks, parseInline } from '@/utils/markdown'

interface Props {
  /** See `@/utils/markdown` for the syntax */
  source: string
  className?: string
}

const BLOCK_TAGS = { heading: 'h3', quote: 'blockquote', paragraph: 'p' } as const

// Nodes have no identity beyond their position, hence the index keys below
/* eslint-disable react/no-array-index-key */

const renderInline = (nodes: Inline[]) =>
  nodes.map((node, index) => {
    if (node.type === 'text') {
      return <Fragment key={index}>{node.text}</Fragment>
    }
    if (node.type === 'link') {
      return (
        <a key={index} href={node.href} target="_blank" rel="noreferrer">
          {node.text}
        </a>
      )
    }
    const Tag = node.type

    return <Tag key={index}>{renderInline(node.children)}</Tag>
  })

/** Event description (or any text from the sheet) written in simple Markdown */
const Markdown = ({ source, className }: Props) => (
  <div className={`rich-text ${className ?? ''}`}>
    {parseBlocks(source).map((block, index) => {
      if (block.type === 'list') {
        const List = block.ordered ? 'ol' : 'ul'

        return (
          <List key={index}>
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{renderInline(parseInline(item))}</li>
            ))}
          </List>
        )
      }
      const Tag = BLOCK_TAGS[block.type]

      return (
        // Single line breaks within a block are kept
        <Tag key={index} className="whitespace-pre-line">
          {renderInline(parseInline(block.lines.join('\n')))}
        </Tag>
      )
    })}
  </div>
)

export default Markdown
