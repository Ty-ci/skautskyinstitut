/*
 * Server-side access to Google Sheets (ported from the nslsk project). Never import it into a
 * client component: the service-account key must not reach the browser.
 *
 * Credentials come from GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY; the spreadsheet has to
 * be shared with that service account – as Editor, since the dashboard writes into it.
 *
 * The service-account handshake is done by hand rather than through `google-auth-library`: one
 * signed JWT and one token request is all a Sheets call needs.
 */
import { createSign } from 'node:crypto'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SHEETS_API = 'https://sheets.googleapis.com/v4/spreadsheets'
// Reads ask for the read-only scope, so a leaked read token can't change anything
const READ_SCOPE = 'https://www.googleapis.com/auth/spreadsheets.readonly'
const WRITE_SCOPE = 'https://www.googleapis.com/auth/spreadsheets'

type Scope = typeof READ_SCOPE | typeof WRITE_SCOPE

export type Rows = string[][]

export type CellValue = string | number | boolean

/**
 * `.env` files sometimes wrap values in quotes and Netlify's UI stores the key with escaped
 * newlines, so the wrapping quotes have to come off before anything can parse them.
 */
const cleanEnv = (value: string | undefined) => {
  const trimmed = (value ?? '').trim()
  const first = trimmed.charAt(0)
  const isQuoted =
    trimmed.length >= 2 && (first === '"' || first === "'") && trimmed.endsWith(first)

  return isQuoted ? trimmed.slice(1, -1) : trimmed
}

const readCredentials = () => {
  const email = cleanEnv(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL)
  const key = cleanEnv(process.env.GOOGLE_PRIVATE_KEY).replaceAll('\\n', '\n')

  if (!email || !key) {
    throw new Error(
      'Missing Google credentials – set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY.',
    )
  }

  return { email, key }
}

const base64Url = (value: string) => Buffer.from(value).toString('base64url')

const cachedTokens = new Map<Scope, { value: string; expiresAt: number }>()

/**
 * An OAuth access token for the service account, via the JWT-bearer flow: sign `{header}.{claims}`
 * with the account's private key, hand the assertion to Google, get a bearer token back. Reused
 * until shortly before it expires.
 */
const getAccessToken = async (scope: Scope) => {
  const cachedToken = cachedTokens.get(scope)
  if (cachedToken && cachedToken.expiresAt > Date.now()) {
    return cachedToken.value
  }

  const { email, key } = readCredentials()
  const issuedAt = Math.floor(Date.now() / 1000)
  const payload = [
    base64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' })),
    base64Url(
      JSON.stringify({
        iss: email,
        scope,
        aud: TOKEN_URL,
        iat: issuedAt,
        exp: issuedAt + 3600,
      }),
    ),
  ].join('.')

  const signature = createSign('RSA-SHA256').update(payload).sign(key, 'base64url')

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: `${payload}.${signature}`,
    }),
  })

  if (!response.ok) {
    throw new Error(`Google refused the service-account assertion (${response.status}).`)
  }

  const data = (await response.json()) as { access_token?: string; expires_in?: number }
  if (!data.access_token) {
    throw new Error('Google returned no access token for the service account.')
  }

  // A minute of head room, so a token never expires mid-request
  cachedTokens.set(scope, {
    value: data.access_token,
    expiresAt: Date.now() + ((data.expires_in ?? 3600) - 60) * 1000,
  })

  return data.access_token
}

const callSheets = async (
  scope: Scope,
  url: URL | string,
  init: { method?: string; body?: unknown } = {},
) => {
  const accessToken = await getAccessToken(scope)
  const response = await fetch(url, {
    method: init.method,
    cache: 'no-store',
    headers: {
      authorization: `Bearer ${accessToken}`,
      ...(init.body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
  })

  if (!response.ok) {
    throw new Error(`Google Sheets API returned ${response.status}: ${await response.text()}`)
  }

  return response
}

/**
 * Reads one range of a spreadsheet, values as stored rather than as displayed – dates then arrive
 * as serial numbers (see `serialToDate` in `./cells`), the same in every locale. Empty trailing
 * cells come back as missing rather than as empty strings, so rows have to be read defensively.
 *
 * Never cached: every page reading the sheet renders per request (`dynamic = 'force-dynamic'`),
 * so an edit in the sheet shows on the next refresh.
 */
export const getValues = async (spreadsheetId: string, range: string): Promise<Rows> => {
  const url = new URL(
    `${SHEETS_API}/${encodeURIComponent(spreadsheetId)}/values/${encodeURIComponent(range)}`,
  )
  url.searchParams.set('majorDimension', 'ROWS')
  url.searchParams.set('valueRenderOption', 'UNFORMATTED_VALUE')
  url.searchParams.set('dateTimeRenderOption', 'SERIAL_NUMBER')

  const response = await callSheets(READ_SCOPE, url)

  // Raw reads return numbers and booleans too; everything leaves here a string
  const data = (await response.json()) as { values?: CellValue[][] }

  return (data.values ?? []).map((row) => row.map(String))
}

/**
 * Writes several ranges in one request. Values are stored as given (`RAW`), never parsed: text
 * typed on the website starting with `=` must not become a formula in the sheet.
 *
 * `USER_ENTERED` makes Sheets parse the values as if typed in, which is how a date becomes a real
 * date cell. Only for values the site put together itself, never for text as it was typed.
 */
export const updateValues = async (
  spreadsheetId: string,
  data: { range: string; values: CellValue[][] }[],
  valueInputOption: 'RAW' | 'USER_ENTERED' = 'RAW',
) => {
  await callSheets(
    WRITE_SCOPE,
    `${SHEETS_API}/${encodeURIComponent(spreadsheetId)}/values:batchUpdate`,
    {
      method: 'POST',
      body: { valueInputOption, data },
    },
  )
}

// Tab ids never change, so they are looked up once per server instance
const tabIds = new Map<string, number>()

/** The numeric id of a tab (the `gid` in its URL), needed to address it as a whole */
export const getTabId = async (spreadsheetId: string, title: string) => {
  const cacheKey = `${spreadsheetId}/${title}`
  const cached = tabIds.get(cacheKey)
  if (cached !== undefined) {
    return cached
  }

  const url = new URL(`${SHEETS_API}/${encodeURIComponent(spreadsheetId)}`)
  url.searchParams.set('fields', 'sheets.properties(sheetId,title)')
  const response = await callSheets(READ_SCOPE, url)
  const data = (await response.json()) as {
    sheets?: { properties: { sheetId: number; title: string } }[]
  }

  data.sheets?.forEach(({ properties }) =>
    tabIds.set(`${spreadsheetId}/${properties.title}`, properties.sheetId),
  )
  const tabId = tabIds.get(cacheKey)
  if (tabId === undefined) {
    throw new Error(`The spreadsheet has no tab "${title}".`)
  }

  return tabId
}

/** Removes one row of a tab, shifting the rows below it up. `row` is 1-based, as in the sheet. */
export const deleteRow = async (spreadsheetId: string, tabTitle: string, row: number) => {
  const sheetId = await getTabId(spreadsheetId, tabTitle)

  await callSheets(WRITE_SCOPE, `${SHEETS_API}/${encodeURIComponent(spreadsheetId)}:batchUpdate`, {
    method: 'POST',
    body: {
      requests: [
        {
          deleteDimension: {
            range: { sheetId, dimension: 'ROWS', startIndex: row - 1, endIndex: row },
          },
        },
      ],
    },
  })
}
