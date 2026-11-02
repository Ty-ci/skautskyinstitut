import EventsFeedSection from '@/components/home/EventsFeedSection'
import { getUpcomingEvents } from '@/services/events'

// Events come from a Google spreadsheet, which can't notify the site about edits, so the page is
// regenerated at most every 5 minutes. That also drops events that have ended in the meantime.
export const revalidate = 300

const HomePage = async () => {
  const events = await getUpcomingEvents()

  return <EventsFeedSection events={events} />
}

export default HomePage
