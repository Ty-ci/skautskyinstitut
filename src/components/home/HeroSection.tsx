import Image from 'next/image'

import { externalLinks, wpUploads } from '@/utils/externalLinks'

const socialLinks = [
  { label: 'Facebook', href: externalLinks.facebook },
  { label: 'Instagram', href: externalLinks.instagram },
  { label: 'Spotify', href: externalLinks.spotify },
]

const HeroSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-16">
      <h1 className="flex flex-col items-center gap-2 text-center text-4xl leading-none sm:text-6xl">
        Skautský inštitút
        <span className="text-2xl tracking-widest sm:text-3xl">NA SLOVENSKU</span>
      </h1>
      <div className="mt-10 grid gap-10 md:grid-cols-5 md:items-center">
        <div className="flex flex-col gap-4 text-lg md:col-span-3">
          <p>
            Skautský inštitút (SI) je <strong>priestor pre stretnutia, myšlienky a rozhovory</strong>{' '}
            o aktuálnych a dôležitých témach. SI je tu pre všetkých, ktorí majú záujem bádať,
            rozmýšľať a stretávať sa s rôznymi názormi, s rešpektom voči sebe i druhým.
          </p>
          <p>
            Záleží nám na tom, aby sa ľudia stretávali naživo, aby sa rozprávali o témach, ktoré im
            prídu dôležité, aby hľadali spoločnú reč, akceptovali vzájomné rozdiely a aby
            spolutvorili spoločnosť, ktorá si <strong>dôveruje</strong>.
          </p>
          <ul className="flex list-disc flex-col gap-1 pl-8">
            <li>
              Vytvárame priestor pre rozvoj kritického myslenia a aktívneho občianstva – nie je nám
              to jedno,
            </li>
            <li>Šírime a popularizujeme myšlienky skautského hnutia,</li>
            <li>
              <strong>Prepájame</strong> skautskú verejnosť s odborníkmi z rôznych odvetví,
            </li>
            <li>
              Podporujeme súdržnosť <strong>širokej komunity</strong> skautov a priateľov skautingu.
            </li>
          </ul>
          <ul className="flex flex-wrap gap-3 pt-2">
            {socialLinks.map(({ label, href }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block rounded-full bg-surface px-4 py-2 text-base font-semibold shadow-sm transition hover:scale-105 hover:bg-brand"
                >
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <Image
          src={wpUploads('2026/05/20260522_214452-scaled-e1780148401368-873x1024.jpg')}
          alt="Podujatie Skautského inštitútu"
          width={873}
          height={1024}
          className="w-full rounded-3xl object-cover md:col-span-2"
          sizes="(min-width: 1152px) 26rem, (min-width: 768px) 40vw, 100vw"
          priority
        />
      </div>
    </section>
  )
}

export default HeroSection
