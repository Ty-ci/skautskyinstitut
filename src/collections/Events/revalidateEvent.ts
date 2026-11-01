import { revalidatePath } from 'next/cache'
import type { CollectionAfterChangeHook, CollectionAfterDeleteHook, PayloadRequest } from 'payload'

import type { Event } from '@/payload-types'
import { eventPath } from '@/utils/paths'

const revalidate = (paths: Set<string>, req: PayloadRequest) => {
  for (const path of paths) {
    try {
      revalidatePath(path)
      req.payload.logger.info(`Revalidated ${path}`)
    } catch (error) {
      // revalidatePath throws outside of a Next.js request (e.g. `payload migrate`, scripts)
      req.payload.logger.warn({ err: error }, `Could not revalidate ${path}`)
    }
  }
}

/**
 * Revalidates the events list and the event detail whenever a change can affect the public site:
 * publishing, editing a published event, unpublishing or changing the slug.
 * Saving a draft of a never-published event does nothing.
 */
export const revalidateEventAfterChange: CollectionAfterChangeHook<Event> = ({
  doc,
  previousDoc,
  req,
  context,
}) => {
  if (context.disableRevalidate) {
    return doc
  }

  const paths = new Set<string>()

  if (doc._status === 'published' && doc.slug) {
    paths.add('/')
    paths.add(eventPath(doc.slug))
  }

  // Unpublished, or published under a different slug before. On create, previousDoc is `{}`.
  if (
    previousDoc._status === 'published' &&
    previousDoc.slug &&
    (doc._status !== 'published' || previousDoc.slug !== doc.slug)
  ) {
    paths.add('/')
    paths.add(eventPath(previousDoc.slug))
  }

  revalidate(paths, req)

  return doc
}

export const revalidateEventAfterDelete: CollectionAfterDeleteHook<Event> = ({
  doc,
  req,
  context,
}) => {
  if (context.disableRevalidate) {
    return doc
  }

  const paths = new Set(['/'])
  if (doc.slug) {
    paths.add(eventPath(doc.slug))
  }

  revalidate(paths, req)

  return doc
}
