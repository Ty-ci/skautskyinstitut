import { MARK_SYNTAX, type MarkKind } from '@/utils/guestEmail'

/*
 * The email editor's DOM (a `contentEditable` element) – read back as Markdown for the raw view,
 * and the "- " shortcut for lists. Browser-only.
 */

const isElement = (node: Node): node is HTMLElement => node.nodeType === Node.ELEMENT_NODE

const NBSP = String.fromCharCode(0xa0)

const markKindOf = (element: HTMLElement): MarkKind =>
  element.dataset.kind === 'fill' ? 'fill' : 'event'

/** Formatting around a run of text, with its spaces kept outside: `** a **` is no Markdown */
const wrap = (content: string, open: string, close = open) => {
  const inner = content.trim()
  if (!inner) {
    return content
  }
  const before = content.slice(0, content.length - content.trimStart().length)
  const after = content.slice(content.trimEnd().length)

  return `${before}${open}${inner}${close}${after}`
}

const inlineMarkdown = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) {
    // Editors type non-breaking spaces at the ends of words; a line break in the source is a space
    return (node.textContent ?? '').replaceAll(NBSP, ' ').replaceAll('\n', ' ')
  }
  if (!isElement(node)) {
    return ''
  }

  const content = () => [...node.childNodes].map(inlineMarkdown).join('')
  switch (node.tagName) {
    case 'BR':
      return '\n'
    case 'STRONG':
    case 'B':
      return wrap(content(), '**')
    case 'EM':
    case 'I':
      return wrap(content(), '*')
    case 'A': {
      const href = node.getAttribute('href') ?? ''

      return href ? `[${content()}](${href})` : content()
    }
    case 'MARK': {
      const { open, close } = MARK_SYNTAX[markKindOf(node)]

      return wrap(content(), open, close)
    }
    default:
      return content()
  }
}

const BLOCK_TAGS = new Set(['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BLOCKQUOTE'])

const listMarkdown = (list: HTMLElement) =>
  [...list.children]
    .filter((item) => item.tagName === 'LI')
    .map((item, index) => {
      const bullet = list.tagName === 'OL' ? String(index + 1).concat('.') : '-'

      return `${bullet} ${inlineMarkdown(item).replaceAll('\n', ' ').trim()}`
    })
    .join('\n')

/** The editor's content as the Markdown it was made from (see `@/utils/guestEmail`) */
export const editorToMarkdown = (root: HTMLElement) => {
  const blocks: string[] = []
  let loose = ''
  const flushLoose = () => {
    if (loose.trim()) {
      blocks.push(loose)
    }
    loose = ''
  }

  root.childNodes.forEach((node) => {
    if (isElement(node) && (node.tagName === 'UL' || node.tagName === 'OL')) {
      flushLoose()
      blocks.push(listMarkdown(node))
    } else if (isElement(node) && BLOCK_TAGS.has(node.tagName)) {
      flushLoose()
      blocks.push(inlineMarkdown(node))
    } else {
      // Text typed straight into the editor, outside any paragraph
      loose += inlineMarkdown(node)
    }
  })
  flushLoose()

  return blocks
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .join('\n')
        .trim(),
    )
    .filter(Boolean)
    .join('\n\n')
}

/** A one-line editor (the subject) as text with its highlights */
export const lineEditorToSource = (root: HTMLElement) =>
  inlineMarkdown(root).replaceAll('\n', ' ').replace(/\s+/g, ' ').trim()

// ── "- " starts a list ────────────────────────────────────────────────────────

// `\s` takes the non-breaking space an editor types as well
const LIST_PREFIX = /^-\s/

/** The editor's direct child holding the caret */
const blockAtCaret = (root: HTMLElement) => {
  const node = window.getSelection()?.anchorNode
  let current: Node | null = node ?? null
  while (current && current.parentNode !== root) {
    current = current.parentNode
  }

  return current
}

const placeCaretAtStart = (element: HTMLElement) => {
  const range = document.createRange()
  range.setStart(element, 0)
  range.collapse(true)
  const selection = window.getSelection()
  selection?.removeAllRanges()
  selection?.addRange(range)
}

/** Drops the first `count` characters of the element's text, across text nodes if need be */
const dropLeadingCharacters = (element: Node, count: number) => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT)
  let left = count
  for (let text = walker.nextNode(); text && left > 0; text = walker.nextNode()) {
    const value = text.textContent ?? ''
    text.textContent = value.slice(left)
    left -= Math.min(left, value.length)
  }
}

/**
 * Turns the paragraph being typed into a list item when it starts with "- ", joining the list
 * just above it if there is one. Call after a space was typed. `true` when it changed the editor.
 */
export const applyListShortcut = (root: HTMLElement) => {
  const block = blockAtCaret(root)
  if (!block || !LIST_PREFIX.test(block.textContent ?? '')) {
    return false
  }
  // Inside a list already, or in an element that isn't a plain paragraph
  if (isElement(block) && !BLOCK_TAGS.has(block.tagName)) {
    return false
  }

  dropLeadingCharacters(block, 2)
  const item = document.createElement('li')
  if (isElement(block)) {
    item.append(...block.childNodes)
  } else {
    item.append(block.cloneNode(true))
  }
  if (!item.textContent) {
    // An empty item needs something to hold the caret
    item.replaceChildren(document.createElement('br'))
  }

  const previous = block.previousSibling
  if (previous && isElement(previous) && previous.tagName === 'UL') {
    previous.append(item)
    root.removeChild(block)
  } else {
    const list = document.createElement('ul')
    list.append(item)
    root.replaceChild(list, block)
  }
  placeCaretAtStart(item)

  return true
}
