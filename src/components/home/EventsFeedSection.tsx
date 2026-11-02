import EventsBoard from '@/components/home/EventsBoard'
import { eventsSheetUrl, hasEventStarted, type SiteEvent } from '@/services/events'

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
      <section className="bg-white px-4 pt-16 pb-8 text-center">
        <h1 className="heading-highlight text-5xl max-[767px]:text-4xl">Pripravované podujatia</h1>
      </section>
      <section className="grow bg-surface px-4 py-16 max-[767px]:pt-10">
        <EventsBoard
          events={events}
          // Judged here, so the browser hydrates the same labels the page was rendered with
          ongoingSlugs={events.filter(hasEventStarted).map((event) => event.slug)}
          sheetUrl={eventsSheetUrl}
        />
      </section>
    </>
  )
}

export default EventsFeedSection
