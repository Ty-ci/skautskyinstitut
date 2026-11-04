'use client'

import {
  type KeyboardEvent,
  type MouseEvent,
  type SyntheticEvent,
  useEffect,
  useRef,
  useState,
} from 'react'

import {
  applyListShortcut,
  editorToMarkdown,
  lineEditorToSource,
} from '@/components/dashboard/guest-email/editorDom'
import TileIcon from '@/components/dashboard/TileIcon'
import {
  buildBodyMarkdown,
  buildSubject,
  type GuestEmailEvent,
  lineToHtml,
  lineToPlainText,
  markdownToHtml,
  markdownToPlainText,
} from '@/utils/guestEmail'

type EventOption = GuestEmailEvent & { isPast: boolean }

interface Props {
  /** Soonest first, as `getEvents` gives them */
  events: EventOption[]
}

type Mode = 'rendered' | 'raw'

/** The upcoming event coming soonest, or the latest one when all are past */
const initialEvent = (events: EventOption[]) =>
  events.find((event) => !event.isPast) ?? events.at(-1)

const dateLabel = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  timeZone: 'Europe/Bratislava',
})

// ── Copying ───────────────────────────────────────────────────────────────────

interface ClipboardContent {
  text: string
  /** Rich text, which Gmail pastes with its formatting */
  html?: string
}

/** The editor's HTML without the highlights – they are only a hint for whoever is writing */
const htmlWithoutMarks = (element: HTMLElement) => {
  const clone = element.cloneNode(true) as HTMLElement
  clone.querySelectorAll('mark').forEach((mark) => mark.replaceWith(...mark.childNodes))

  return clone.innerHTML
}

const writeClipboard = async ({ text, html }: ClipboardContent) => {
  if (html === undefined || typeof ClipboardItem === 'undefined') {
    await navigator.clipboard.writeText(text)

    return
  }

  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' }),
    }),
  ])
}

const CopyButton = ({
  content,
  label,
}: {
  content: () => ClipboardContent | null
  label: string
}) => {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') {
      return undefined
    }
    const timeout = setTimeout(() => setState('idle'), 2000)

    return () => clearTimeout(timeout)
  }, [state])

  const copy = () => {
    const current = content()
    if (!current) {
      return
    }
    writeClipboard(current).then(
      () => setState('copied'),
      () => setState('failed'),
    )
  }

  const status = state === 'copied' ? 'Skopírované' : state === 'failed' ? 'Nepodarilo sa' : label

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={label}
      title={status}
      className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-ink transition-colors hover:bg-brand focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black"
    >
      <TileIcon
        name={state === 'copied' ? 'check' : state === 'failed' ? 'x' : 'copy'}
        className="size-5"
      />
      <span aria-live="polite" className="sr-only">
        {state === 'idle' ? '' : status}
      </span>
    </button>
  )
}

// ── Looks ─────────────────────────────────────────────────────────────────────

const markStyles =
  '[&_mark]:rounded-sm [&_mark]:px-0.5 [&_mark]:text-inherit [&_mark[data-kind=event]]:bg-brand/45 [&_mark[data-kind=fill]]:bg-[#01b5e5]/25'

const box =
  'w-full rounded-xl border-2 border-black/10 bg-white px-4 py-3 text-ink transition-colors focus:border-brand-dark focus:outline-none'

const bodyStyles =
  '[&_a]:cursor-pointer [&_a]:text-[#1a73e8] [&_a]:underline [&_li]:my-0.5 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6'

const Swatch = ({ className }: { className: string }) => (
  <span className={`size-3 rounded-sm ${className}`} aria-hidden />
)

