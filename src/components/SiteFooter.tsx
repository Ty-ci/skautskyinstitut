import { externalLinks, wpUploads } from '@/utils/externalLinks'

/*
 * A 1:1 copy of the footer of https://www.skautskyinstitut.sk/ (see `SiteHeader`): a white card on
 * a grey band, 80 % wide from 981 px, full width below.
 */
const SiteFooter = () => {
  return (
    <footer className="bg-surface py-3">
      <div className="mx-auto flex max-w-[1280px] justify-center px-[120px] py-6 max-[980px]:px-8 max-[980px]:py-2 max-[767px]:px-4">
        <div className="w-4/5 overflow-hidden rounded-2xl bg-white p-6 text-[18px] leading-[1.7] font-medium text-ink shadow-[0_12px_18px_-6px_rgba(0,0,0,0.3)] max-[980px]:w-full">
          <div className="mx-auto mb-[2.75%] w-64 opacity-75 max-[980px]:w-[172px]">
            {/* eslint-disable-next-line @next/next/no-img-element -- mirrors the original markup */}
            <img
              src={wpUploads('2025/03/SLSK-logo-zaklad-horizontal.svg')}
              alt="Slovenský skauting"
              width={425}
              height={133}
              className="block h-auto w-full"
            />
          </div>
          <p className="text-center">
            Skautský inštitút na Slovensku je súčasťou organizácie Slovenský skauting, o. z. |{' '}
            <a href={externalLinks.skauting} className="font-semibold text-brand-dark">
              www.skauting.sk
            </a>
            <br />
            Spolupracujeme s organizáciou Skautský institut (ČR) |{' '}
            <a
              href={externalLinks.skautskyInstitutCz}
              target="_blank"
              rel="noopener"
              className="font-semibold text-brand-dark"
            >
              www.skautskyinstitut.cz
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}

export default SiteFooter
