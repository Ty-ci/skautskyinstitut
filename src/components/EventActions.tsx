import type { SiteEvent } from '@/services/events'
import { googleCalendarLink } from '@/utils/googleCalendarLink'
import { eventPath } from '@/utils/paths'

interface Props {
  event: SiteEvent
}

const linkClassName =
  'inline-flex items-center rounded-2xl px-5 py-2.5 font-semibold transition-colors'

/** Calendar and social links of an (upcoming) event */
const EventActions = ({ event }: Props) => {
  const eventUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${eventPath(event.slug)}`
  const links = [
    {
      label: 'Pridať do kalendára',
      href: event.calendarLink ?? googleCalendarLink(event, eventUrl),
      primary: true,
    },
    event.facebookLink ? { label: 'Facebook', href: event.facebookLink, primary: false } : null,
    event.instagramLink ? { label: 'Instagram', href: event.instagramLink, primary: false } : null,
  ].filter((link) => link !== null)

  return (
    <ul className="flex flex-wrap gap-3">
      {links.map(({ label, href, primary }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className={`${linkClassName} ${primary ? 'bg-brand hover:bg-brand-dark' : 'bg-surface hover:bg-brand'}`}
          >
            {label} ↗
          </a>
        </li>
      ))}
    </ul>
  )
}

export default EventActions
