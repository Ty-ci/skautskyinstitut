/*
 * TODO: Temporary mock data for the homepage feed – remove once real events are published in Payload.
 * The objects mimic what `getUpcomingEvents()` returns (depth 1, so `cover` is populated).
 */
import type { Event, Media } from '@/payload-types'
import { wpUploads } from '@/utils/externalLinks'

const timestamp = '2026-11-01T08:00:00.000Z'

const paragraphs = (...texts: string[]): Event['description'] => ({
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: texts.map((text) => ({
      type: 'paragraph',
      format: '',
      indent: 0,
      version: 1,
      direction: 'ltr',
      textFormat: 0,
      children: [
        { type: 'text', text, format: 0, detail: 0, mode: 'normal', style: '', version: 1 },
      ],
    })),
  },
})

const media = (id: number, path: string, alt: string, width: number, height: number): Media => ({
  id,
  alt,
  url: wpUploads(path),
  width,
  height,
  createdAt: timestamp,
  updatedAt: timestamp,
})

const baseEvent = {
  _status: 'published',
  createdAt: timestamp,
  updatedAt: timestamp,
} satisfies Partial<Event>

export const mockEvents: Event[] = [
  {
    ...baseEvent,
    id: 1,
    title: 'Diskusia: Dôvera v spoločnosti',
    slug: 'diskusia-dovera-v-spolocnosti',
    start: '2026-11-12T17:00:00.000Z',
    end: '2026-11-12T19:00:00.000Z',
    place: 'Skautská klubovňa, Bratislava',
    cover: media(101, '2026/06/PXL_20251022_171850391.jpg', 'Účastníci diskusie', 1600, 1136),
    description: paragraphs(
      'Prečo si ako spoločnosť dôverujeme čoraz menej a čo s tým môžeme urobiť my sami? Pozvanie na pódium prijali sociologička, novinár a skautský vedúci.',
      'Po diskusii zostaneme pri čaji a neformálnych rozhovoroch. Vstup je voľný.',
    ),
  },
  {
    ...baseEvent,
    id: 2,
    title: 'Workshop: Ako viesť dobrú diskusiu',
    slug: 'workshop-ako-viest-dobru-diskusiu',
    start: '2026-11-21T09:00:00.000Z',
    end: '2026-11-21T15:00:00.000Z',
    place: 'Modra',
    cover: media(102, '2026/05/IMG_4092-scaled.jpg', 'Workshop v Modre', 2560, 1707),
    description: paragraphs(
      'Celodenný praktický workshop pre všetkých, ktorí chcú moderovať rozhovory o citlivých témach – v oddiele, v škole aj v rodine.',
      'Kapacita je obmedzená na 20 účastníkov, obed je zabezpečený.',
    ),
  },
  {
    ...baseEvent,
    id: 3,
    title: 'Podcast SI naživo',
    slug: 'podcast-si-nazivo',
    start: '2026-11-27T18:00:00.000Z',
    place: 'Bratislava',
    cover: media(103, '2026/05/image-8.png', 'Nahrávanie podcastu', 1200, 852),
    description: paragraphs(
      'Nahráme novú epizódu podcastu Skautského inštitútu priamo pred publikom. Otázky z publika sú vítané.',
    ),
  },
  {
    ...baseEvent,
    id: 4,
    title: 'Výstava: Skauting v obrazoch',
    slug: 'vystava-skauting-v-obrazoch',
    start: '2026-12-05T09:00:00.000Z',
    end: '2026-12-19T17:00:00.000Z',
    place: 'Pod Tatrami',
    cover: media(104, '2026/05/20260523_103758-scaled.jpg', 'Výstava fotografií', 2560, 1920),
    description: paragraphs(
      'Dva týždne fotografií, kroník a predmetov, ktoré rozprávajú príbeh skautingu na Slovensku. Vernisáž sa uskutoční v deň otvorenia o 17:00.',
    ),
  },
  {
    ...baseEvent,
    id: 5,
    title: 'Adventný koncert pri sviečkach',
    slug: 'adventny-koncert-pri-svieckach',
    start: '2026-12-12T17:00:00.000Z',
    end: '2026-12-12T19:00:00.000Z',
    place: 'Modra',
    cover: media(105, '2026/05/image-9.png', 'Koncert', 1200, 852),
    description: paragraphs(
      'Večer akustickej hudby v podaní skautských kapiel. Dobrovoľné vstupné poputuje na podporu letných táborov.',
    ),
  },
  {
    ...baseEvent,
    id: 6,
    title: 'Rozhovor: Kritické myslenie v ére umelej inteligencie',
    slug: 'rozhovor-kriticke-myslenie-v-ere-ai',
    start: '2027-01-14T17:30:00.000Z',
    place: 'Bratislava',
    description: paragraphs(
      'Ako rozoznať pravdivú informáciu, keď text, obraz aj hlas dokáže vytvoriť stroj? Rozhovor s odborníkom na mediálnu gramotnosť.',
    ),
  },
]
