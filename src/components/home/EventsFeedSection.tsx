import EventCard from '@/components/EventCard'
import type { SiteEvent } from '@/services/events'
import { externalLinks } from '@/utils/externalLinks'

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
        <div className="mx-auto flex max-w-2xl flex-col gap-8">
          {events.length > 0 ? (
            <ul className="flex flex-col gap-8">
              {events.map((event) => (
                <li key={event.slug}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-center text-lg">Momentálne nie sú naplánované žiadne podujatia.</p>
          )}
          <a
            href={externalLinks.facebookEvents}
            target="_blank"
            rel="noreferrer"
            className="self-center rounded-2xl bg-brand px-6 py-3 text-xl uppercase transition-colors hover:bg-brand-dark"
          >
            Podujatia na Facebooku ↗
          </a>
        </div>
      </section>
    </>
  )
}

export default EventsFeedSection
