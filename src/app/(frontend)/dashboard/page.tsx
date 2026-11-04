import type { Metadata } from 'next'

import DashboardBoard from '@/components/dashboard/DashboardBoard'
import PasswordForm from '@/components/dashboard/PasswordForm'
import { getAccessLevel } from '@/lib/access/session'
import { getDashboard } from '@/services/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Skautský inštitút',
  robots: { index: false, follow: false },
}

/*
 * The internal dashboard: links to the institute's documents and tools, as tiles from the
 * `dashboard` tab of the spreadsheet (see `@/services/dashboard`). Behind the `admin-view`
 * password; `admin-edit` allows changing the tiles from here. Reading the access cookie makes the
 * page render per request, and the tiles never reach a browser without the password.
 */

const Heading = () => (
  <section className="bg-surface px-4 pt-8 pb-4 text-center lg:pt-20">
    <h1 className="heading-highlight text-5xl max-[767px]:text-4xl">Dashboard</h1>
  </section>
)

const DashboardPage = async () => {
  const access = await getAccessLevel()

  if (access === 'none') {
    return (
      <>
        <Heading />
        <section className="grow bg-surface px-4 py-8 max-[767px]:pt-10">
          <div className="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-[0_12px_18px_-6px_rgba(0,0,0,0.2)] md:p-8">
            <h2 className="text-2xl/tight">Táto časť webu je len pre tím inštitútu</h2>
            <p className="mt-3 text-sm/6 text-muted">
              Zadaj heslo – tento prehliadač si ho zapamätá, takže sa ťa nabudúce nebude pýtať.
            </p>
            <PasswordForm
              level="view"
              submitLabel="Odomknúť"
              className="mt-6"
              // The prompt is the only thing on the page – start typing at once
              // eslint-disable-next-line jsx-a11y/no-autofocus
              autoFocus
            />
          </div>
        </section>
      </>
    )
  }

  const dashboard = await getDashboard().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Failed to read the dashboard sheet:', error)

    return null
  })

  return (
    <>
      <Heading />
      <section className="grow bg-surface px-4 py-8 max-[767px]:pt-10">
        {dashboard ? (
          <DashboardBoard tiles={dashboard.tiles} sheetUrl={dashboard.sheetUrl} access={access} />
        ) : (
          <p role="alert" className="mx-auto max-w-xl rounded-2xl bg-white p-5 text-center">
            Dashboard sa teraz nepodarilo načítať z tabuľky. Skús obnoviť stránku o chvíľu.
          </p>
        )}
      </section>
    </>
  )
}

export default DashboardPage
