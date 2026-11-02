import Link from 'next/link'

import { externalLinks, siLogoUrl } from '@/utils/externalLinks'

export const menuItems = [
  // Points to this site, which replaces the original link to the Facebook events
  { label: 'Podujatia ↗', href: '/' },
  { label: 'Podcasty SI ↗', href: externalLinks.spotify },
]

/** The logo leads back to the main site */
export const SiteLogo = ({ className }: { className: string }) => (
  <a href={externalLinks.skautskyInstitut} aria-label="Skautský inštitút – hlavná stránka">
    {/* eslint-disable-next-line @next/next/no-img-element -- mirrors the original markup */}
    <img src={siLogoUrl} alt="" width={150} height={150} className={className} />
  </a>
)

interface MenuLinkProps {
  label: string
  href: string
  className: string
}

export const MenuLink = ({ label, href, className }: MenuLinkProps) =>
  href.startsWith('/') ? (
    <Link href={href} className={className}>
      {label}
    </Link>
  ) : (
    <a href={href} className={className}>
      {label}
    </a>
  )
