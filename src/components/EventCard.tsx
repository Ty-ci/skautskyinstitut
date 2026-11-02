import Image from 'next/image'
import Link from 'next/link'

import type { SiteEvent } from '@/services/events'
import { siLogoUrl } from '@/utils/externalLinks'
import { formatEventDate } from '@/utils/formatEventDate'
import { eventPath } from '@/utils/paths'

interface Props {
  event: SiteEvent
}

/** Event rendered as a post in the homepage feed */
const EventCard = ({ event }: Props) => {
  const href = eventPath(event.slug)
  const excerpt = event.description?.replaceAll(/\s+/g, ' ')
  const isOngoing = new Date(event.start) <= new Date()

  return (
    <article className="overflow-hidden rounded-2xl bg-white shadow-[0_12px_18px_-6px_rgba(0,0,0,0.3)]">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Image src={siLogoUrl} alt="" width={40} height={40} className="size-10 rounded-full" />
        <div className="flex min-w-0 flex-col">
          <p className="leading-tight font-semibold">Skautský inštitút</p>
          {event.place ? <p className="truncate text-sm text-muted">{event.place}</p> : null}
        </div>
      </header>
      {event.coverUrl ? (
        <Link href={href} tabIndex={-1} aria-hidden className="relative block aspect-video">
          {/* Covers can live on any host (Facebook, Drive, …), so they skip the image optimizer */}
          <Image src={event.coverUrl} alt="" fill unoptimized className="object-cover" />
        </Link>
      ) : null}
      <div className="flex flex-col items-start gap-3 px-4 py-5 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="rounded-full bg-brand px-3 py-1 text-sm font-semibold">
            {formatEventDate(event.start, event.end, event.hasTime)}
          </p>
          {isOngoing ? (
            <p className="rounded-full bg-ink px-3 py-1 text-sm font-semibold text-white">
              Práve prebieha
            </p>
          ) : null}
        </div>
        <h3 className="text-2xl">
          <Link href={href} className="hover:text-brand-dark">
            {event.title}
          </Link>
        </h3>
        {excerpt ? <p className="line-clamp-3 text-muted">{excerpt}</p> : null}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href={href} className="font-bold text-brand-dark hover:underline">
            Viac o podujatí →
          </Link>
          {event.facebookLink ? (
            <a
              href={event.facebookLink}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-semibold text-muted hover:text-ink hover:underline"
            >
              Na Facebooku ↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}

export default EventCard
