import { cache } from 'react'

import { cell, columnFinder, normalize, serialToDate } from '@/lib/google-sheets/cells'
import { getValues, type Rows } from '@/lib/google-sheets/client'
import { slugify } from '@/utils/slugify'

/*
 * Events are read from a Google spreadsheet for now, instead of the Payload `events` collection.
 * The first tab, rows 1–2 are instructions for editors, row 3 is the header:
 *
 *   title | startDate | endDate | place | coverUrl | description | slug | facebookLink | instagramLink | calendarLink
 *
 * Only `title` and `startDate` are required. Dates are Bratislava wall-clock time, either real date
 * cells or text like `12. 11. 2026 18:00` / `2026-11-12 18:00`; a date without a time makes an
 * all-day event. Rows the site has to skip or fix up are logged as warnings (Netlify function logs).
 */

const SPREADSHEET_ID =
  process.env.GOOGLE_EVENTS_SHEET_ID || '1pC5KEsjZ2GkfhFhf1DB9_nPrCVuG3YBIXb5PA5Kt5do'
// No tab name: the first tab is read, whatever it is called
const RANGE = 'A1:Z500'
const HEADER_ROW = 3

/** Opens the sheet, for people who edit it – it still needs a Google account it's shared with */
export const eventsSheetUrl = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit`

const TIME_ZONE = 'Europe/Bratislava'
const DAY_MS = 86_400_000

export interface SiteEvent {
  slug: string
  title: string
  /** ISO instant */
  start: string
  /** ISO instant; for all-day events the start of the last day */
  end?: string
  /** False when the sheet gives dates without times – shown as an all-day event */
  hasTime: boolean
  /** ISO instant after which the event counts as past */
  endsAt: string
  place?: string
  coverUrl?: string
  /** Plain text, paragraphs separated by blank lines */
  description?: string
  facebookLink?: string
  instagramLink?: string
  calendarLink?: string
}

// ── Dates ─────────────────────────────────────────────────────────────────────

interface WallClock {
  /** Date whose UTC fields are the Bratislava wall-clock time */
  at: Date
  hasTime: boolean
}

/** Serials outside 2000–2099 are a stray number, not a date */
const isDateSerial = (serial: number) => serial >= 36_526 && serial < 73_051

const fromParts = (year: number, month: number, day: number, hour: number, minute: number) => {
  const at = new Date(Date.UTC(year, month - 1, day, hour, minute))
  // `Date.UTC` rolls 31. 2. over into March; a real date survives the round trip
  const isReal =
    at.getUTCFullYear() === year &&
    at.getUTCMonth() === month - 1 &&
    at.getUTCDate() === day &&
    hour < 24 &&
    minute < 60

  return isReal ? at : null
}

/**
 * A date cell read raw: a date the sheet recognised arrives as a serial number, one it didn't
 * (typed as text in another format) as text. `null` for an empty cell or anything else.
 */
// eslint-disable-next-line sonarjs/function-return-type -- `null` is the "no date" case, not another type
const readDate = (value: string): WallClock | null => {
  if (value === '') {
    return null
  }

  const serial = Number(value)
  if (Number.isFinite(serial)) {
    if (!isDateSerial(serial)) {
      return null
    }
    const at = serialToDate(serial)

    return { at, hasTime: at.getUTCHours() !== 0 || at.getUTCMinutes() !== 0 }
  }

  const slovak = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})(?:,?\s*(?:o\s*)?(\d{1,2}):(\d{2}))?$/.exec(
    value,
  )
  const iso = /^(\d{4})-(\d{1,2})-(\d{1,2})(?:[\sT](\d{1,2}):(\d{2}))?$/.exec(value)
  const [year, month, day, hour, minute] = slovak
    ? [slovak[3], slovak[2], slovak[1], slovak[4], slovak[5]]
    : iso
      ? [iso[1], iso[2], iso[3], iso[4], iso[5]]
      : []
  if (year === undefined) {
    return null
  }

  const hasTime = hour !== undefined
  const at = fromParts(
    Number(year),
    Number(month),
    Number(day),
    hasTime ? Number(hour) : 0,
    hasTime ? Number(minute) : 0,
  )

  return at ? { at, hasTime } : null
}

const offsetFormat = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  hourCycle: 'h23',
})

/** How far Bratislava is ahead of UTC at the given instant (1 or 2 hours, in ms) */
const bratislavaOffset = (instant: number) => {
  const parts = offsetFormat.formatToParts(new Date(instant))
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((candidate) => candidate.type === type)?.value ?? 0)
  const wallClock = Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
  )

  return wallClock - Math.floor(instant / 60_000) * 60_000
}

/** Bratislava wall-clock time (as UTC fields) → the real instant */
const toInstant = (wallClock: number) =>
  wallClock - bratislavaOffset(wallClock - bratislavaOffset(wallClock))

const startOfNextDay = (wallClock: Date) =>
  Date.UTC(wallClock.getUTCFullYear(), wallClock.getUTCMonth(), wallClock.getUTCDate()) + DAY_MS

// ── Other cells ───────────────────────────────────────────────────────────────

/** A web address, with a bare `www.…` completed; `null` for anything else */
const readUrl = (value: string) => {
  if (/^https?:\/\/\S+$/i.test(value)) {
    return value
  }

  return /^www\.\S+$/i.test(value) ? `https://${value}` : null
}

