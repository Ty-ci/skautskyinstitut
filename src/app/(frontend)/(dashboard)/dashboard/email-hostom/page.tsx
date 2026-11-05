import type { Metadata } from 'next'
import Link from 'next/link'

import DashboardLocked, { DashboardHeading } from '@/components/dashboard/DashboardLocked'
import GuestEmailGenerator from '@/components/dashboard/guest-email/GuestEmailGenerator'
import { getAccessLevel } from '@/lib/access/session'
import { getEvents, getEventStatus } from '@/services/events'
import type { GuestEmailEvent } from '@/utils/guestEmail'
import { ROUTES } from '@/utils/routes'

export const metadata: Metadata = {
  title: 'E-mail hosťom | Skautský inštitút',
  robots: { index: false, follow: false },
}

// Read from the spreadsheet on every request (the access cookie would force it anyway)
export const dynamic = 'force-dynamic'

/*
 * A tool of the internal dashboard: pick an event from the events sheet and get the subject and
 * body of the email asking its guests for their photo and a few lines about them. Everything is
 * put together in the browser; nothing is sent or saved anywhere. Behind the `admin-view` password.
 */

const TITLE = 'E-mail hosťom'

const BackLink = () => (
  <Link
    href={ROUTES.dashboard}
    className="text-sm font-semibold underline decoration-brand-dark decoration-2 underline-offset-4 hover:decoration-black"
  >
    ← Späť na dashboard
  </Link>
)

const GuestEmailPage = async () => {
  if ((await getAccessLevel()) === 'none') {
    return <DashboardLocked title={TITLE} />
  }

  const events = await getEvents().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Failed to read the events sheet:', error)

    return null
  })

  // Only what the email needs reaches the browser; past or not is decided here, at request time
  const options = events?.map((event): GuestEmailEvent & { isPast: boolean } => ({
    slug: event.slug,
    title: event.title,
    start: event.start,
    end: event.end,
    hasTime: event.hasTime,
    place: event.place,
    facebookLink: event.facebookLink,
    instagramLink: event.instagramLink,
    isPast: getEventStatus(event) === 'past',
  }))

  return (
    <>
      <DashboardHeading title={TITLE} />
      <section className="grow bg-surface px-4 py-8 max-[767px]:pt-10">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BackLink />
            <p className="text-sm text-muted">
              Vyber podujatie, uprav text priamo v e-maile a skopíruj ho do Gmailu.
            </p>
          </div>
          {options ? (
            options.length > 0 ? (
              <GuestEmailGenerator events={options} />
            ) : (
              <p className="rounded-2xl bg-white p-5 text-center">
                V tabuľke podujatí zatiaľ nie je žiadne podujatie.
              </p>
            )
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

export default GuestEmailPage
