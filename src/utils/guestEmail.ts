import { type Inline, parseBlocks, parseInline } from '@/utils/markdown'

/*
 * The email asking an event's guests for their details (photo, a few lines about them) and telling
 * them the practical information. Written as simple Markdown (see `@/utils/markdown`) and rendered
 * to HTML for the dashboard's editor, from which it is copied into Gmail with its formatting.
 *
 * Two highlights on top of the Markdown, shown while writing and dropped when copying:
 *
 *   {{from the event}}   [[still to fill in]]
 *
 * Kept free of server imports: it runs in the browser.
 */

/** The parts of a `SiteEvent` the email needs – all of them plain text, safe to hand to a browser */
export interface GuestEmailEvent {
  slug: string
  title: string
  /** ISO instant */
  start: string
  /** ISO instant */
  end?: string
  hasTime: boolean
  place?: string
  facebookLink?: string
  instagramLink?: string
}

export type MarkKind = 'event' | 'fill'

export const MARK_SYNTAX: Record<MarkKind, { open: string; close: string }> = {
  event: { open: '{{', close: '}}' },
  fill: { open: '[[', close: ']]' },
}

/** Comes from the event */
const fromEvent = (text: string) => `{{${text}}}`
/** Still to be filled in by hand */
const toFill = (text: string) => `[[${text}]]`

// ── The event's details ───────────────────────────────────────────────────────

const partsFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Bratislava',
  day: 'numeric',
  month: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

const wallClock = (iso: string) => {
  const parts = partsFormat.formatToParts(new Date(iso))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((candidate) => candidate.type === type)?.value ?? ''

  return { date: `${part('day')}.${part('month')}.`, time: `${part('hour')}:${part('minute')}` }
}

/** The title before its subtitle: `Zabudnutí hrdinovia - mladí ľudia…` → `Zabudnutí hrdinovia` */
export const shortTitleOf = (title: string) =>
  title
    .replace(/\s+/g, ' ')
    .split(/ [-–—] |: /)[0]
    ?.trim() || title

const detailsOf = (event: GuestEmailEvent) => {
  const start = wallClock(event.start)
  const end = event.end ? wallClock(event.end) : null
  const minutes = event.end
    ? Math.round((new Date(event.end).getTime() - new Date(event.start).getTime()) / 60_000)
    : 0
  const isMultiDay = end !== null && end.date !== start.date

  return {
    date: isMultiDay ? `${start.date} – ${end.date}` : start.date,
    time: event.hasTime ? start.time : '',
    // A real length only for a timed event ending the same day; otherwise the usual hour
    duration: event.hasTime && end && !isMultiDay && minutes > 0 ? minutes : null,
  }
}

// ── The text ──────────────────────────────────────────────────────────────────

export const buildSubject = (event: GuestEmailEvent) =>
  `Skautský inštitút - ${toFill('diskusia')} ${fromEvent(detailsOf(event).date)} ${fromEvent(shortTitleOf(event.title))}`

const socialLine = (event: GuestEmailEvent) => {
  const places = [
    event.instagramLink ? `na [${fromEvent('Instagrame')}](${event.instagramLink})` : '',
    event.facebookLink ? `na [${fromEvent('Facebooku')}](${event.facebookLink})` : '',
  ].filter(Boolean)

  return places.length > 0
    ? `Podujatie máme uverejnené ${places.join(' a ')}.`
    : `Podujatie máme uverejnené ${toFill('na Instagrame (odkaz) a na Facebooku (odkaz)')}.`
}

/** The body as Markdown, with the highlighted parts marked */
export const buildBodyMarkdown = (event: GuestEmailEvent) => {
  const { date, time, duration } = detailsOf(event)
  const when = fromEvent(time ? `${date} o ${time}` : date)
  const length = duration ? fromEvent(String(duration).concat(' min.')) : toFill('60 min.')

  return [
    'Dobrý deň,',
    `ozývam sa kvôli pripravovanému podujatiu **${fromEvent(event.title)}**.`,
    `Ďakujem vám za prijatie pozvania ${toFill('a ochotu priblížiť nám ďalší kúsok témy, ktorá je nanajvýš relevantná aj dnes.')}`,
    '',
    'Zhrniem technické informácie:',
    `- **Termín:** ${when} *(prosíme vás, ak môžete, prísť cca ${toFill('15 min.')} vopred, aby sme sa pripravili)*`,
    `- **Trvanie:** ${length}`,
    `- **Miesto:** ${event.place ? fromEvent(event.place) : toFill('miesto')}`,
    `- ${toFill('Podujatie plánujeme nahrávať (iba záznam, bez online streamu), aby sme ho vedeli rozšíriť cez skautské kruhy aj do ďalších miest')}`,
    `- ${toFill('Vstupné je bezplatné, s možnosťou dobrovoľného príspevku (ak máte tiež aktívne zbierky, vieme spropagovať).')}`,
    '',
    'Pre účely propagácie podujatia vás prosím o podklady k medailónikom:',
    '- fotka',
    '- krátky text o vás (max 2-3 vety)',
    '',
    'Pre zjednodušenie prikladám návrhy medailónikov z dostupných zdrojov - ak sú za vás v poriadku, stačí potvrdiť:',
    `- **${toFill('Meno Priezvisko')}:** ${toFill('návrh textu')}`,
    `- **${toFill('Meno Priezvisko')}:** ${toFill('návrh textu')}`,
    '',
    'Potešíme sa, ak nám pomôžete spropagovať podujatie, ak je to pre vás možné.',
    socialLine(event),
    '',
    'V prípade akýchkoľvek otázok sa na nás neváhajte obrátiť, rádi zodpovieme a vyriešime, čo treba.',
    'S pozdravom',
    '',
    `**${toFill('Meno Priezvisko - prezývka')}**`,
    toFill('Garant SI v Bratislave'),
    toFill('telefón'),
  ].join('\n')
}

