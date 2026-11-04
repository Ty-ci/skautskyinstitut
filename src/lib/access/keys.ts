/*
 * Passwords guarding the internal pages, from the `keys` tab of the spreadsheet (rows 1–2 are
 * instructions, the header `Key | Value | Note` is row 3). Server-side only: the passwords never
 * leave the server, the browser only ever learns yes/no.
 */
import { cell, columnFinder } from '@/lib/google-sheets/cells'
import { getValues } from '@/lib/google-sheets/client'
import { HEADER_ROW, SPREADSHEET_ID } from '@/lib/google-sheets/spreadsheet'

/**
 * - `admin-view` opens the dashboard,
 * - `admin-edit` allows changing it as well (and opens it, too).
 */
export const accessKeys = ['admin-view', 'admin-edit'] as const

export type AccessKey = (typeof accessKeys)[number]

const RANGE = 'keys!A1:C200'

/** A password changed in the sheet takes effect within about this long */
const CACHE_TTL_MS = 60_000

let cache: { expiresAt: number; keys: Map<string, string> } | undefined

/** The password of each key. Throws when the sheet can't be read. */
export const loadKeys = async () => {
  if (cache && cache.expiresAt > Date.now()) {
    return cache.keys
  }

  const rows = await getValues(SPREADSHEET_ID, RANGE)
  const find = columnFinder(rows.at(HEADER_ROW - 1) ?? [])
  const keyAt = find((header) => header === 'key', 0)
  const valueAt = find((header) => header === 'value', 1)

  const keys = new Map(
    rows
      .slice(HEADER_ROW)
      .map((row) => [cell(row, keyAt), cell(row, valueAt)] as const)
      .filter(([key, value]) => key !== '' && value !== ''),
  )

  cache = { expiresAt: Date.now() + CACHE_TTL_MS, keys }

  return keys
}
