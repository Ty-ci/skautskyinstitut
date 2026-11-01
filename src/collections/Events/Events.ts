import type { CollectionConfig, DateFieldValidation, FieldHook } from 'payload'

import type { Event } from '@/payload-types'
import { eventPath } from '@/utils/paths'
import { slugify } from '@/utils/slugify'

import { revalidateEventAfterChange, revalidateEventAfterDelete } from './revalidateEvent'

/** Uses the slug typed by the editor, or derives it from the title when left empty */
const formatSlug: FieldHook<Event, string | null | undefined> = ({ value, data }) => {
  const source = value?.trim() || data?.title

  return source ? slugify(source) : value
}

const validateEnd: DateFieldValidation = (value, { siblingData }) => {
  const { start } = siblingData as Partial<Event>
  if (value && start && new Date(value) < new Date(start)) {
    return 'Koniec musí byť po začiatku.'
  }

  return true
}

export const Events: CollectionConfig = {
  slug: 'events',
  labels: {
    singular: 'Podujatie',
    plural: 'Podujatia',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'start', 'place', '_status'],
    preview: (doc) =>
      typeof doc.slug === 'string'
        ? `${process.env.NEXT_PUBLIC_SERVER_URL ?? ''}${eventPath(doc.slug)}`
        : null,
  },
  defaultSort: '-start',
  versions: {
    drafts: true,
  },
  access: {
    // Anonymous visitors (and the frontend via `overrideAccess: false`) see published events only
    read: ({ req: { user } }) => (user ? true : { _status: { equals: 'published' } }),
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  hooks: {
    afterChange: [revalidateEventAfterChange],
    afterDelete: [revalidateEventAfterDelete],
  },
  fields: [
    {
      name: 'title',
      label: 'Názov',
      type: 'text',
      required: true,
    },
    {
      type: 'row',
      fields: [
        {
          name: 'start',
          label: 'Začiatok',
          type: 'date',
          required: true,
          index: true,
          admin: {
            date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm', timeIntervals: 15 },
          },
        },
        {
          name: 'end',
          label: 'Koniec',
          type: 'date',
          admin: {
            date: { pickerAppearance: 'dayAndTime', timeFormat: 'HH:mm', timeIntervals: 15 },
          },
          validate: validateEnd,
        },
      ],
    },
    {
      name: 'place',
      label: 'Miesto',
      type: 'text',
    },
    {
      name: 'cover',
      label: 'Titulný obrázok',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'description',
      label: 'Popis',
      type: 'richText',
    },
    {
      name: 'slug',
      label: 'Slug (URL)',
      type: 'text',
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Vyplní sa automaticky z názvu, ak ostane prázdny.',
      },
      hooks: {
        beforeValidate: [formatSlug],
      },
    },
    {
      name: 'shareToSocial',
      label: 'Zdieľať na Facebook a Instagram',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'fbPostId',
      label: 'ID príspevku na Facebooku',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'igPostId',
      label: 'ID príspevku na Instagrame',
      type: 'text',
      admin: { position: 'sidebar', readOnly: true },
    },
  ],
}
