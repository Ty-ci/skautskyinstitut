import Image from 'next/image'
import Link from 'next/link'

import { externalLinks, siLogoUrl } from '@/utils/externalLinks'

const navLinkClassName =
  'text-base font-semibold tracking-wide transition-colors hover:text-brand-dark sm:text-lg'

const SiteHeader = () => {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
        <Link href="/" aria-label="Skautský inštitút – domov">
          <Image src={siLogoUrl} alt="" width={60} height={60} className="size-12 sm:size-15" />
        </Link>
        <nav>
          <ul className="flex items-center gap-6 sm:gap-10">
            <li>
              <Link href="/#podujatia" className={navLinkClassName}>
                Podujatia
              </Link>
            </li>
            <li>
              <a
                href={externalLinks.spotify}
                target="_blank"
                rel="noreferrer"
                className={navLinkClassName}
              >
                Podcasty SI ↗
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  )
}

export default SiteHeader
