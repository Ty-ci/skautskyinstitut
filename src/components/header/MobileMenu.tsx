'use client'

import { useState } from 'react'

import { menuItems, MenuLink, SiteLogo } from '@/components/header/headerParts'

/** The original's hamburger: three rounded bars of the Divi icon font, redrawn as SVG */
const HamburgerIcon = () => (
  <svg viewBox="0 0 36 25" width={36} height={25} aria-hidden fill="currentColor">
    <rect y="0" width="36" height="4" rx="2" />
    <rect y="10.5" width="36" height="4" rx="2" />
    <rect y="21" width="36" height="4" rx="2" />
  </svg>
)

/** Logo, hamburger and the dropdown of the header up to 980 px (see `SiteHeader`) */
const MobileMenu = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative flex min-h-14 items-center">
      <div className="mr-[30px] flex items-center">
        <SiteLogo className="block h-auto max-h-[52px] w-auto" />
      </div>
      <div className="flex flex-1 items-center justify-end">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-controls="mobile-menu"
          aria-label={isOpen ? 'Zavrieť menu' : 'Otvoriť menu'}
          className="mt-[3px] mr-4 cursor-pointer text-ink"
        >
          <HamburgerIcon />
        </button>
      </div>
      {isOpen ? (
        <ul
          id="mobile-menu"
          className="absolute top-full right-0 z-50 w-max rounded-b-2xl border-t-[3px] border-brand bg-white p-3 shadow-[0_12px_18px_-6px_rgba(0,0,0,0.3)]"
        >
          {menuItems.map((item) => (
            <li key={item.label} className="pr-2 pl-6">
              <MenuLink
                {...item}
                className="ml-6 block border-b border-black/3 px-2 py-2.5 text-right text-[20px] leading-[1.7] font-bold text-[#666] lowercase transition-colors duration-300 hover:text-brand-dark"
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default MobileMenu
