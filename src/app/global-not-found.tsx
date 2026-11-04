import type { Metadata } from 'next'

import NotFoundSection from '@/components/NotFoundSection'

import SiteDocument from './(frontend)/SiteDocument'

export const metadata: Metadata = {
  title: 'Stránka nebola nájdená | Skautský inštitút',
}

/**
 * The 404 page for URLs that match no route. The app has two root layouts (the public site and
 * Payload), so a root `not-found` has no layout to render in. This page renders without one.
 */
const GlobalNotFound = () => {
  return (
    <SiteDocument>
      <NotFoundSection />
    </SiteDocument>
  )
}

export default GlobalNotFound
