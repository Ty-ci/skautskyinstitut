'use client'

import { useRef, useSyncExternalStore } from 'react'

import EventCard from '@/components/EventCard'
import EventDialog from '@/components/EventDialog'
import SheetLink from '@/components/SheetLink'
import type { EventStatus, SiteEvent } from '@/services/events'

interface Props {
  /** Soonest first */
  events: SiteEvent[]
  /** Status of each event, by slug */
  statuses: Record<string, EventStatus>
  sheetUrl: string
}

const subscribeToHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange)

  return () => window.removeEventListener('hashchange', onChange)
}

const getHash = () => window.location.hash

const getServerHash = () => ''

/**
 * The grid of event tiles, and the dialog of the one that's open. The open event is the URL hash
 * (see `eventPath`), so it can be linked to and the back button closes it.
 */
const EventsBoard = ({ events, statuses, sheetUrl }: Props) => {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash)
  const openEvent = events.find((event) => `#${event.slug}` === hash)
  // Opened by a click here, so there's a history entry to go back from
  const isOpenedHere = useRef(false)

  const statusOf = (event: SiteEvent) => statuses[event.slug] ?? 'upcoming'
  // Both lists the latest first
  const latestFirst = [...events].reverse()
  const upcomingEvents = latestFirst.filter((event) => statusOf(event) !== 'past')
  const pastEvents = latestFirst.filter((event) => statusOf(event) === 'past')

  const renderGrid = (gridEvents: SiteEvent[]) => (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {gridEvents.map((event) => (
        <li key={event.slug}>
          <EventCard
            event={event}
            status={statusOf(event)}
            onOpen={() => {
              isOpenedHere.current = true
            }}
          />
        </li>
      ))}
    </ul>
  )

  const closeEvent = () => {
    // Gone from the hash already: closed by the back button
    if (!openEvent) {
      return
    }

    if (isOpenedHere.current) {
      isOpenedHere.current = false
      window.history.back()
    } else {
      // Arrived with the hash: dropping it mustn't leave the site
      window.history.replaceState(null, '', window.location.pathname + window.location.search)
      window.dispatchEvent(new HashChangeEvent('hashchange'))
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4">
      <SheetLink href={sheetUrl} className="self-end" />
      {upcomingEvents.length > 0 ? (
        renderGrid(upcomingEvents)
      ) : (
        <p className="text-center text-lg">Momentálne nie sú naplánované žiadne podujatia.</p>
      )}
      {pastEvents.length > 0 ? (
        <section className="flex flex-col gap-6 pt-8">
          <h2 className="text-center text-3xl">Uplynulé podujatia</h2>
          {renderGrid(pastEvents)}
        </section>
      ) : null}
      <EventDialog
        event={openEvent}
        status={openEvent ? statusOf(openEvent) : 'upcoming'}
        onClose={closeEvent}
      />
    </div>
  )
}

export default EventsBoard
