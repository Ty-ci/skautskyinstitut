import './globals.css'

import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: 'Skautský inštitút',
  description: 'Pripravované podujatia',
}

const RootLayout = ({ children }: { children: ReactNode }) => {
  return (
    <html lang="sk">
      <body>
        <main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
      </body>
    </html>
  )
}

export default RootLayout
