import type { SiteEvent } from '@/services/events'
import { formatEventDate } from '@/utils/formatEventDate'

interface Props {
  event: SiteEvent
  isOngoing: boolean
}

/** The event's date, and whether it's under way */
const EventBadges = ({ event, isOngoing }: Props) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <p className="rounded-l-md rounded-r-full bg-brand px-2.5 py-0.5 text-xs font-semibold">
      {formatEventDate(event.start, event.end, event.hasTime)}
    </p>
    {isOngoing ? (
      <p className="rounded-l-md rounded-r-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-white">
        Práve prebieha
      </p>
    ) : null}
  </div>
)

export default EventBadges
