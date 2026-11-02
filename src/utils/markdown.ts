/*
 * The bit of Markdown an event description in the sheet can use:
 *
 *   # Heading             - item / * item / 1. item         > quote
 *   **bold**   *italic* / _italic_   [text](https://…)   bare https://… links
 *
 * Blank lines separate paragraphs, single line breaks are kept. Anything else stays plain text.
 */

export type Inline =
  | { type: 'text'; text: string }
  | { type: 'strong' | 'em'; children: Inline[] }
  | { type: 'link'; href: string; text: string }

export type Block =
  | { type: 'heading' | 'paragraph' | 'quote'; lines: string[] }
  | { type: 'list'; ordered: boolean; items: string[] }

// Lines come trimmed, so a single whitespace character is all that separates the marker
const HEADING = /^#{1,6}\s(.*)$/
const BULLET_ITEM = /^[-*•]\s(.*)$/
const ORDERED_ITEM = /^\d+[.)]\s(.*)$/
const QUOTE = /^>(.*)$/

export const parseBlocks = (source: string) => {
  const blocks: Block[] = []

  source.split(/\r?\n/).forEach((rawLine, index, lines) => {
    const line = rawLine.trim()
    const last = blocks.at(-1)
    // A blank line ends the block before it; anything after starts a new one
    const continues = index > 0 && lines[index - 1]?.trim() !== ''
    if (line === '') {
      return
    }

    const heading = HEADING.exec(line)
    if (heading) {
      blocks.push({ type: 'heading', lines: [heading[1].trim()] })

      return
    }

    const bullet = BULLET_ITEM.exec(line)
    const numbered = ORDERED_ITEM.exec(line)
    const item = bullet ?? numbered
    if (item) {
      const ordered = numbered !== null
      // Items of a list may be separated by blank lines too
      if (last?.type === 'list' && last.ordered === ordered) {
        last.items.push(item[1].trim())
      } else {
        blocks.push({ type: 'list', ordered, items: [item[1].trim()] })
      }

      return
    }

    const quote = QUOTE.exec(line)
    const type = quote ? 'quote' : 'paragraph'
    const text = quote ? quote[1].trim() : line
    if (continues && last?.type === type) {
      last.lines.push(text)
    } else {
      blocks.push({ type, lines: [text] })
    }
  })

  return blocks
}

// One simple pattern per kind, rather than a single one that's hard to read and slow to fail
const INLINE_RULES = [
  // May hold *italic*, just not another `**`
  { type: 'strong', pattern: /\*\*((?:[^*\n]|\*[^*\n])+)\*\*/ },
  { type: 'em', pattern: /(?<![\w*])\*([^*\n]+)\*(?![\w*])/ },
  { type: 'em', pattern: /(?<!\w)_([^_\n]+)_(?!\w)/ },
  { type: 'link', pattern: /\[([^[\]\n]+)\]\(([^()\s]+)\)/ },
  { type: 'url', pattern: /https?:\/\/[^\s<>]+/ },
] as const

/** Not part of a bare link at its end: "(see https://…)." */
const URL_TRAILING_CHARACTERS = '.,;:!?\'")]'

/** Only web and e-mail links – a `javascript:` one from the sheet stays text */
const isSafeHref = (href: string) => /^(?:https?:\/\/|mailto:)/i.test(href)

/** The earliest match of any rule; on a tie, of the one listed first */
const findToken = (text: string) =>
  INLINE_RULES.reduce<{ type: (typeof INLINE_RULES)[number]['type']; match: RegExpExecArray } | null>(
    (found, { type, pattern }) => {
      const match = pattern.exec(text)

      return match && (!found || match.index < found.match.index) ? { type, match } : found
    },
    null,
  )

export const parseInline = (text: string) => {
  const nodes: Inline[] = []
  let rest = text

  for (let token = findToken(rest); token; token = findToken(rest)) {
    const { type, match } = token
    let node: Inline
    let length = match[0].length

    switch (type) {
      case 'strong':
        node = { type: 'strong', children: parseInline(match[1]) }
        break
      case 'em':
        // "2 * 3 * 4" isn't emphasis
        node =
          match[1].trim() === match[1]
            ? { type: 'em', children: parseInline(match[1]) }
            : { type: 'text', text: match[0] }
        break
      case 'link':
        node = isSafeHref(match[2])
          ? { type: 'link', href: match[2], text: match[1] }
          : { type: 'text', text: match[0] }
        break
      case 'url': {
        let url = match[0]
        while (URL_TRAILING_CHARACTERS.includes(url.at(-1) ?? '')) {
          url = url.slice(0, -1)
        }
        node = { type: 'link', href: url, text: url }
        length = url.length
        break
      }
    }

    if (match.index > 0) {
      nodes.push({ type: 'text', text: rest.slice(0, match.index) })
    }
    nodes.push(node)
    rest = rest.slice(match.index + length)
  }
  if (rest) {
    nodes.push({ type: 'text', text: rest })
  }

  return nodes
}

const inlineToPlainText = (nodes: Inline[]): string =>
  nodes
    .map((node) => ('children' in node ? inlineToPlainText(node.children) : node.text))
    .join('')

/** The text without the Markdown syntax, one block per line – for previews */
export const markdownToPlainText = (source: string) =>
  parseBlocks(source)
    .flatMap((block) =>
      block.type === 'list' ? block.items.map((item) => `• ${item}`) : block.lines.join('\n'),
    )
    .map((line) => inlineToPlainText(parseInline(line)))
    .join('\n')
