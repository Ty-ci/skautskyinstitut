import EventsOverview from '@/components/dashboard/events/EventsOverview'
import { getEventRecords } from '@/services/eventRecords'

export const dynamic = 'force-dynamic'

// TEMPORARY: a browser check of the overview, deleted right after it
const Page = async ({ searchParams }: { searchParams: Promise<{ edit?: string }> }) => {
  const { edit } = await searchParams
  const { records, sheetUrl } = await getEventRecords()

  return (
    <section className="grow bg-surface px-4 py-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <EventsOverview records={records} sheetUrl={sheetUrl} access={edit ? 'edit' : 'view'} />
      </div>
    </section>
  )
}

export default Page
