import Image from 'next/image'

import EventBadges from '@/components/EventBadges'
import type { EventStatus, SiteEvent } from '@/services/events'
import { markdownToPlainText } from '@/utils/markdown'

interface Props {
  event: SiteEvent
  status: EventStatus
  /** Called on click, just before the link sets the hash that opens the event's dialog */
  onOpen: () => void
}

/** Event as a tile of the homepage grid – the whole tile opens the event's dialog */
const EventCard = ({ event, status, onOpen }: Props) => (
  <a
    href={`#${event.slug}`}
    onClick={onOpen}
    className={`group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_18px_-6px_rgba(0,0,0,0.2)] transition-all focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black ${status === 'past' ? 'not-hover:opacity-60' : ''}`}
  >
    {event.coverUrl ? (
      <div className="relative aspect-video shrink-0">
        {/* Covers can live on any host (Facebook, Drive, …), so they skip the image optimizer */}
        <Image
          src={event.coverUrl}
          alt=""
          fill
          unoptimized
          className={`object-cover ${status === 'past' ? 'not-group-hover:grayscale' : ''}`}
        />
      </div>
    ) : null}
    <div className="flex grow flex-col items-start gap-2 p-4">
      <EventBadges event={event} status={status} />
      <div className="flex h-full flex-col justify-between">
        <h3 className="text-xl/tight group-hover:underline">{event.title}</h3>

        <div className="flex flex-col gap-1">
          {event.description ? (
            <p className="line-clamp-3 text-sm whitespace-pre-line text-muted">
              {/* The card is a link as a whole, so the preview can't hold links – just the text */}
              {markdownToPlainText(event.description)}
            </p>
          ) : null}
          {event.place ? <p className="text-sm text-muted italic">{event.place}</p> : null}
        </div>
      </div>
    </div>
  </a>
)

export default EventCard
