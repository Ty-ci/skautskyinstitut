import Image from 'next/image'

import { wpUploads } from '@/utils/externalLinks'

const gallery = [
  ['2026/06/PXL_20251022_171850391-400x284.jpg', '2026/06/PXL_20251022_171850391.jpg'],
  ['2026/05/image-8-400x284.png', '2026/05/image-8.png'],
  ['2026/05/IMG_4092-400x284.jpg', '2026/05/IMG_4092-scaled.jpg'],
  ['2026/05/20260523_103758-400x284.jpg', '2026/05/20260523_103758-scaled.jpg'],
  ['2026/05/image-9-400x284.png', '2026/05/image-9.png'],
  ['2026/06/PXL_20250919_174001780-400x284.jpg', '2026/06/PXL_20250919_174001780.jpg'],
].map(([thumbnail, full]) => ({ thumbnail: wpUploads(thumbnail), full: wpUploads(full) }))

const LocationsSection = () => {
  return (
    <section className="mx-auto max-w-6xl px-4 py-12 text-center sm:py-16">
      <h2 className="text-4xl sm:text-5xl">Kde fungujeme</h2>
      <p className="mt-3 text-xl font-semibold">Bratislava | Modra | Pod Tatrami</p>
      <ul className="mt-8 grid grid-cols-3 gap-3 lg:grid-cols-6 lg:gap-4">
        {gallery.map(({ thumbnail, full }) => (
          <li key={full}>
            <a href={full} target="_blank" rel="noreferrer">
              <Image
                src={thumbnail}
                alt=""
                width={400}
                height={284}
                className="aspect-square w-full rounded-2xl object-cover transition-transform duration-300 hover:scale-[1.02]"
                sizes="(min-width: 1024px) 11rem, 33vw"
              />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export default LocationsSection
