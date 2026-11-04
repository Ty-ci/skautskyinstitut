/*
 * The site's one spreadsheet. Each kind of content has its own tab, all laid out alike – rows 1–2
 * are instructions for editors, row 3 is the header:
 *
 *   events    – the events listing (`@/services/events`)
 *   dashboard – the tiles of the internal dashboard (`@/services/dashboard`)
 *   keys      – the dashboard's passwords (`@/lib/access/keys`)
 */

export const SPREADSHEET_ID =
  process.env.GOOGLE_SHEET_ID ||
  // The variable's name from when the sheet held events only
  process.env.GOOGLE_EVENTS_SHEET_ID ||
  '1pC5KEsjZ2GkfhFhf1DB9_nPrCVuG3YBIXb5PA5Kt5do'

/** Header row of every tab, 1-based */
export const HEADER_ROW = 3

/**
 * Opens the sheet (on the given tab, by its numeric id), for people who edit it – it still needs a
 * Google account it's shared with
 */
export const spreadsheetUrl = (tabId?: number) =>
  // eslint-disable-next-line sonarjs/no-nested-template-literals
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/edit${tabId === undefined ? '' : `#gid=${tabId}`}`
