import EventsFeedSection from '@/components/home/EventsFeedSection'
import { getEvents } from '@/services/events'

// Events come from a Google spreadsheet, which can't notify the site about edits, so the page is
// regenerated at most every 5 minutes. That also moves events that have ended among the past ones.
export const revalidate = 300

const EventsPage = async () => {
  const events = await getEvents()

  return <EventsFeedSection events={events} />
}

export default EventsPage
