/*
 * One event as the internal overview sees it: all of its row in the `events` tab, the internal
 * columns included. Kept free of server imports: the browser's form validates with the same rules
 * the server action enforces. Never pass any of this to a public page – see `SiteEvent` for those.
 */
import { formatWallClock, readDate, readUrl } from '@/lib/google-sheets/cells'

/** In the order the columns have in the sheet */
export const eventFieldLabels = {
  title: 'Názov',
  description: 'Popis',
  startDate: 'Začiatok',
  endDate: 'Koniec',
  place: 'Miesto',
  coverUrl: 'Titulný obrázok',
  facebookLink: 'Facebook',
  instagramLink: 'Instagram',
  calendarLink: 'Kalendár',
  slug: 'Slug',
  folderLink: 'Priečinok',
  garant1: 'Garant 1',
  garant2: 'Garant 2',
  attendance: 'Účasť',
  team: 'Tím',
} as const

export type EventFieldName = keyof typeof eventFieldLabels

/** The cells of a row, as text; dates as in `12. 11. 2026 18:00` (see `formatWallClock`) */
export type EventFields = Record<EventFieldName, string>

export const eventFieldNames = Object.keys(eventFieldLabels) as EventFieldName[]

export const linkFieldNames = [
  'coverUrl',
  'facebookLink',
  'instagramLink',
  'calendarLink',
  'folderLink',
] as const satisfies EventFieldName[]

export const dateFieldNames = ['startDate', 'endDate'] as const satisfies EventFieldName[]

export interface EventRecord {
  /** The event's row in the sheet, 1-based – how the server finds it again */
  row: number
  /** ISO instant */
  start: string
  /** ISO instant */
  end?: string
  hasTime: boolean
  /** Year of the start, in Bratislava */
  year: number
  fields: EventFields
}

export const emptyEventFields = Object.fromEntries(
  eventFieldNames.map((name) => [name, '']),
) as EventFields

const MAX_LENGTH = { title: 200, description: 20_000, link: 2000, other: 500 }

const maxLengthOf = (name: EventFieldName) => {
  if (name === 'title' || name === 'description') {
    // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
    return MAX_LENGTH[name]
  }

  return (linkFieldNames as readonly EventFieldName[]).includes(name)
    ? MAX_LENGTH.link
    : MAX_LENGTH.other
}

export const DATE_FORMAT_HINT = '12. 11. 2026 alebo 12. 11. 2026 18:00'

/** The sheet's dates only count between these years, see `readDate` */
const isSupportedYear = (year: number) => year >= 2000 && year <= 2099

type ParsedEventFields = { ok: true; fields: EventFields } | { ok: false; error: string }

/** Every field as trimmed text of an allowed length, and a title among them */
const readTexts = (input: unknown): ParsedEventFields => {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Neplatné údaje.' }
  }

  const raw = input as Record<string, unknown>
  const fields = { ...emptyEventFields }
  for (const name of eventFieldNames) {
    // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
    const value = raw[name]
    if (typeof value !== 'string') {
      return { ok: false, error: 'Neplatné údaje.' }
    }
    const trimmed = value.trim()
    if (trimmed.length > maxLengthOf(name)) {
      return {
        ok: false,
        // eslint-disable-next-line security/detect-object-injection
        error: `${eventFieldLabels[name]}: najviac ${maxLengthOf(name)} znakov.`,
      }
    }
    // eslint-disable-next-line security/detect-object-injection
    fields[name] = trimmed
  }

  if (fields.title === '') {
    return { ok: false, error: 'Názov je povinný.' }
  }

  return { ok: true, fields }
}

/** The start and the optional end, checked and rewritten in one format */
const readDates = (fields: EventFields): ParsedEventFields => {
  const start = readDate(fields.startDate)
  if (!start || !isSupportedYear(start.at.getUTCFullYear())) {
    return { ok: false, error: `Začiatok je povinný, v tvare ${DATE_FORMAT_HINT}.` }
  }

  const startDate = formatWallClock(start)
  if (fields.endDate === '') {
    return { ok: true, fields: { ...fields, startDate } }
  }

  const end = readDate(fields.endDate)
  if (!end || !isSupportedYear(end.at.getUTCFullYear())) {
    return { ok: false, error: `Koniec má byť v tvare ${DATE_FORMAT_HINT}, alebo prázdny.` }
  }
  if (end.at < start.at) {
    return { ok: false, error: 'Koniec nemôže byť skôr ako začiatok.' }
  }

  return { ok: true, fields: { ...fields, startDate, endDate: formatWallClock(end) } }
}

/**
 * Checks and tidies up fields that arrived from the browser – an error message (in Slovak) or the
 * fields, with dates in one format.
 */
export const parseEventFields = (input: unknown): ParsedEventFields => {
  const texts = readTexts(input)
  if (!texts.ok) {
    return texts
  }

  const dated = readDates(texts.fields)
  if (!dated.ok) {
    return dated
  }

  const badLink = linkFieldNames.find((name) => {
    // eslint-disable-next-line security/detect-object-injection
    const value = dated.fields[name]

    return value !== '' && !readUrl(value)
  })

  return badLink
    ? {
        ok: false,
        // eslint-disable-next-line security/detect-object-injection
        error: `${eventFieldLabels[badLink]}: odkaz musí začínať na https:// (alebo ostať prázdny).`,
      }
    : dated
}
