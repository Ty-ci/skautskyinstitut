export const ROUTES = {
  /** Redirects to the events page for now (see `next.config.ts`) */
  home: '/',
  events: '/podujatia',
  /** Events have no pages of their own: the hash opens the event's dialog on the events page */
  event: (slug: string) => `/podujatia#${slug}`,
  dashboard: '/dashboard',
  /** The dashboard's tool writing the email to an event's guests */
  guestEmail: '/dashboard/email-hostom',
}
