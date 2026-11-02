import EventsBoard from '@/components/home/EventsBoard'
import { eventsSheetUrl, getEventStatus, type SiteEvent } from '@/services/events'

interface Props {
  events: SiteEvent[]
}

/*
 * Styled after the sections of https://www.skautskyinstitut.sk/: a white band with the heading
 * (the header overhangs into it, see `SiteHeader`), then the cards on grey, which flows into the
 * grey footer.
 */
const EventsFeedSection = ({ events }: Props) => {
  return (
    <>
      <section className="bg-surface px-4 pt-8 pb-4 text-center lg:pt-20">
        <h1 className="heading-highlight text-5xl max-[767px]:text-4xl">Pripravujeme</h1>
      </section>
      <section className="grow bg-surface px-4 py-8 max-[767px]:pt-10">
        <EventsBoard
          events={events}
          // Judged here, so the browser hydrates the same labels the page was rendered with
          statuses={Object.fromEntries(events.map((event) => [event.slug, getEventStatus(event)]))}
          sheetUrl={eventsSheetUrl}
        />
      </section>
    </>
  )
}

export default EventsFeedSection
