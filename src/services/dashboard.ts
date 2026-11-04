import { cell, columnFinder, columnLetter, isTruthyCell } from '@/lib/google-sheets/cells'
import { deleteRow, getTabId, getValues, type Rows, updateValues } from '@/lib/google-sheets/client'
import { HEADER_ROW, SPREADSHEET_ID, spreadsheetUrl } from '@/lib/google-sheets/spreadsheet'
import type { ActionResult, DashboardTile, TileFields } from '@/utils/dashboardTile'

/*
 * The internal dashboard's tiles: tab `dashboard`, rows 1–2 are instructions, row 3 the header:
 *
 *   Label | Link | Sekcia | Icon | Zvýraznenie dlaždice | Farba orámovania dlaždice
 *
 * Tiles are shown grouped by section, in sheet order. Read fresh on every request – the page is
 * behind a password anyway, and edits made on the site have to show at once.
 */

const TAB = 'dashboard'
const RANGE = `${TAB}!A1:Z500`

type Columns = Record<keyof TileFields, number>

/** Where each column sits, by header – with today's positions as fallbacks */
const locateColumns = (headerRow: string[]): Columns => {
  const find = columnFinder(headerRow)

  return {
    label: find((header) => header === 'label' || header === 'nazov', 0),
    link: find((header) => header === 'link' || header === 'odkaz', 1),
    section: find((header) => header.startsWith('sekcia') || header === 'section', 2),
    icon: find((header) => header.startsWith('icon') || header.startsWith('ikon'), 3),
    isFeatured: find((header) => header.startsWith('zvyraznenie'), 4),
    color: find((header) => header.startsWith('farba'), 5),
  }
}

/** A row as a tile; `null` for a row without a label (empty, or a note) */
const readTile = (row: string[] | undefined, rowNumber: number, columns: Columns) => {
  const label = cell(row, columns.label)
  if (!label) {
    return null
  }

  const tile: DashboardTile = {
    row: rowNumber,
    label,
    link: cell(row, columns.link),
    section: cell(row, columns.section) || 'Ostatné',
    icon: cell(row, columns.icon),
    isFeatured: isTruthyCell(cell(row, columns.isFeatured)),
    color: cell(row, columns.color),
  }

  return tile
}

const readSheet = async () => {
  const rows: Rows = await getValues(SPREADSHEET_ID, RANGE)
  const columns = locateColumns(rows.at(HEADER_ROW - 1) ?? [])

  return { rows, columns }
}

export const getDashboard = async () => {
  const [{ rows, columns }, tabId] = await Promise.all([
    readSheet(),
    getTabId(SPREADSHEET_ID, TAB).catch(() => undefined),
  ])

  const tiles = rows
    .map((row, index) => (index < HEADER_ROW ? null : readTile(row, index + 1, columns)))
    .filter((tile) => tile !== null)

  return { tiles, sheetUrl: spreadsheetUrl(tabId) }
}

// ── Changes ───────────────────────────────────────────────────────────────────

const writeFields = async (row: number, columns: Columns, fields: TileFields) =>
  updateValues(
    SPREADSHEET_ID,
    (Object.keys(columns) as (keyof TileFields)[]).map((name) => ({
      // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
      range: `${TAB}!${columnLetter(columns[name])}${row}`,
      // eslint-disable-next-line security/detect-object-injection
      values: [[fields[name]]],
    })),
  )

const isSameTile = (a: DashboardTile, b: DashboardTile) =>
  a.row === b.row &&
  a.label === b.label &&
  a.link === b.link &&
  a.section === b.section &&
  a.icon === b.icon &&
  a.isFeatured === b.isFeatured &&
  a.color === b.color

const changedMeanwhile = {
  ok: false,
  error: 'Tabuľka sa medzitým zmenila (možno ju niekto upravuje). Obnov stránku a skús to znova.',
} as const

/**
 * The sheet is read again right before any change, and the row has to still hold the tile the
 * browser was shown: someone sorting, inserting or editing rows in the sheet meanwhile must not
 * make a change land on the wrong tile.
 */
const findUnchanged = async (original: DashboardTile) => {
  const { rows, columns } = await readSheet()
  const current =
    original.row > HEADER_ROW ? readTile(rows.at(original.row - 1), original.row, columns) : null

  return current && isSameTile(current, original) ? columns : null
}

export const updateTile = async (
  original: DashboardTile,
  fields: TileFields,
): Promise<ActionResult> => {
  const columns = await findUnchanged(original)
  if (!columns) {
    return changedMeanwhile
  }

  await writeFields(original.row, columns, fields)

  return { ok: true }
}

export const removeTile = async (original: DashboardTile): Promise<ActionResult> => {
  if (!(await findUnchanged(original))) {
    return changedMeanwhile
  }

  await deleteRow(SPREADSHEET_ID, TAB, original.row)

  return { ok: true }
}

/** Adds a tile on a new row below the last one */
export const addTile = async (fields: TileFields): Promise<ActionResult> => {
  const { rows, columns } = await readSheet()
  // The API leaves out trailing empty rows, so the next row is free
  const row = Math.max(rows.length, HEADER_ROW) + 1

  await writeFields(row, columns, fields)

  return { ok: true }
}
