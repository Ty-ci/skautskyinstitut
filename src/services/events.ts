import config from '@payload-config'
import { getPayload } from 'payload'

/*
 * All queries use `overrideAccess: false` without a user, so the public access rules of the Events
 * collection apply (published only). The explicit `_status` filter is a second safety net.
 */

/** Events that haven't ended yet (or started in the future), soonest first */
export const getUpcomingEvents = async () => {
  const payload = await getPayload({ config })
  const now = new Date().toISOString()

  const { docs } = await payload.find({
    collection: 'events',
    where: {
      and: [
        { _status: { equals: 'published' } },
        { or: [{ start: { greater_than_equal: now } }, { end: { greater_than_equal: now } }] },
      ],
    },
    sort: 'start',
    limit: 100,
    depth: 1,
    overrideAccess: false,
  })

  return docs
}

export const getEventBySlug = async (slug: string) => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'events',
    where: { and: [{ _status: { equals: 'published' } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 1,
    overrideAccess: false,
  })

  return docs.at(0) ?? null
}

export const getAllEventSlugs = async () => {
  const payload = await getPayload({ config })

  const { docs } = await payload.find({
    collection: 'events',
    where: { _status: { equals: 'published' } },
    select: { slug: true },
    pagination: false,
    overrideAccess: false,
  })

  return docs.map((doc) => doc.slug).filter((slug): slug is string => Boolean(slug))
}
