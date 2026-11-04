/*
 * Who may see and change the internal pages, remembered per browser.
 *
 * A correct password leaves an httpOnly cookie per key holding an HMAC of the key and the password
 * (signed with PAYLOAD_SECRET) – never the password itself, and nothing a script on the page can
 * read. Every request checks the cookie against the password currently in the `keys` tab, so
 * changing a password there signs everybody out of that key within a minute (see `loadKeys`).
 *
 * Server-side only, like everything reading the sheet.
 */
import { createHmac, timingSafeEqual } from 'node:crypto'

import { cookies } from 'next/headers'

import { type AccessKey, accessKeys, loadKeys } from '@/lib/access/keys'

export type AccessLevel = 'none' | 'view' | 'edit'

const COOKIE_MAX_AGE_S = 180 * 24 * 60 * 60

const cookieName = (key: AccessKey) => `si-access-${key}`

const sign = (key: AccessKey, password: string) => {
  const secret = process.env.PAYLOAD_SECRET
  if (!secret) {
    throw new Error('PAYLOAD_SECRET is not set, access cookies cannot be signed.')
  }

  return createHmac('sha256', secret).update(`site-access\n${key}\n${password}`).digest()
}

/** Fails closed: a key missing from the sheet, or a sheet that can't be read, means no */
const passwordOf = async (key: AccessKey) => {
  try {
    return (await loadKeys()).get(key)
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to read the keys sheet:', error)

    return undefined
  }
}

const holdsKey = async (key: AccessKey) => {
  const token = (await cookies()).get(cookieName(key))?.value
  if (!token) {
    return false
  }

  const password = await passwordOf(key)
  const presented = Buffer.from(token, 'base64url')
  const expected = password === undefined ? undefined : sign(key, password)

  return (
    expected !== undefined &&
    presented.length === expected.length &&
    timingSafeEqual(presented, expected)
  )
}

/** What this request's browser may do. The edit key implies viewing. */
export const getAccessLevel = async (): Promise<AccessLevel> => {
  if (await holdsKey('admin-edit')) {
    return 'edit'
  }

  return (await holdsKey('admin-view')) ? 'view' : 'none'
}

/**
 * Checks `password` against `key` and, when it matches, remembers it in this browser. Only for
 * server actions – cookies can't be set while rendering.
 */
export const grantAccess = async (key: AccessKey, password: unknown) => {
  if (typeof password !== 'string' || password === '' || password.length > 256) {
    return false
  }

  const expected = await passwordOf(key)
  if (expected === undefined) {
    return false
  }

  // Comparing digests makes both sides the same length, as `timingSafeEqual` needs
  const isMatch = timingSafeEqual(sign(key, password), sign(key, expected))
  if (isMatch) {
    ;(await cookies()).set(cookieName(key), sign(key, password).toString('base64url'), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: COOKIE_MAX_AGE_S,
    })
  }

  return isMatch
}

/** Forgets every key in this browser. Only for server actions. */
export const revokeAccess = async () => {
  const jar = await cookies()
  accessKeys.forEach((key) => jar.delete(cookieName(key)))
}