const Legend = ({ mode }: { mode: Mode }) =>
  mode === 'rendered' ? (
    <p className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
      <span className="inline-flex items-center gap-1.5">
        <Swatch className="bg-brand/45" />z podujatia
      </span>
      <span className="inline-flex items-center gap-1.5">
        <Swatch className="bg-[#01b5e5]/25" />
        doplň alebo skontroluj
      </span>
      <span>„- “ na začiatku odseku vytvorí zoznam. Zvýraznenie sa pri kopírovaní nezachová.</span>
    </p>
  ) : (
    <p className="text-sm text-muted">
      <code>**tučné**</code>, <code>*kurzíva*</code>, <code>- zoznam</code>,{' '}
      <code>[text](https://…)</code>, <code>{'{{z podujatia}}'}</code>, <code>[[doplniť]]</code>.
      Prázdny riadok oddeľuje odseky.
    </p>
  )

const ModeSwitch = ({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) => (
  <div className="flex rounded-xl border-2 border-black/10 bg-white p-0.5" role="group">
    {(
      [
        ['rendered', 'Formátovaný'],
        ['raw', 'Markdown'],
      ] as const
    ).map(([value, label]) => (
      <button
        key={value}
        type="button"
        aria-pressed={mode === value}
        onClick={() => onChange(value)}
        className="cursor-pointer rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-black/5 aria-pressed:bg-brand"
      >
        {label}
      </button>
    ))}
  </div>
)

/** Links in an editable text don't open by themselves – a click on one opens it in a new tab */
const openClickedLink = (event: MouseEvent<HTMLDivElement>) => {
  const link = event.target instanceof Element ? event.target.closest('a') : null
  if (link && event.currentTarget.contains(link) && /^https?:\/\//i.test(link.href)) {
    event.preventDefault()
    window.open(link.href, '_blank', 'noopener,noreferrer')
  }
}

/** A one-line subject: Enter would only add a line break the email's subject can't hold */
const keepOnOneLine = (event: KeyboardEvent<HTMLDivElement>) => {
  if (event.key === 'Enter') {
    event.preventDefault()
  }
}

// ── The editor ────────────────────────────────────────────────────────────────

const GuestEmailEditor = ({ events, initial }: Props & { initial: EventOption }) => {
  const [slug, setSlug] = useState(initial.slug)
  const [mode, setMode] = useState<Mode>('rendered')
  // The text as Markdown – current in the raw view; the formatted view keeps its edits in the DOM
  // and hands them back here when switching
  const [subject, setSubject] = useState(() => buildSubject(initial))
  const [body, setBody] = useState(() => buildBodyMarkdown(initial))
  // A new version remounts the formatted editors from the Markdown
  const [version, setVersion] = useState(0)
  const [isEdited, setIsEdited] = useState(false)
  const subjectRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)

  const loadEvent = (event: EventOption) => {
    if (isEdited && !window.confirm('Upravený text sa prepíše novým. Pokračovať?')) {
      return
    }
    setSlug(event.slug)
    setSubject(buildSubject(event))
    setBody(buildBodyMarkdown(event))
    setVersion((current) => current + 1)
    setIsEdited(false)
  }

  const switchMode = (next: Mode) => {
    if (next === mode) {
      return
    }
    if (next === 'raw' && subjectRef.current && bodyRef.current) {
      setSubject(lineEditorToSource(subjectRef.current))
      setBody(editorToMarkdown(bodyRef.current))
    } else {
      setVersion((current) => current + 1)
    }
    setMode(next)
  }

  const onBodyInput = (event: SyntheticEvent<HTMLDivElement, InputEvent>) => {
    setIsEdited(true)
    const input = event.nativeEvent
    if (input.inputType === 'insertText' && input.data === ' ' && bodyRef.current) {
      applyListShortcut(bodyRef.current)
    }
  }

  const subjectContent = (): ClipboardContent | null => {
    if (mode === 'raw') {
      return { text: lineToPlainText(subject) }
    }

    return subjectRef.current ? { text: subjectRef.current.innerText.trim() } : null
  }

  const bodyContent = (): ClipboardContent | null => {
    if (mode === 'raw') {
      return { text: markdownToPlainText(body), html: markdownToHtml(body, { marks: false }) }
    }

    return bodyRef.current
      ? { text: bodyRef.current.innerText.trim(), html: htmlWithoutMarks(bodyRef.current) }
      : null
  }

  const upcoming = events.filter((option) => !option.isPast)
  // Most recent past events first – those are the likely ones to still write about
  const past = events.filter((option) => option.isPast).reverse()
  const optionLabel = (option: EventOption) =>
    `${dateLabel.format(new Date(option.start))} – ${option.title}`

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <select
          aria-label="Podujatie"
          value={slug}
          onChange={(change) => {
            const event = events.find((option) => option.slug === change.target.value)
            if (event) {
              loadEvent(event)
            }
          }}
          className="min-h-10 min-w-0 flex-1 basis-64 cursor-pointer rounded-xl border-2 border-black/15 bg-white px-3 text-sm font-semibold text-ink transition-colors focus:border-brand-dark focus:outline-none"
        >
          {upcoming.length > 0 ? (
            <optgroup label="Nadchádzajúce">
              {upcoming.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {optionLabel(option)}
                </option>
              ))}
            </optgroup>
          ) : null}
          {past.length > 0 ? (
            <optgroup label="Minulé">
              {past.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {optionLabel(option)}
                </option>
              ))}
            </optgroup>
          ) : null}
        </select>
        <ModeSwitch mode={mode} onChange={switchMode} />
        <button
          type="button"
          onClick={() => {
            const event = events.find((option) => option.slug === slug)
            if (event) {
              loadEvent(event)
            }
          }}
          disabled={!isEdited}
          title="Vrátiť pôvodný text"
          className="inline-flex min-h-10 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors hover:bg-black/5 disabled:cursor-default disabled:opacity-40 disabled:hover:bg-transparent"
        >
          <TileIcon name="rotate-ccw" className="size-4" />
          Obnoviť
        </button>
      </div>

      <Legend mode={mode} />

      <section aria-labelledby="guest-email-subject" className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 id="guest-email-subject" className="text-sm font-semibold">
            Predmet
          </h2>
          <CopyButton content={subjectContent} label="Kopírovať predmet" />
        </div>
        {mode === 'rendered' ? (
          <div
            key={`subject-${version}`}
            ref={subjectRef}
            role="textbox"
            tabIndex={0}
            aria-labelledby="guest-email-subject"
            contentEditable
            suppressContentEditableWarning
            onKeyDown={keepOnOneLine}
            onInput={() => setIsEdited(true)}
            // Built by `lineToHtml`, which escapes all of the text
            dangerouslySetInnerHTML={{ __html: lineToHtml(subject) }}
            className={`${box} ${markStyles} text-lg`}
          />
        ) : (
          <input
            aria-labelledby="guest-email-subject"
            value={subject}
            onChange={(change) => {
              setSubject(change.target.value)
              setIsEdited(true)
            }}
            className={`${box} font-mono text-sm`}
          />
        )}
      </section>

      <section aria-labelledby="guest-email-body" className="flex flex-col gap-1">
        <div className="flex items-center justify-between gap-2">
          <h2 id="guest-email-body" className="text-sm font-semibold">
            Text
          </h2>
          <CopyButton content={bodyContent} label="Kopírovať text" />
        </div>
        {mode === 'rendered' ? (
          // A textbox, typed into with the keyboard; the click only adds opening its links
          // eslint-disable-next-line jsx-a11y/click-events-have-key-events
          <div
            key={`body-${version}`}
            ref={bodyRef}
            role="textbox"
            tabIndex={0}
            aria-multiline
            aria-labelledby="guest-email-body"
            contentEditable
            suppressContentEditableWarning
            onInput={onBodyInput}
            onClick={openClickedLink}
            // Built by `markdownToHtml`, which escapes all of the text
            dangerouslySetInnerHTML={{ __html: markdownToHtml(body) }}
            className={`${box} ${markStyles} ${bodyStyles} min-h-[60dvh] text-base/7`}
          />
        ) : (
          <textarea
            aria-labelledby="guest-email-body"
            value={body}
            onChange={(change) => {
              setBody(change.target.value)
              setIsEdited(true)
            }}
            spellCheck={false}
            className={`${box} min-h-[60dvh] font-mono text-sm/6`}
          />
        )}
      </section>
    </div>
  )
}

/** Picks an event and writes the email to its guests, to edit in place and copy into Gmail */
const GuestEmailGenerator = ({ events }: Props) => {
  const initial = initialEvent(events)

  return initial ? <GuestEmailEditor events={events} initial={initial} /> : null
}

export default GuestEmailGenerator
