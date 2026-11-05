import {
  cell,
  columnLetter,
  formatWallClock,
  formatWallClockIso,
  readDate,
} from '@/lib/google-sheets/cells'
import { type CellValue, deleteRow, getTabId, updateValues } from '@/lib/google-sheets/client'
import { HEADER_ROW, SPREADSHEET_ID, spreadsheetUrl } from '@/lib/google-sheets/spreadsheet'
import { EVENTS_TAB, locateColumns, readEventsSheet } from '@/services/events'
import type { ActionResult } from '@/utils/dashboardTile'
import {
  dateFieldNames,
  emptyEventFields,
  type EventFieldName,
  eventFieldNames,
  type EventFields,
  type EventRecord,
} from '@/utils/eventRecord'

/*
 * The events tab for the internal overview: every column, including the internal ones the public
 * pages never get (see `@/services/events`). Only for pages and actions behind the `admin-view` and
 * `admin-edit` passwords. Read fresh on every request, as edits made on the site have to show at once.
 */

type Columns = ReturnType<typeof locateColumns>

const isDateField = (name: EventFieldName) =>
  (dateFieldNames as readonly EventFieldName[]).includes(name)

/** A row as text. Dates the sheet can't read as dates stay as they are, for someone to fix. */
const readFields = (row: string[] | undefined, columns: Columns) =>
  Object.fromEntries(
    eventFieldNames.map((name) => {
      // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
      const value = cell(row, columns[name])
      const date = isDateField(name) ? readDate(value) : null

      return [name, date ? formatWallClock(date) : value]
    }),
  ) as EventFields

/** All events in the sheet, the newest first */
export const getEventRecords = async () => {
  const [{ rows, parsed, columns }, tabId] = await Promise.all([
    readEventsSheet(),
    getTabId(SPREADSHEET_ID, EVENTS_TAB).catch(() => undefined),
  ])

  const records = parsed
    .map(({ row, year, event }): EventRecord => ({
      row,
      year,
      start: event.start,
      end: event.end,
      hasTime: event.hasTime,
      fields: readFields(rows.at(row - 1), columns),
    }))
    .sort((a, b) => b.start.localeCompare(a.start))

  return { records, sheetUrl: spreadsheetUrl(tabId) }
}

// ── Changes ───────────────────────────────────────────────────────────────────

/** Whole numbers stay numbers, so the sheet can still add up the attendance */
const toCellValue = (name: EventFieldName, value: string): CellValue =>
  name === 'attendance' && /^\d+$/.test(value) ? Number(value) : value

/**
 * Writes only the cells that differ: the rest keep whatever the sheet holds, down to a date's
 * format. Dates go in as if typed, to be real date cells like the others; they come out of
 * `parseEventFields` in one known format, so nothing typed on the website is ever parsed by Sheets.
 */
const writeChanges = async (
  row: number,
  columns: Columns,
  current: EventFields,
  next: EventFields,
) => {
  // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
  const changed = eventFieldNames.filter((name) => current[name] !== next[name])
  // eslint-disable-next-line security/detect-object-injection
  const rangeOf = (name: EventFieldName) => `${EVENTS_TAB}!${columnLetter(columns[name])}${row}`

  const plain = changed
    .filter((name) => !isDateField(name))
    .map((name) => ({
      range: rangeOf(name),
      // eslint-disable-next-line security/detect-object-injection
      values: [[toCellValue(name, next[name])]],
    }))
  const dates = changed
    .filter((name) => isDateField(name))
    .map((name) => {
      // eslint-disable-next-line security/detect-object-injection
      const date = readDate(next[name])

      return { range: rangeOf(name), values: [[date ? formatWallClockIso(date) : '']] }
    })

  if (plain.length > 0) {
    await updateValues(SPREADSHEET_ID, plain)
  }
  if (dates.length > 0) {
    await updateValues(SPREADSHEET_ID, dates, 'USER_ENTERED')
  }
}

const changedMeanwhile = {
  ok: false,
  error: 'Tabuľka sa medzitým zmenila (možno ju niekto upravuje). Obnov stránku a skús to znova.',
} as const

/**
 * The sheet is read again right before any change, and the row has to still hold the event the
 * browser was shown: someone sorting, inserting or editing rows in the sheet meanwhile must not
 * make a change land on the wrong event.
 */
const findUnchanged = async ({ row, fields }: Pick<EventRecord, 'row' | 'fields'>) => {
  const { rows, columns } = await readEventsSheet()
  const current = readFields(rows.at(row - 1), columns)
  // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
  const isSame = eventFieldNames.every((name) => current[name] === fields[name])

  return row > HEADER_ROW && isSame ? { columns, current } : null
}

export const updateEventRecord = async (
  original: Pick<EventRecord, 'row' | 'fields'>,
  fields: EventFields,
): Promise<ActionResult> => {
  const found = await findUnchanged(original)
  if (!found) {
    return changedMeanwhile
  }

  await writeChanges(original.row, found.columns, found.current, fields)

  return { ok: true }
}

export const removeEventRecord = async (
  original: Pick<EventRecord, 'row' | 'fields'>,
): Promise<ActionResult> => {
  if (!(await findUnchanged(original))) {
    return changedMeanwhile
  }

  await deleteRow(SPREADSHEET_ID, EVENTS_TAB, original.row)

  return { ok: true }
}

/** Adds an event on a new row below the last one */
export const addEventRecord = async (fields: EventFields): Promise<ActionResult> => {
  const { rows, columns } = await readEventsSheet()
  // The API leaves out trailing empty rows, so the next row is free
  const row = Math.max(rows.length, HEADER_ROW) + 1

  await writeChanges(row, columns, emptyEventFields, fields)

  return { ok: true }
}
