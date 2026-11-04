'use client'

import type { CSSProperties } from 'react'

import TileIcon from '@/components/dashboard/TileIcon'
import type { DashboardTile } from '@/utils/dashboardTile'

interface Props {
  tile: DashboardTile
  /** Set while editing: the tile opens its form instead of its link */
  onEdit?: () => void
}

const tileClasses =
  'group flex h-full w-full flex-col items-center gap-2 rounded-2xl border-2 bg-white px-2 pt-4 pb-3 text-center shadow-[0_6px_12px_-6px_rgba(0,0,0,0.18)] transition-[border-color,box-shadow] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black'

/** Only real colours reach the style – the sheet is typed into by hand */
const readColor = (value: string) =>
  /^#[\da-f]{3}$/i.test(value) || /^#[\da-f]{6}$/i.test(value) ? value : undefined

const styleOf = (tile: DashboardTile): CSSProperties => {
  const color = readColor(tile.color)

  return {
    borderColor: color ?? 'rgb(0 0 0 / 0.06)',
    // A featured tile glows in its colour, or in the brand yellow
    boxShadow: tile.isFeatured ? `0 2px 16px -2px ${color ?? 'var(--color-brand)'}` : undefined,
  }
}

const TileContent = ({ tile }: { tile: DashboardTile }) => (
  <>
    <TileIcon name={tile.icon} className="size-6 shrink-0" />
    <span className="text-sm/tight font-semibold wrap-break-word decoration-brand-dark decoration-2 underline-offset-2 group-hover:underline">
      {tile.label}
    </span>
  </>
)

/** One link of the dashboard: an icon and a label, framed in the colour from the sheet */
const Tile = ({ tile, onEdit }: Props) => {
  if (onEdit) {
    return (
      <button
        type="button"
        onClick={onEdit}
        style={styleOf(tile)}
        className={`${tileClasses} relative cursor-pointer border-dashed`}
      >
        <TileContent tile={tile} />
        <span className="sr-only">– upraviť</span>
      </button>
    )
  }

  if (!tile.link) {
    // Waiting for its link: shown, but faded and not clickable
    return (
      <div style={styleOf(tile)} className={`${tileClasses} opacity-40`} aria-disabled>
        <TileContent tile={tile} />
      </div>
    )
  }

  return (
    <a
      href={tile.link}
      target="_blank"
      rel="noreferrer"
      style={styleOf(tile)}
      className={tileClasses}
    >
      <TileContent tile={tile} />
      <span className="sr-only">(otvorí sa v novom okne)</span>
    </a>
  )
}

export default Tile
