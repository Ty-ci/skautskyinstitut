import { cache } from 'react'

import { cell, columnFinder, normalize, readDate, readUrl } from '@/lib/google-sheets/cells'
import { getValues, type Rows } from '@/lib/google-sheets/client'
import { HEADER_ROW, SPREADSHEET_ID, spreadsheetUrl } from '@/lib/google-sheets/spreadsheet'
import type { EventFields } from '@/utils/eventRecord'
import { slugify } from '@/utils/slugify'

/*
 * Events are read from a Google spreadsheet for now, instead of the Payload `events` collection.
 * Tab `events`, rows 1–2 are instructions for editors, row 3 is the header:
 *
 *   title | description | startDate | endDate | place | coverUrl | facebookLink | instagramLink | calendarLink | slug
 *
 * followed by the internal columns, which never reach the public pages (`SiteEvent` doesn't have
 * them, see `@/services/eventRecords` for who reads them):
 *
 *   folder | garant1 | garant2 | attendance | tím
 *
 * Only `title` and `startDate` are required. Dates are Bratislava wall-clock time, either real date
 * cells or text like `12. 11. 2026 18:00` / `2026-11-12 18:00`; a date without a time makes an
 * all-day event. Rows the site has to skip or fix up are logged as warnings (Netlify function logs).
 */

export const EVENTS_TAB = 'events'
const RANGE = `${EVENTS_TAB}!A1:Z500`

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
export const locateColumns = (headerRow: string[]): Record<keyof EventFields, number> => {
  const find = columnFinder(headerRow)
  const named = (name: string, fallbackIndex: number) =>
    find((header) => header === normalize(name), fallbackIndex)

  return {
    title: named('title', 0),
    description: named('description', 1),
    startDate: named('startDate', 2),
    endDate: named('endDate', 3),
    place: named('place', 4),
    coverUrl: named('coverUrl', 5),
    facebookLink: named('facebookLink', 6),
    instagramLink: named('instagramLink', 7),
    calendarLink: named('calendarLink', 8),
    slug: named('slug', 9),
    folderLink: find((header) => header === 'folder' || header === 'folderlink', 10),
    garant1: named('garant1', 11),
    garant2: named('garant2', 12),
    attendance: named('attendance', 13),
    team: find((header) => header === 'tim' || header === 'team', 14),
  }
}

// ── Rows → events ─────────────────────────────────────────────────────────────

export interface ParsedEvent {
  /** The event's row in the sheet, 1-based */
  row: number
  /** Year of the start, in Bratislava */
  year: number
  event: SiteEvent
}

const parseEvents = (rows: Rows) => {
  const headerRow = rows.at(HEADER_ROW - 1)
  if (!headerRow) {
    return { parsed: [], warnings: [`Row ${HEADER_ROW} (header) is empty.`] }
  }

  const columns = locateColumns(headerRow)
  const warnings: string[] = []
  const slugs = new Set<string>()
  const parsed: ParsedEvent[] = []

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

    parsed.push({
      row: rowNumber,
      year: start.at.getUTCFullYear(),
      event: {
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
      },
    })
  })

  return { parsed, warnings }
}

/** The tab as it is now, and the events in it – for the public listing and the internal overview */
export const readEventsSheet = async () => {
  const rows = await getValues(SPREADSHEET_ID, RANGE)
  const { parsed, warnings } = parseEvents(rows)
  // eslint-disable-next-line no-console -- surfaces mistakes in the sheet in the Netlify function logs
  warnings.forEach((warning) => console.warn(`[events sheet] ${warning}`))

  return { rows, parsed, columns: locateColumns(rows.at(HEADER_ROW - 1) ?? []) }
}

/**
 * All events in the sheet, soonest first, with only their public data: these reach the browser on
 * the public pages. Deduplicated within one render via React's `cache`.
 */
export const getEvents = cache(async () => {
  const { parsed } = await readEventsSheet()

  return parsed.map(({ event }) => event).sort((a, b) => a.start.localeCompare(b.start))
})

export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export const getEventStatus = (event: SiteEvent): EventStatus => {
  const now = new Date()
  if (new Date(event.endsAt) < now) {
    return 'past'
  }

  return new Date(event.start) <= now ? 'ongoing' : 'upcoming'
}
