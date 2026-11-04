import type { ReactNode } from 'react'

import { SitePage } from '../SiteDocument'

/** The public site's pages (and the dashboard), under the site's header */
const SiteLayout = ({ children }: { children: ReactNode }) => <SitePage>{children}</SitePage>

export default SiteLayout
