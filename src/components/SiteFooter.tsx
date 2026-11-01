import Image from 'next/image'

import { externalLinks, wpUploads } from '@/utils/externalLinks'

const SiteFooter = () => {
  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-10 text-center text-sm">
        <a href={externalLinks.skauting} target="_blank" rel="noreferrer">
          <Image
            src={wpUploads('2025/03/SLSK-logo-zaklad-horizontal.svg')}
            alt="Slovenský skauting"
            width={425}
            height={133}
            className="h-14 w-auto"
            unoptimized
          />
        </a>
        <p>
          Skautský inštitút na Slovensku je súčasťou organizácie Slovenský skauting, o. z. |{' '}
          <a href={externalLinks.skauting} className="font-semibold hover:underline">
            www.skauting.sk
          </a>
        </p>
        <p>
          Spolupracujeme s organizáciou Skautský institut (ČR) |{' '}
          <a href={externalLinks.skautskyInstitutCz} className="font-semibold hover:underline">
            www.skautskyinstitut.cz
          </a>
        </p>
      </div>
    </footer>
  )
}

export default SiteFooter
