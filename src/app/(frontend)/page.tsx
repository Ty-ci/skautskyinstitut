import ContactSection from '@/components/home/ContactSection'
import EventsFeedSection from '@/components/home/EventsFeedSection'
import HeroSection from '@/components/home/HeroSection'
import LocationsSection from '@/components/home/LocationsSection'
import { mockEvents } from '@/mocks/events'

// Content edits revalidate this page on demand. The hourly revalidation only drops events that
// have ended in the meantime.
export const revalidate = 3600

const HomePage = () => {
  // TODO: Temporary mock data – switch back to `await getUpcomingEvents()` from '@/services/events'
  const events = mockEvents

  return (
    <>
      <HeroSection />
      <EventsFeedSection events={events} />
      <LocationsSection />
      <ContactSection />
    </>
  )
}

export default HomePage