// ── Rendering ─────────────────────────────────────────────────────────────────

// Private-use characters stand in for the highlights while the Markdown is parsed: never typed,
// and invisible to its rules (`[[…]]` would otherwise look like the start of a link)
const SENTINEL: Record<MarkKind, { open: string; close: string }> = {
  event: { open: String.fromCharCode(0xe000), close: String.fromCharCode(0xe001) },
  fill: { open: String.fromCharCode(0xe002), close: String.fromCharCode(0xe003) },
}
const kinds = Object.keys(SENTINEL) as MarkKind[]

const toSentinels = (source: string) =>
  kinds.reduce(
    (text, kind) =>
      text
        // eslint-disable-next-line security/detect-object-injection -- `kind` is one of our own keys
        .replaceAll(MARK_SYNTAX[kind].open, SENTINEL[kind].open)
        // eslint-disable-next-line security/detect-object-injection
        .replaceAll(MARK_SYNTAX[kind].close, SENTINEL[kind].close),
    source,
  )

// eslint-disable-next-line security/detect-non-literal-regexp -- built from our own constants
const ALL_SENTINELS = new RegExp(`[${SENTINEL.event.open}-${SENTINEL.fill.close}]`, 'g')

const escapeHtml = (text: string) =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')

interface RenderOptions {
  /** `false` for the copy going out: the highlights are only a hint for whoever is writing */
  marks?: boolean
}

/** Escaped text, with the highlights turned into `<mark>`s – or dropped */
const textHtml = (text: string, { marks = true }: RenderOptions) => {
  const escaped = escapeHtml(text)
  if (!marks) {
    return escaped.replace(ALL_SENTINELS, '')
  }

  return kinds.reduce(
    (html, kind) =>
      html
        // eslint-disable-next-line security/detect-object-injection -- `kind` is one of our own keys
        .replaceAll(SENTINEL[kind].open, `<mark data-kind="${kind}">`)
        // eslint-disable-next-line security/detect-object-injection
        .replaceAll(SENTINEL[kind].close, '</mark>'),
    escaped,
  )
}

const inlineHtml = (nodes: Inline[], options: RenderOptions): string =>
  nodes
    .map((node) => {
      if (node.type === 'text') {
        return textHtml(node.text, options)
      }
      if (node.type === 'link') {
        return `<a href="${escapeHtml(node.href)}">${textHtml(node.text, options)}</a>`
      }

      return `<${node.type}>${inlineHtml(node.children, options)}</${node.type}>`
    })
    .join('')

/** Paragraphs keep their single line breaks, as an email does */
export const markdownToHtml = (source: string, options: RenderOptions = {}) =>
  parseBlocks(toSentinels(source))
    .map((block) => {
      if (block.type === 'list') {
        const tag = block.ordered ? 'ol' : 'ul'
        const items = block.items.map(
          (item) => `<li>${inlineHtml(parseInline(item), options)}</li>`,
        )

        return `<${tag}>${items.join('')}</${tag}>`
      }
      const lines = block.lines.map((line) => inlineHtml(parseInline(line), options))

      return `<p>${lines.join('<br>')}</p>`
    })
    .join('')

/** A single line with its highlights, e.g. the subject – no Markdown in it */
export const lineToHtml = (line: string, options: RenderOptions = {}) =>
  textHtml(toSentinels(line), options)

const inlineText = (nodes: Inline[]): string =>
  nodes
    .map((node) => {
      if (node.type === 'text') {
        return node.text
      }
      if (node.type === 'link') {
        return node.text === node.href ? node.href : `${node.text} (${node.href})`
      }

      return inlineText(node.children)
    })
    .join('')

/** The text without any syntax, for mail clients that take plain text only */
export const markdownToPlainText = (source: string) =>
  parseBlocks(toSentinels(source).replace(ALL_SENTINELS, ''))
    .map((block) =>
      block.type === 'list'
        ? block.items
            .map((item, index) => {
              const bullet = block.ordered ? String(index + 1).concat('.') : '-'

              return `${bullet} ${inlineText(parseInline(item))}`
            })
            .join('\n')
        : block.lines.map((line) => inlineText(parseInline(line))).join('\n'),
    )
    .join('\n\n')

/** A single line without the highlight syntax */
export const lineToPlainText = (line: string) => toSentinels(line).replace(ALL_SENTINELS, '')
