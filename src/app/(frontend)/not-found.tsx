import NotFoundSection from '@/components/NotFoundSection'

import { SitePage } from './SiteDocument'

/**
 * For `notFound()` called within the public site. Unmatched URLs go to `global-not-found`. Sits
 * above the `(site)` layout, so it brings the header along itself.
 */
const NotFound = () => {
  return (
    <SitePage>
      <NotFoundSection />
    </SitePage>
  )
}

export default NotFound
