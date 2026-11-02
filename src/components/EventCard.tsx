import Image from 'next/image'

import EventBadges from '@/components/EventBadges'
import type { SiteEvent } from '@/services/events'

interface Props {
  event: SiteEvent
  isOngoing: boolean
  /** Called on click, just before the link sets the hash that opens the event's dialog */
  onOpen: () => void
}

/** Event as a tile of the homepage grid – the whole tile opens the event's dialog */
const EventCard = ({ event, isOngoing, onOpen }: Props) => (
  <a
    href={`#${event.slug}`}
    onClick={onOpen}
    className="group flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-[0_12px_18px_-6px_rgba(0,0,0,0.3)] transition-transform hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-brand-dark"
  >
    {event.coverUrl ? (
      <div className="relative aspect-video shrink-0">
        {/* Covers can live on any host (Facebook, Drive, …), so they skip the image optimizer */}
        <Image src={event.coverUrl} alt="" fill unoptimized className="object-cover" />
      </div>
    ) : null}
    <div className="flex grow flex-col items-start gap-2 p-4">
      <EventBadges event={event} isOngoing={isOngoing} />
      <div className="flex flex-col gap-0.5">
        <h3 className="text-xl/tight transition-colors group-hover:text-brand-dark">
          {event.title}
        </h3>
        {event.place ? <p className="text-sm text-muted">{event.place}</p> : null}
      </div>
      {event.description ? (
        <p className="line-clamp-3 text-sm text-muted">
          {event.description.replaceAll(/\s+/g, ' ')}
        </p>
      ) : null}
    </div>
  </a>
)

export default EventCard