/** Where each column sits, by header – with today's positions as fallbacks */
const locateColumns = (headerRow: string[]) => {
  const find = columnFinder(headerRow)
  const named = (name: string, fallbackIndex: number) =>
    find((header) => header === normalize(name), fallbackIndex)

  return {
    title: named('title', 0),
    startDate: named('startDate', 1),
    endDate: named('endDate', 2),
    place: named('place', 3),
    coverUrl: named('coverUrl', 4),
    description: named('description', 5),
    slug: named('slug', 6),
    facebookLink: named('facebookLink', 7),
    instagramLink: named('instagramLink', 8),
    calendarLink: named('calendarLink', 9),
  }
}

// ── Rows → events ─────────────────────────────────────────────────────────────

const parseEvents = (rows: Rows) => {
  const headerRow = rows.at(HEADER_ROW - 1)
  if (!headerRow) {
    return { events: [], warnings: [`Row ${HEADER_ROW} (header) is empty.`] }
  }

  const columns = locateColumns(headerRow)
  const warnings: string[] = []
  const slugs = new Set<string>()
  const events: SiteEvent[] = []

  rows.forEach((row, index) => {
    const rowNumber = index + 1
    if (rowNumber <= HEADER_ROW || row.join('').trim() === '') {
      return
    }

    const warn = (message: string) => warnings.push(`Row ${rowNumber}: ${message}`)
    const read = (column: keyof typeof columns) => cell(row, columns[column])

    const title = read('title')
    if (!title) {
      warn('missing title, skipped.')

      return
    }

    const start = readDate(read('startDate'))
    if (!start) {
      warn(`startDate "${read('startDate')}" is not a date, skipped.`)

      return
    }

    const rawEnd = read('endDate')
    let end = readDate(rawEnd)
    if ((rawEnd && !end) || (end && end.at < start.at)) {
      warn(`endDate "${rawEnd}" is not a date after startDate, ignored.`)
      end = null
    }

    const wantedSlug = slugify(read('slug') || title) || `podujatie-${rowNumber}`
    const slug = slugs.has(wantedSlug) ? `${wantedSlug}-${rowNumber}` : wantedSlug
    if (slug !== wantedSlug) {
      warn(`slug "${wantedSlug}" is already taken, using "${slug}".`)
    }
    slugs.add(slug)

    const url = (column: keyof typeof columns) => {
      const value = read(column)
      const parsed = readUrl(value)
      if (value && !parsed) {
        warn(`${column} "${value}" is not a web address, ignored.`)
      }

      return parsed ?? undefined
    }

    // A timed event without an end stays upcoming until the end of its day
    const last = end ?? start
    const endsAt = last.hasTime && end ? last.at.getTime() : startOfNextDay(last.at)

    events.push({
      slug,
      title,
      start: new Date(toInstant(start.at.getTime())).toISOString(),
      end: end ? new Date(toInstant(end.at.getTime())).toISOString() : undefined,
      hasTime: start.hasTime && (end?.hasTime ?? true),
      endsAt: new Date(toInstant(endsAt)).toISOString(),
      place: read('place') || undefined,
      coverUrl: url('coverUrl'),
      description: read('description') || undefined,
      facebookLink: url('facebookLink'),
      instagramLink: url('instagramLink'),
      calendarLink: url('calendarLink'),
    })
  })

  return { events, warnings }
}

/** All events in the sheet, soonest first. Deduplicated within one render via React's `cache`. */
const getAllEvents = cache(async () => {
  const rows = await getValues(SPREADSHEET_ID, RANGE)
  const { events, warnings } = parseEvents(rows)
  // eslint-disable-next-line no-console -- surfaces mistakes in the sheet in the Netlify function logs
  warnings.forEach((warning) => console.warn(`[events sheet] ${warning}`))

  return events.sort((a, b) => a.start.localeCompare(b.start))
})

export const isPastEvent = (event: SiteEvent) => new Date(event.endsAt) < new Date()

/** Started already – for an upcoming event, that means under way */
export const hasEventStarted = (event: SiteEvent) => new Date(event.start) <= new Date()

/** Events that haven't ended yet, soonest first */
export const getUpcomingEvents = async () =>
  (await getAllEvents()).filter((event) => !isPastEvent(event))
