'use server'

import { refresh } from 'next/cache'

import type { AccessKey } from '@/lib/access/keys'
import { getAccessLevel, grantAccess, revokeAccess } from '@/lib/access/session'
import { addTile, removeTile, updateTile } from '@/services/dashboard'
import { type ActionResult, type DashboardTile, parseTileFields } from '@/utils/dashboardTile'

/*
 * Server actions are public POST endpoints: the page only hides the dashboard, these are what
 * guard the sheet, so each one checks access again and trusts nothing that arrives from the browser.
 * Setting or deleting a cookie, and `refresh()`, re-render the page in the same response.
 */

/** A wrong guess costs a little time, so the password can't be hammered quickly */
const FAILURE_DELAY_MS = 800

const editDenied = {
  ok: false,
  error: 'Heslo na úpravy už neplatí – obnov stránku a zadaj ho znova.',
} as const

const failed = (error: unknown): ActionResult => {
  // eslint-disable-next-line no-console
  console.error('Failed to write the dashboard sheet:', error)

  return { ok: false, error: 'Zmenu sa nepodarilo uložiť. Skús to znova.' }
}

/** Opens the dashboard (`admin-view`) or allows changing it (`admin-edit`) in this browser */
export const unlock = async (level: unknown, password: unknown): Promise<boolean> => {
  const key: AccessKey | null =
    level === 'view' ? 'admin-view' : level === 'edit' ? 'admin-edit' : null
  // At the first prompt, the edit password works as well as the view one
  const granted =
    key !== null &&
    ((await grantAccess(key, password)) ||
      (key === 'admin-view' && (await grantAccess('admin-edit', password))))

  if (!granted) {
    await new Promise((resolve) => setTimeout(resolve, FAILURE_DELAY_MS))
  }

  return granted
}

export const signOut = async () => {
  await revokeAccess()
}

/**
 * A tile the browser was shown, as the sheet held it. Only its shape is checked, not the rules for
 * new values: it is compared with the sheet as is (see `findUnchanged`), never written.
 */
const parseOriginal = (input: unknown): DashboardTile | null => {
  if (typeof input !== 'object' || input === null) {
    return null
  }

  const { row, label, link, section, icon, isFeatured, color } = input as Record<string, unknown>
  const isText = (value: unknown): value is string =>
    typeof value === 'string' && value.length <= 2000

  return typeof row === 'number' &&
    Number.isInteger(row) &&
    row > 0 &&
    row <= 500 &&
    isText(label) &&
    isText(link) &&
    isText(section) &&
    isText(icon) &&
    isText(color) &&
    typeof isFeatured === 'boolean'
    ? { row, label, link, section, icon, isFeatured, color }
    : null
}

const canEdit = async () => (await getAccessLevel()) === 'edit'

export const saveTile = async (original: unknown, fields: unknown): Promise<ActionResult> => {
  const tile = parseOriginal(original)
  const parsed = parseTileFields(fields)
  if (!tile) {
    return { ok: false, error: 'Neplatná dlaždica.' }
  }
  if (!parsed.ok) {
    return parsed
  }
  if (!(await canEdit())) {
    return editDenied
  }

  try {
    const result = await updateTile(tile, parsed.fields)
    refresh()

    return result
  } catch (error) {
    return failed(error)
  }
}

export const createTile = async (fields: unknown): Promise<ActionResult> => {
  const parsed = parseTileFields(fields)
  if (!parsed.ok) {
    return parsed
  }
  if (!(await canEdit())) {
    return editDenied
  }

  try {
    const result = await addTile(parsed.fields)
    refresh()

    return result
  } catch (error) {
    return failed(error)
  }
}

export const deleteTile = async (original: unknown): Promise<ActionResult> => {
  const tile = parseOriginal(original)
  if (!tile) {
    return { ok: false, error: 'Neplatná dlaždica.' }
  }
  if (!(await canEdit())) {
    return editDenied
  }

  try {
    const result = await removeTile(tile)
    refresh()

    return result
  } catch (error) {
    return failed(error)
  }
}
