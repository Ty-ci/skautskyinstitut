import './globals.css'

import { Georama } from 'next/font/google'
import localFont from 'next/font/local'
import type { ReactNode } from 'react'

import SiteHeader from '@/components/header/SiteHeader'
import SiteFooter from '@/components/SiteFooter'

const georama = Georama({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-georama',
})

// Slovenský skauting brand font, used for headings on the main site. Self-hosted: the main site
// serves it without CORS headers, so browsers refuse to load it from there on another domain.
const skautBold = localFont({
  src: './fonts/skaut-bold-webfont.otf',
  variable: '--font-skaut-bold',
  display: 'swap',
})

/** A column, so a page's last section can stretch down to the footer (`grow`) */
export const SiteMain = ({ children }: { children: ReactNode }) => (
  <main className="flex grow flex-col">{children}</main>
)

/** A page of the public site: the header, and the page below it */
export const SitePage = ({ children }: { children: ReactNode }) => (
  <>
    <SiteHeader />
    <SiteMain>{children}</SiteMain>
  </>
)

/**
 * The whole document of the public site, without the header: the dashboard has its own (see the
 * `(site)` and `(dashboard)` layouts). Shared by the frontend layout and `global-not-found`, which
 * renders without any layout.
 */
const SiteDocument = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="sk" className={`${georama.variable} ${skautBold.variable}`}>
      <body className="flex min-h-screen flex-col">
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}

export default SiteDocument
