import type { EventStatus, SiteEvent } from '@/services/events'
import { formatEventDate } from '@/utils/formatEventDate'

interface Props {
  event: SiteEvent
  status: EventStatus
}

const badgeClassName = 'rounded-l-md rounded-r-full px-2.5 py-0.5 text-xs font-semibold'

/** The event's date, and whether it's under way or over */
const EventBadges = ({ event, status }: Props) => (
  <div className="flex flex-wrap items-center gap-1.5">
    <p className={`${badgeClassName} ${status === 'past' ? 'bg-surface' : 'bg-brand'}`}>
      {formatEventDate(event.start, event.end, event.hasTime)}
    </p>
    {status === 'ongoing' ? (
      <p className={`${badgeClassName} bg-ink text-white`}>Práve prebieha</p>
    ) : null}
  </div>
)

export default EventBadges
