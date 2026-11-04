import EventsFeedSection from '@/components/home/EventsFeedSection'
import { getEvents } from '@/services/events'

// Events come from a Google spreadsheet, which can't notify the site about edits, so the page is
// rendered on every request: an edit in the sheet shows on the next refresh.
export const dynamic = 'force-dynamic'

const EventsPage = async () => {
  const events = await getEvents()

  return <EventsFeedSection events={events} />
}

export default EventsPage
