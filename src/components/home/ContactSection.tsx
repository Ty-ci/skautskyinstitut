import Image from 'next/image'

import { wpUploads } from '@/utils/externalLinks'

const contacts = [
  {
    name: 'Michal „Mixal“ Tarbaj',
    role: 'Koordinátor SI na Slovensku',
    photo: wpUploads('2026/06/Mixal-0.jpg'),
    email: 'institut@skauting.sk',
    phone: '+421 902 826 644',
  },
  {
    name: 'Adam „Tyči“ Jakubička',
    role: 'Garant SI v Bratislave',
    photo: wpUploads('2026/06/Tyci-0.jpg'),
    email: 'tyci@prvyzbor.sk',
  },
  {
    name: 'Jakub „Fio“ Fiala',
    role: 'Garant SI v Modre',
    photo: wpUploads('2026/06/Fio-0.jpg'),
    email: 'jakubfiofiala@gmail.com',
    phone: '+421 948 081 450',
  },
  {
    name: 'Daniel Dulovič',
    role: 'Garant SI pod Tatrami',
    photo: wpUploads('2026/06/Daniel-0.jpg'),
    email: 'daniel.dulovic3@gmail.com',
    phone: '+421 917 764 626',
  },
]

const ContactSection = () => {
  return (
    <section className="bg-surface py-12 sm:py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h2 className="text-center text-4xl sm:text-5xl">Kontakt</h2>
        <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map(({ name, role, photo, email, phone }) => (
            <li
              key={email}
              className="flex flex-col items-center gap-2 rounded-3xl bg-white px-4 py-6 text-center"
            >
              <Image
                src={photo}
                alt={name}
                width={256}
                height={256}
                className="mb-2 size-32 rounded-2xl object-cover"
                sizes="8rem"
              />
              <h3 className="text-xl">{name}</h3>
              <p className="text-muted">{role}</p>
              <a href={`mailto:${email}`} className="font-bold break-all text-brand-dark">
                {email}
              </a>
              {phone ? (
                <a href={`tel:${phone}`} className="hover:underline">
                  {phone}
                </a>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default ContactSection
