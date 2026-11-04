import type { Metadata } from 'next'

import DashboardBoard from '@/components/dashboard/DashboardBoard'
import DashboardLocked, { DashboardHeading } from '@/components/dashboard/DashboardLocked'
import { getAccessLevel } from '@/lib/access/session'
import { getDashboard } from '@/services/dashboard'

export const metadata: Metadata = {
  title: 'Dashboard | Skautský inštitút',
  robots: { index: false, follow: false },
}

// Read from the spreadsheet on every request (the access cookie would force it anyway)
export const dynamic = 'force-dynamic'

/*
 * The internal dashboard: links to the institute's documents and tools, as tiles from the
 * `dashboard` tab of the spreadsheet (see `@/services/dashboard`). Behind the `admin-view`
 * password; `admin-edit` allows changing the tiles from here. Reading the access cookie makes the
 * page render per request, and the tiles never reach a browser without the password.
 */

const DashboardPage = async () => {
  const access = await getAccessLevel()

  if (access === 'none') {
    return <DashboardLocked title="Dashboard" />
  }

  const dashboard = await getDashboard().catch((error: unknown) => {
    // eslint-disable-next-line no-console
    console.error('Failed to read the dashboard sheet:', error)

    return null
  })

  return (
    <>
      <DashboardHeading title="Dashboard" />
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
