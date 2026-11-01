import Image from 'next/image'
import Link from 'next/link'

import type { Event } from '@/payload-types'
import { siLogoUrl } from '@/utils/externalLinks'
import { formatEventDate } from '@/utils/formatEventDate'
import { eventPath } from '@/utils/paths'
import { richTextToPlainText } from '@/utils/richTextToPlainText'

interface Props {
  event: Event
}

/** Event rendered as a post in the homepage feed */
const EventCard = ({ event }: Props) => {
  const cover = typeof event.cover === 'object' ? event.cover : null
  const href = eventPath(event.slug ?? '')
  const excerpt = event.description ? richTextToPlainText(event.description) : null

  return (
    <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
      <header className="flex items-center gap-3 px-4 py-3 sm:px-6">
        <Image src={siLogoUrl} alt="" width={40} height={40} className="size-10 rounded-full" />
        <div className="flex min-w-0 flex-col">
          <p className="leading-tight font-semibold">Skautský inštitút</p>
          {event.place ? <p className="truncate text-sm text-muted">{event.place}</p> : null}
        </div>
      </header>
      {cover?.url ? (
        <Link href={href} tabIndex={-1} aria-hidden>
          <Image
            src={cover.url}
            alt={cover.alt}
            width={cover.width ?? 1200}
            height={cover.height ?? 675}
            className="aspect-video w-full object-cover"
            sizes="(min-width: 672px) 42rem, 100vw"
          />
        </Link>
      ) : null}
      <div className="flex flex-col items-start gap-3 px-4 py-5 sm:px-6">
        <p className="rounded-full bg-brand px-3 py-1 text-sm font-semibold">
          {formatEventDate(event.start, event.end)}
        </p>
        <h3 className="text-2xl">
          <Link href={href} className="hover:text-brand-dark">
            {event.title}
          </Link>
        </h3>
        {excerpt ? <p className="line-clamp-3 text-muted">{excerpt}</p> : null}
        <Link href={href} className="font-bold text-brand-dark hover:underline">
          Viac o podujatí →
        </Link>
      </div>
    </article>
  )
}

export default EventCard
