import type { ReactNode } from 'react'

interface Props {
  href: string
  children?: ReactNode
  className?: string
}

/** A quiet link out to the Google spreadsheet, for people who edit it by hand */
const SheetLink = ({ href, children, className = '' }: Props) => (
  <a
    href={href}
    target="_blank"
    rel="noreferrer"
    className={`inline-flex items-center gap-1.5 text-sm text-muted underline decoration-black/15 decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-brand ${className}`}
  >
    {children}
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="size-3.5"
    >
      <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
    </svg>
    <span className="sr-only">(otvorí sa v novom okne)</span>
  </a>
)

export default SheetLink
