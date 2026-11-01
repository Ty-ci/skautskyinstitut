import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { getAllEventSlugs, getEventBySlug } from '@/services/events'
import { formatEventDate } from '@/utils/formatEventDate'

interface Props {
  params: Promise<{ slug: string }>
}

// Pre-render published events at build time; new ones are rendered on first request and cached
export const generateStaticParams = async () => {
  const slugs = await getAllEventSlugs()

  return slugs.map((slug) => ({ slug }))
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  return event ? { title: `${event.title} – Skautský inštitút` } : {}
}

const EventPage = async ({ params }: Props) => {
  const { slug } = await params
  const event = await getEventBySlug(slug)

  if (!event) {
    notFound()
  }

  const cover = typeof event.cover === 'object' ? event.cover : null

  return (
    <article className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <Link href="/" className="text-gray-700 hover:underline">
        ← Všetky podujatia
      </Link>
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold">{event.title}</h1>
        <p className="text-lg text-gray-700">{formatEventDate(event.start, event.end)}</p>
        {event.place ? <p className="text-lg text-gray-700">{event.place}</p> : null}
      </header>
      {cover?.url ? (
        <Image
          src={cover.url}
          alt={cover.alt}
          width={cover.width ?? 1200}
          height={cover.height ?? 675}
          className="w-full rounded-lg"
          sizes="(min-width: 896px) 56rem, 100vw"
          priority
        />
      ) : null}
      {event.description ? <RichText data={event.description} className="rich-text" /> : null}
    </article>
  )
}

export default EventPage
