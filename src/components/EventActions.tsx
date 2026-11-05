import type { SiteEvent } from '@/services/events'
import { googleCalendarLink } from '@/utils/googleCalendarLink'
import { ROUTES } from '@/utils/routes'

interface Props {
  event: SiteEvent
  /** A past event has nothing to add to a calendar */
  isPast: boolean
}

// Outlines after Feather icons, to match the dialog's close button
const iconProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
  className: 'size-5',
} as const

export const FacebookIcon = () => (
  <svg {...iconProps}>
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
)

export const InstagramIcon = () => (
  <svg {...iconProps}>
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </svg>
)

/** Calendar and social links of an event */
const EventActions = ({ event, isPast }: Props) => {
  const eventUrl = `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${ROUTES.event(event.slug)}`
  const socialLinks = [
    event.instagramLink
      ? { label: 'Instagram', href: event.instagramLink, icon: <InstagramIcon /> }
      : null,
    event.facebookLink
      ? { label: 'Facebook', href: event.facebookLink, icon: <FacebookIcon /> }
      : null,
  ].filter((link) => link !== null)
  if (isPast && socialLinks.length === 0) {
    return null
  }

  return (
    <ul className="flex flex-wrap items-center gap-3">
      {isPast ? null : (
        <li>
          <a
            href={event.calendarLink ?? googleCalendarLink(event, eventUrl)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center rounded-2xl bg-brand px-5 py-2.5 font-semibold transition-colors hover:bg-brand-dark"
          >
            Pridať do kalendára ↗
          </a>
        </li>
      )}
      {socialLinks.map(({ label, href, icon }) => (
        <li key={label}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            aria-label={label}
            title={label}
            className="flex size-11 items-center justify-center rounded-2xl bg-brand transition-colors hover:bg-brand-dark"
          >
            {icon}
          </a>
        </li>
      ))}
    </ul>
  )
}

export default EventActions
