/*
 * One tile of the internal dashboard – a row of the `dashboard` tab. Kept free of server imports:
 * the browser's form validates with the same rules the server action enforces.
 */

export interface TileFields {
  label: string
  /** Empty: the tile shows, faded and not clickable */
  link: string
  section: string
  /** A Lucide icon name (https://lucide.dev/icons), e.g. `book-text`; empty for the default */
  icon: string
  /** Glows in its border colour */
  isFeatured: boolean
  /** `#rrggbb`, or empty for the default border */
  color: string
}

export interface DashboardTile extends TileFields {
  /** The tile's row in the sheet, 1-based – how the server finds it again */
  row: number
}

export type ActionResult = { ok: true } | { ok: false; error: string }

const LIMITS = { label: 100, link: 2000, section: 100, icon: 64 }

/** Checks and tidies up fields that arrived from the browser – an error message (in Slovak) or the fields */
export const parseTileFields = (
  input: unknown,
): { ok: true; fields: TileFields } | { ok: false; error: string } => {
  if (typeof input !== 'object' || input === null) {
    return { ok: false, error: 'Neplatné údaje.' }
  }

  const raw = input as Record<string, unknown>
  const text = (name: keyof typeof LIMITS) => {
    // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
    const value = raw[name]

    return typeof value === 'string' ? value.trim() : null
  }

  const label = text('label')
  const link = text('link')
  const section = text('section')
  const icon = text('icon')?.toLowerCase() ?? null
  const color = typeof raw.color === 'string' ? raw.color.trim().toLowerCase() : null
  const { isFeatured } = raw

  if (
    label === null ||
    link === null ||
    section === null ||
    icon === null ||
    color === null ||
    typeof isFeatured !== 'boolean'
  ) {
    return { ok: false, error: 'Neplatné údaje.' }
  }

  if (label === '' || label.length > LIMITS.label) {
    return { ok: false, error: `Názov je povinný, najviac ${LIMITS.label} znakov.` }
  }
  if (section === '' || section.length > LIMITS.section) {
    return { ok: false, error: `Sekcia je povinná, najviac ${LIMITS.section} znakov.` }
  }
  if (link !== '' && (!/^https?:\/\/\S+$/i.test(link) || link.length > LIMITS.link)) {
    return { ok: false, error: 'Odkaz musí začínať na https:// (alebo ostať prázdny).' }
  }
  if (icon.length > LIMITS.icon || !/^[a-z\d-]*$/.test(icon)) {
    return { ok: false, error: 'Ikonka je názov z lucide.dev/icons, napr. book-text.' }
  }
  if (color !== '' && !/^#[\da-f]{6}$/.test(color)) {
    return { ok: false, error: 'Farba je hex kód v tvare #01b5e5 (alebo prázdna).' }
  }

  return { ok: true, fields: { label, link, section, icon, isFeatured, color } }
}

/** Sections in the order their first tile appears in the sheet */
export const groupBySection = (tiles: DashboardTile[]) => {
  const sections = new Map<string, DashboardTile[]>()
  tiles.forEach((tile) => {
    sections.set(tile.section, [...(sections.get(tile.section) ?? []), tile])
  })

  return [...sections].map(([section, sectionTiles]) => ({ section, tiles: sectionTiles }))
}
