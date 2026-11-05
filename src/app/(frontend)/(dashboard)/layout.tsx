import type { ReactNode } from 'react'

import DashboardHeader from '@/components/header/DashboardHeader'

import { SiteMain } from '../SiteDocument'

/** The dashboard and its tools, under their own header (see `DashboardHeader`) */
const DashboardLayout = ({ children }: { children: ReactNode }) => (
  <>
    <DashboardHeader />
    <SiteMain>{children}</SiteMain>
  </>
)

export default DashboardLayout
