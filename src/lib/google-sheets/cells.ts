/*
 * Pure helpers for reading rows out of a sheet that humans edit by hand: headers get renamed,
 * columns get inserted. Nothing here talks to Google – see `./client` for that.
 */

/** Lower-cases, drops diacritics and spaces, for matching headers ("Start Date" → "startdate") */
export const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replaceAll(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replaceAll(/[\s_-]+/g, '')

export const cell = (row: string[] | undefined, index: number) => (row?.at(index) ?? '').trim()

/**
 * Locates a column by matching its header, falling back to the position the column has today.
 * Renaming a header in the sheet shouldn't break the site, and neither should inserting a column.
 */
export const columnFinder = (headerRow: string[]) => {
  const headers = headerRow.map(normalize)

  return (matches: (header: string) => boolean, fallbackIndex: number) => {
    const found = headers.findIndex((header) => header !== '' && matches(header))

    return found === -1 ? fallbackIndex : found
  }
}

/** A checkbox or a hand-typed yes */
export const isTruthyCell = (value: string) =>
  ['1', 'true', 'ano', 'yes', 'x', '✓'].includes(normalize(value))

/** 0 → A, 25 → Z, 26 → AA */
export const columnLetter = (index: number) => {
  let letters = ''
  for (let rest = index + 1; rest > 0; rest = Math.floor((rest - 1) / 26)) {
    letters = String.fromCharCode(65 + ((rest - 1) % 26)) + letters
  }

  return letters
}

/**
 * A date cell read raw (days since 30. 12. 1899, the fraction being the time of day) → a Date whose
 * *UTC* fields are the wall-clock time the sheet shows.
 */
export const serialToDate = (serial: number) => new Date(Math.round((serial - 25_569) * 86_400_000))

export interface WallClock {
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
export const readDate = (value: string): WallClock | null => {
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

const pad = (value: number) => String(value).padStart(2, '0')

/** "12. 11. 2026 18:00", or "12. 11. 2026" without a time */
export const formatWallClock = ({ at, hasTime }: WallClock) => {
  const date = `${at.getUTCDate()}. ${at.getUTCMonth() + 1}. ${at.getUTCFullYear()}`

  return hasTime ? `${date} ${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}` : date
}

/** "2026-11-12 18:00", which Sheets takes for a date whatever the spreadsheet's locale */
export const formatWallClockIso = ({ at, hasTime }: WallClock) => {
  const date = `${at.getUTCFullYear()}-${pad(at.getUTCMonth() + 1)}-${pad(at.getUTCDate())}`

  return hasTime ? `${date} ${pad(at.getUTCHours())}:${pad(at.getUTCMinutes())}` : date
}

/** A web address, with a bare `www.…` completed; `null` for anything else */
export const readUrl = (value: string) => {
  if (/^https?:\/\/\S+$/i.test(value)) {
    return value
  }

  return /^www\.\S+$/i.test(value) ? `https://${value}` : null
}
