'use client'

import { DynamicIcon, type IconName, iconNames } from 'lucide-react/dynamic'

const knownIcons = new Set<string>(iconNames)

export const isIconName = (name: string): name is IconName => knownIcons.has(name)

/** Every Lucide icon name, for suggestions in the tile form */
export { iconNames }

interface Props {
  /** A Lucide icon name from the sheet: none shows a link, an unknown one a question mark */
  name: string
  className?: string
}

const iconFor = (name: string): IconName => {
  if (name === '') {
    return 'link'
  }

  return isIconName(name) ? name : 'circle-question-mark'
}

/** A Lucide icon picked by name in the sheet, loaded only when shown */
const TileIcon = ({ name, className }: Props) => (
  <DynamicIcon
    name={iconFor(name)}
    aria-hidden
    // Keeps the tile's height while the icon loads
    fallback={() => <span className={`block ${className ?? ''}`} />}
    className={className}
  />
)

export default TileIcon
