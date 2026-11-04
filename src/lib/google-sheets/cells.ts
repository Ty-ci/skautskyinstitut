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
