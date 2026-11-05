import Link from 'next/link'

import { LogoImage, MenuLink } from '@/components/header/headerParts'
import { ROUTES } from '@/utils/routes'

/** The public pages of this site and the dashboard; a new public page gets added here */
const pages = [
  { label: 'Podujatia', href: ROUTES.events },
  { label: 'Dashboard', href: ROUTES.dashboard },
]

/**
 * The header of the dashboard and its tools. Unlike `SiteHeader`, which mirrors the main site and
 * leads to it, this one leads to the homepage, the public pages of this site and the dashboard.
 */
const DashboardHeader = () => (
  <header className="bg-white">
    <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-2 md:px-8">
      <Link href={ROUTES.home} aria-label="Skautský inštitút – domov">
        <LogoImage className="block size-13" />
      </Link>
      <nav>
        <ul className="flex flex-wrap justify-end gap-x-6">
          {pages.map((page) => (
            <li key={page.href}>
              <MenuLink
                {...page}
                className="text-[18px] font-semibold tracking-[1px] text-black transition-colors duration-300 hover:text-brand-dark"
              />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </header>
)

export default DashboardHeader
