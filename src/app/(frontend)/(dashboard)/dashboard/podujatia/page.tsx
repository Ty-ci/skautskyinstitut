import type { Metadata } from 'next'

import DashboardLocked, {
  DashboardBackLink,
  DashboardHeading,
} from '@/components/dashboard/DashboardLocked'
import EventsOverview from '@/components/dashboard/events/EventsOverview'
import { getAccessLevel } from '@/lib/access/session'
import { getEventRecords } from '@/services/eventRecords'

export const metadata: Metadata = {
  title: 'Prehľad podujatí | Skautský inštitút',
  robots: { index: false, follow: false },
}

// Read from the spreadsheet on every request (the access cookie would force it anyway)
export const dynamic = 'force-dynamic'

/*
 * A tool of the internal dashboard: all events from the events sheet, with the internal columns
 * the public events page doesn't show. Behind the `admin-view` password; `admin-edit` allows
 * changing them from here. The internal data never reaches a browser without the password.
 */

const TITLE = 'Prehľad podujatí'

const EventsOverviewPage = async () => {
  const access = await getAccessLevel()

  if (access === 'none') {
    return <DashboardLocked title={TITLE} />
  }

  const overview = await getEventRecords().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Failed to read the events sheet:', error)

    return null
  })

  return (
    <>
      <DashboardHeading title={TITLE} />
      <section className="grow bg-surface px-4 py-8 max-[767px]:pt-10">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
          <DashboardBackLink />
          {overview ? (
            <EventsOverview
              records={overview.records}
              sheetUrl={overview.sheetUrl}
              access={access}
            />
          ) : (
            <p role="alert" className="rounded-2xl bg-white p-5 text-center">
              Podujatia sa teraz nepodarilo načítať z tabuľky. Skús obnoviť stránku o chvíľu.
            </p>
          )}
        </div>
      </section>
    </>
  )
}

export default EventsOverviewPage
