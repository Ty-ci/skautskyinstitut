import { cache } from 'react'

import { cell, columnFinder, normalize, serialToDate } from '@/lib/google-sheets/cells'
import { getValues, type Rows } from '@/lib/google-sheets/client'
import { HEADER_ROW, SPREADSHEET_ID, spreadsheetUrl } from '@/lib/google-sheets/spreadsheet'
import { slugify } from '@/utils/slugify'

/*
 * Events are read from a Google spreadsheet for now, instead of the Payload `events` collection.
 * Tab `events`, rows 1–2 are instructions for editors, row 3 is the header:
 *
 *   title | startDate | endDate | place | coverUrl | description | slug | facebookLink | instagramLink | calendarLink
 *
 * Only `title` and `startDate` are required. Dates are Bratislava wall-clock time, either real date
 * cells or text like `12. 11. 2026 18:00` / `2026-11-12 18:00`; a date without a time makes an
 * all-day event. Rows the site has to skip or fix up are logged as warnings (Netlify function logs).
 */

const TAB = 'events'
const RANGE = `${TAB}!A1:Z500`

/** Opens the sheet, for people who edit it – it still needs a Google account it's shared with */
export const eventsSheetUrl = spreadsheetUrl()

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
  /** Simple Markdown, see `@/utils/markdown` */
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

  // Both anchored with bounded repeats, and only ever run on a single cell
  // eslint-disable-next-line security/detect-unsafe-regex
  const slovak = /^(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})(?:,?\s*(?:o\s*)?(\d{1,2}):(\d{2}))?$/.exec(
    value,
  )
  // eslint-disable-next-line security/detect-unsafe-regex
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

/**
 * Drive share links (`/open?id=…`, `/file/d/…/view`) lead to Drive's viewer page, which can't be
 * the source of an image – so they're swapped for the image itself. The file has to be shared with
 * "anyone with the link". Any other address is kept as it is.
 */
const toImageUrl = (value: string) => {
  if (!URL.canParse(value)) {
    return value
  }

  const { hostname, pathname, searchParams } = new URL(value)
  if (hostname !== 'drive.google.com') {
    return value
  }

  const id = /\/d\/([\w-]+)/.exec(pathname)?.[1] ?? searchParams.get('id')

  // 1600 px is enough for the widest place a cover is shown, the dialog, on a high-density screen
  return id ? `https://lh3.googleusercontent.com/d/${encodeURIComponent(id)}=w1600` : value
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
    // eslint-disable-next-line security/detect-object-injection -- `column` is one of our own keys
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
    const coverUrl = url('coverUrl')

    events.push({
      slug,
      title,
      start: new Date(toInstant(start.at.getTime())).toISOString(),
      end: end ? new Date(toInstant(end.at.getTime())).toISOString() : undefined,
      hasTime: start.hasTime && (end?.hasTime ?? true),
      endsAt: new Date(toInstant(endsAt)).toISOString(),
      place: read('place') || undefined,
      coverUrl: coverUrl && toImageUrl(coverUrl),
      description: read('description') || undefined,
      facebookLink: url('facebookLink'),
      instagramLink: url('instagramLink'),
      calendarLink: url('calendarLink'),
    })
  })

  return { events, warnings }
}

/** All events in the sheet, soonest first. Deduplicated within one render via React's `cache`. */
export const getEvents = cache(async () => {
  const rows = await getValues(SPREADSHEET_ID, RANGE)
  const { events, warnings } = parseEvents(rows)
  // eslint-disable-next-line no-console -- surfaces mistakes in the sheet in the Netlify function logs
  warnings.forEach((warning) => console.warn(`[events sheet] ${warning}`))

  return events.sort((a, b) => a.start.localeCompare(b.start))
})

export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export const getEventStatus = (event: SiteEvent): EventStatus => {
  const now = new Date()
  if (new Date(event.endsAt) < now) {
    return 'past'
  }

  return new Date(event.start) <= now ? 'ongoing' : 'upcoming'
}
