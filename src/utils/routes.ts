export const ROUTES = {
  events: '/podujatia',
  /** Events have no pages of their own: the hash opens the event's dialog on the events page */
  event: (slug: string) => `/podujatia#${slug}`,
}
