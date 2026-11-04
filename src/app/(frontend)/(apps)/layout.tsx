import type { ReactNode } from 'react'

import { SiteMain } from '../SiteDocument'

/** The dashboard's tools: no site header, each page links back to the dashboard itself */
const AppsLayout = ({ children }: { children: ReactNode }) => <SiteMain>{children}</SiteMain>

export default AppsLayout
