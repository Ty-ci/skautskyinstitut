import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import SiteDocument from './SiteDocument'

export const metadata: Metadata = {
  title: 'Skautský inštitút',
  description: 'Pripravované podujatia',
}

const RootLayout = ({ children }: { children: ReactNode }) => {
  return <SiteDocument>{children}</SiteDocument>
}

export default RootLayout
