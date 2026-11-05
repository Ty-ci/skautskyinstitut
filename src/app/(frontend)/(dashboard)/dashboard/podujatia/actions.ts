'use server'

import { refresh } from 'next/cache'

import { getAccessLevel } from '@/lib/access/session'
import { addEventRecord, removeEventRecord, updateEventRecord } from '@/services/eventRecords'
import type { ActionResult } from '@/utils/dashboardTile'
import {
  eventFieldNames,
  type EventFields,
  type EventRecord,
  parseEventFields,
} from '@/utils/eventRecord'

/*
 * Server actions are public POST endpoints: the page only hides the buttons, these are what guard
 * the sheet, so each one checks access again and trusts nothing that arrives from the browser.
 * `refresh()` re-renders the page in the same response.
 */

const editDenied = {
  ok: false,
  error: 'Heslo na úpravy už neplatí – obnov stránku a zadaj ho znova.',
} as const

const invalidEvent = { ok: false, error: 'Neplatné podujatie.' } as const

const failed = (error: unknown): ActionResult => {
  // eslint-disable-next-line no-console
  console.error('Failed to write the events sheet:', error)

  return { ok: false, error: 'Zmenu sa nepodarilo uložiť. Skús to znova.' }
}

/** A sheet cell holds at most this many characters */
const MAX_CELL_LENGTH = 50_000

/**
 * An event the browser was shown, as the sheet held it. Only its shape is checked, not the rules
 * for new values: it is compared with the sheet as is (see `findUnchanged`), never written.
 */
const parseOriginal = (input: unknown): Pick<EventRecord, 'row' | 'fields'> | null => {
  if (typeof input !== 'object' || input === null) {
    return null
  }

  const { row, fields } = input as { row?: unknown; fields?: unknown }
  if (typeof row !== 'number' || !Number.isInteger(row) || row <= 0 || row > 500) {
    return null
  }
  if (typeof fields !== 'object' || fields === null) {
    return null
  }

  const cells = fields as Record<string, unknown>
  const isValid = eventFieldNames.every((name) => {
    // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
    const value = cells[name]

    return typeof value === 'string' && value.length <= MAX_CELL_LENGTH
  })

  return isValid ? { row, fields: cells as EventFields } : null
}

const canEdit = async () => (await getAccessLevel()) === 'edit'

export const saveEvent = async (original: unknown, fields: unknown): Promise<ActionResult> => {
  const event = parseOriginal(original)
  const parsed = parseEventFields(fields)
  if (!event) {
    return invalidEvent
  }
  if (!parsed.ok) {
    return parsed
  }
  if (!(await canEdit())) {
    return editDenied
  }

  try {
    const result = await updateEventRecord(event, parsed.fields)
    refresh()

    return result
  } catch (error) {
    return failed(error)
  }
}

export const createEvent = async (fields: unknown): Promise<ActionResult> => {
  const parsed = parseEventFields(fields)
  if (!parsed.ok) {
    return parsed
  }
  if (!(await canEdit())) {
    return editDenied
  }

  try {
    const result = await addEventRecord(parsed.fields)
    refresh()

    return result
  } catch (error) {
    return failed(error)
  }
}

export const deleteEvent = async (original: unknown): Promise<ActionResult> => {
  const event = parseOriginal(original)
  if (!event) {
    return invalidEvent
  }
  if (!(await canEdit())) {
    return editDenied
  }

  try {
    const result = await removeEventRecord(event)
    refresh()

    return result
  } catch (error) {
    return failed(error)
  }
}
