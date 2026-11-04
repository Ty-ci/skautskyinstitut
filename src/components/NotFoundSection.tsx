import Link from 'next/link'

import { ROUTES } from '@/utils/routes'

const NotFoundSection = () => {
  return (
    <section className="flex grow flex-col items-center gap-8 bg-surface px-4 pt-8 pb-16 text-center lg:pt-20">
      <h1 className="heading-highlight text-5xl max-[767px]:text-4xl">Stránka nebola nájdená</h1>
      <Link
        href={ROUTES.events}
        className="inline-flex items-center rounded-2xl bg-brand px-5 py-2.5 font-semibold transition-colors hover:bg-brand-dark"
      >
        Prejsť na podujatia
      </Link>
    </section>
  )
}

export default NotFoundSection
