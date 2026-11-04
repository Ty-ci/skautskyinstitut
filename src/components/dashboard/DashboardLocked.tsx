import PasswordForm from '@/components/dashboard/PasswordForm'

/** The big heading of the dashboard's pages */
export const DashboardHeading = ({ title }: { title: string }) => (
  <section className="bg-surface px-4 pt-8 pb-4 text-center lg:pt-20">
    <h1 className="heading-highlight text-5xl max-[767px]:text-4xl">{title}</h1>
  </section>
)

/** What the dashboard's pages show without the password: only the prompt for it */
const DashboardLocked = ({ title }: { title: string }) => (
  <>
    <DashboardHeading title={title} />
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

export default DashboardLocked
