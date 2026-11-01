import type { Event } from '@/payload-types'

type RichText = NonNullable<Event['description']>

interface LexicalNode {
  text?: unknown
  children?: LexicalNode[]
}

const collectText = (node: LexicalNode): string => {
  if (typeof node.text === 'string') {
    return node.text
  }

  return (node.children ?? []).map(collectText).join('')
}

/**
 * Flattens Lexical rich text into plain text, one space between top-level blocks (e.g. for excerpts)
 */
export const richTextToPlainText = (richText: RichText) =>
  richText.root.children
    .map((node) => collectText(node as LexicalNode).trim())
    .filter(Boolean)
    .join(' ')
