import type { SiteEvent } from '@/services/events'

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

/** Google Calendar's assumed length of a timed event that has no end in the sheet */
const DEFAULT_DURATION_MS = 2 * HOUR_MS

/** `2026-11-12T17:00:00.000Z` → `20261112T170000Z` */
const toUtcStamp = (date: Date) => date.toISOString().replaceAll(/[-:]|\.\d{3}/g, '')

/** The calendar date in Bratislava, `20261205` */
const toDateStamp = (date: Date) =>
  date.toLocaleDateString('sv-SE', { timeZone: 'Europe/Bratislava' }).replaceAll('-', '')

/**
 * "Add to Google Calendar" link, for events whose `calendarLink` is empty in the sheet.
 * All-day events use date-only stamps with an exclusive end date.
 */
export const googleCalendarLink = (event: SiteEvent, eventUrl: string) => {
  const start = new Date(event.start)
  const end = event.end ? new Date(event.end) : null

  const dates = event.hasTime
    ? `${toUtcStamp(start)}/${toUtcStamp(end ?? new Date(start.getTime() + DEFAULT_DURATION_MS))}`
    : // +12 h instead of +1 day, so a DST change can't land on the wrong date
      `${toDateStamp(start)}/${toDateStamp(new Date((end ?? start).getTime() + DAY_MS + 12 * HOUR_MS))}`

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.set('action', 'TEMPLATE')
  url.searchParams.set('text', event.title)
  url.searchParams.set('dates', dates)
  url.searchParams.set('details', eventUrl)
  if (event.place) {
    url.searchParams.set('location', event.place)
  }

  return url.toString()
}
