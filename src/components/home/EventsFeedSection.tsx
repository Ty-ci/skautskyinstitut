import EventCard from '@/components/EventCard'
import type { Event } from '@/payload-types'
import { externalLinks } from '@/utils/externalLinks'

interface Props {
  events: Event[]
}

const EventsFeedSection = ({ events }: Props) => {
  return (
    <section id="podujatia" className="scroll-mt-20 bg-surface py-12 sm:py-16">
      <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4">
        <div className="flex flex-col gap-2 text-center text-lg text-muted italic">
          <p className="text-2xl">
            SI napĺňa svoje ciele prostredníctvom <strong>pravidelných podujatí</strong>.
          </p>
          <p>Organizujeme diskusie, workshopy, výstavy, hudobné vystúpenia a iné aktivity.</p>
          <p>
            Cieľovou skupinou sú predovšetkým <strong>mladí dospelí</strong>, no naše podujatia sú
            spravidla otvorené širokej verejnosti bez rozdielu.
          </p>
        </div>
        <h2 className="text-center text-3xl sm:text-4xl">Pripravované podujatia</h2>
        {events.length > 0 ? (
          <ul className="flex flex-col gap-6">
            {events.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-center">Momentálne nie sú naplánované žiadne podujatia.</p>
        )}
        <a
          href={externalLinks.facebookEvents}
          target="_blank"
          rel="noreferrer"
          className="self-center rounded-2xl bg-brand px-6 py-3 font-display text-xl transition-colors hover:bg-brand-dark"
        >
          Podujatia na Facebooku ↗
        </a>
      </div>
    </section>
  )
}

export default EventsFeedSection
