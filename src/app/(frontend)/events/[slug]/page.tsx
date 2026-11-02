import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import EventActions from '@/components/EventActions'
import { getAllEventSlugs, getEventBySlug, isPastEvent } from '@/services/events'
import { formatEventDate } from '@/utils/formatEventDate'

interface Props {
  params: Promise<{ slug: string }>
}

// The sheet can't notify the site about edits, so pages are regenerated at most every 5 minutes
export const revalidate = 300

// Pre-render all events at build time; ones added later are rendered on first request and cached
export const generateStaticParams = async () => {
  const slugs = await getAllEventSlugs()

  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  return event
    ? {
        title: `${event.title} – Skautský inštitút`,
        description: event.description?.slice(0, 160),
        openGraph: event.coverUrl ? { images: [event.coverUrl] } : undefined,
      }
    : {}
}

const EventPage = async ({ params }: Props) => {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const isPast = isPastEvent(event)
  const paragraphs = (event.description ?? '')
    .split(/\n\s*\n/)
    // eslint-disable-next-line sonarjs/null-dereference -- false positive, `split` returns strings
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)

  return (
    <article className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-gray-700 hover:underline">
        ← Všetky podujatia
      </Link>
      {isPast ? (
        <p className="rounded-2xl bg-surface px-4 py-3 text-muted">
          Toto podujatie sa už skončilo. Pozrite si{' '}
          <Link href="/" className="font-semibold underline">
            pripravované podujatia
          </Link>
          .
        </p>
      ) : null}
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-lg text-gray-700">
          {formatEventDate(event.start, event.end, event.hasTime)}
        </p>
        {event.place ? <p className="text-lg text-gray-700">{event.place}</p> : null}
      </header>
      <EventActions event={event} isPast={isPast} />
      {event.coverUrl ? (
        // Covers can live on any host (Facebook, Drive, …), so they skip the image optimizer
        <Image
          src={event.coverUrl}
          alt=""
          width={1200}
          height={675}
          unoptimized
          priority
          className="h-auto w-full rounded-lg"
        />
      ) : null}
      {paragraphs.length > 0 ? (
        <div className="rich-text">
          {paragraphs.map((paragraph, index) => (
            // Paragraphs have no identity beyond their position
            // eslint-disable-next-line react/no-array-index-key
            <p key={index} className="whitespace-pre-line">
              {paragraph}
            </p>
          ))}
        </div>
      ) : null}
    </article>
  )
}

export default EventPage
