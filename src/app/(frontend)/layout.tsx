import './globals.css'

import type { Metadata } from 'next'
import { Georama } from 'next/font/google'
import type { ReactNode } from 'react'

import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'

const georama = Georama({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-georama',
})

export const metadata: Metadata = {
  title: 'Skautský inštitút',
  description: 'Pripravované podujatia',
}

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="sk" className={georama.variable}>
      <body className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="grow">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}

export default RootLayout
