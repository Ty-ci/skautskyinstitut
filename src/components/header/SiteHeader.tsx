import { menuItems, MenuLink, SiteLogo } from '@/components/header/headerParts'
import MobileMenu from '@/components/header/MobileMenu'

/*
 * A 1:1 copy of the header of https://www.skautskyinstitut.sk/ (Divi theme builder), so visitors move
 * between the two sites without noticing. Measurements are taken from the original's CSS:
 * - from 981 px: logo on the left, menu centered, white bar,
 * - up to 980 px: logo and a hamburger opening a dropdown.
 * Like the original, the menu overhangs the bar by 32 px (`-mb-8`), so the content right below
 * the header has to start on white.
 */
const SiteHeader = () => {
  return (
    <header className="relative z-10">
      {/* Desktop */}
      <div className="hidden bg-white min-[981px]:block">
        <div className="mx-auto max-w-[1280px] px-32">
          <div className="min-h-16">
            <div className="-mb-8 pt-[21px]">
              <div className="relative">
                <div className="absolute top-1/2 left-3 size-15 -translate-y-1/2 overflow-hidden">
                  <SiteLogo className="block size-15" />
                </div>
                <nav className="flex justify-center">
                  <ul className="-mx-[11px] flex flex-wrap justify-center leading-[30.6px]">
                    {menuItems.map((item) => (
                      <li key={item.label} className="flex px-[11px]">
                        <MenuLink
                          {...item}
                          className="ml-6 flex items-center py-[22px] text-[18px] font-semibold tracking-[1px] whitespace-nowrap text-black transition-colors duration-300 hover:text-brand-dark"
                        />
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tablet and mobile */}
      <div className="bg-surface min-[981px]:hidden">
        <div className="bg-white px-5 py-2 max-[767px]:px-2">
          <div className="-mb-8 rounded-2xl bg-white py-1 pl-3">
            <MobileMenu />
          </div>
        </div>
      </div>
    </header>
  )
}

export default SiteHeader
