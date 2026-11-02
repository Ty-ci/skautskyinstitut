'use client'

import { useRef, useSyncExternalStore } from 'react'

import EventCard from '@/components/EventCard'
import EventDialog from '@/components/EventDialog'
import SheetLink from '@/components/SheetLink'
import type { SiteEvent } from '@/services/events'

interface Props {
  events: SiteEvent[]
  /** Events already under way */
  ongoingSlugs: string[]
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
const EventsBoard = ({ events, ongoingSlugs, sheetUrl }: Props) => {
  const hash = useSyncExternalStore(subscribeToHash, getHash, getServerHash)
  const openEvent = events.find((event) => `#${event.slug}` === hash)
  // Opened by a click here, so there's a history entry to go back from
  const isOpenedHere = useRef(false)

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
      {events.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {events.map((event) => (
            <li key={event.slug}>
              <EventCard
                event={event}
                isOngoing={ongoingSlugs.includes(event.slug)}
                onOpen={() => {
                  isOpenedHere.current = true
                }}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-lg">Momentálne nie sú naplánované žiadne podujatia.</p>
      )}
      <SheetLink href={sheetUrl} className="self-start">
        Zdrojová tabuľka
      </SheetLink>
      <EventDialog
        event={openEvent}
        isOngoing={openEvent ? ongoingSlugs.includes(openEvent.slug) : false}
        onClose={closeEvent}
      />
    </div>
  )
}

export default EventsBoard
