'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'

import { signOut } from '@/app/(frontend)/(site)/dashboard/actions'
import PasswordForm from '@/components/dashboard/PasswordForm'
import { primaryButton, secondaryButton } from '@/components/dashboard/styles'
import Tile from '@/components/dashboard/Tile'
import TileDialog, { type TileDialogTarget } from '@/components/dashboard/TileDialog'
import TileIcon from '@/components/dashboard/TileIcon'
import SheetLink from '@/components/SheetLink'
import { type DashboardTile, groupBySection } from '@/utils/dashboardTile'
import { ROUTES } from '@/utils/routes'

interface Props {
  tiles: DashboardTile[]
  sheetUrl: string
  /** `edit`: the edit password is entered, tiles can be changed */
  access: 'view' | 'edit'
}

/** Read-only until the edit password is entered: a note, and a button opening the form in place */
const EditUnlock = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="flex flex-col items-end gap-3">
      <button
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={secondaryButton}
      >
        <TileIcon name={isOpen ? 'x' : 'lock-keyhole'} className="size-4" />
        {isOpen ? 'Zavrieť' : 'Povoliť úpravy'}
      </button>
      {isOpen ? (
        <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-[0_12px_18px_-6px_rgba(0,0,0,0.2)]">
          <p className="text-sm">
            Upravovať dlaždice môžeš po zadaní hesla na úpravy. Tento prehliadač si ho zapamätá.
          </p>
          <PasswordForm
            level="edit"
            submitLabel="Povoliť úpravy"
            className="mt-4"
            // Opened by the button just now, for typing the password
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
        </div>
      ) : null}
    </div>
  )
}

/** The dashboard's tiles by section – and, with the edit password, the way to change them */
const DashboardBoard = ({ tiles, sheetUrl, access }: Props) => {
  const [isEditing, setIsEditing] = useState(false)
  const [target, setTarget] = useState<TileDialogTarget>(null)
  const [isSigningOut, startSignOut] = useTransition()

  const groups = groupBySection(tiles)
  const sections = groups.map((group) => group.section)
  const canEdit = access === 'edit'
  const editing = canEdit && isEditing

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <div className="flex flex-wrap items-start justify-end gap-3">
        {canEdit ? (
          <>
            {editing ? (
              <button
                type="button"
                onClick={() => setTarget({ mode: 'add', section: sections.at(-1) ?? '' })}
                className={primaryButton}
              >
                <TileIcon name="plus" className="size-4" />
                Pridať dlaždicu
              </button>
            ) : null}
            <button
              type="button"
              aria-pressed={editing}
              onClick={() => setIsEditing((current) => !current)}
              className={secondaryButton}
            >
              <TileIcon name={editing ? 'check' : 'pencil'} className="size-4" />
              {editing ? 'Hotovo' : 'Upraviť'}
            </button>
          </>
        ) : (
          <EditUnlock />
        )}
      </div>

      {editing ? (
        <p className="-mt-4 text-center text-sm text-muted">
          Klikni na dlaždicu a uprav ju. Zmeny sa ukladajú priamo do tabuľky.
        </p>
      ) : null}

      {groups.length === 0 ? (
        <p className="text-center text-lg">Na dashboarde zatiaľ nič nie je.</p>
      ) : null}

      {groups.map((group) => (
        <section key={group.section} className="flex flex-col gap-3">
          <h2 className="text-2xl">{group.section}</h2>
          <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3">
            {group.tiles.map((tile) => (
              <li key={tile.row}>
                <Tile
                  tile={tile}
                  onEdit={editing ? () => setTarget({ mode: 'edit', tile }) : undefined}
                />
              </li>
            ))}
            {editing ? (
              <li>
                <button
                  type="button"
                  onClick={() => setTarget({ mode: 'add', section: group.section })}
                  className="flex size-full min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-black/15 text-sm font-semibold text-muted transition-colors hover:border-brand-dark hover:text-ink focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black"
                >
                  <TileIcon name="plus" className="size-6" />
                  Pridať
                  <span className="sr-only">do sekcie {group.section}</span>
                </button>
              </li>
            ) : null}
          </ul>
        </section>
      ))}

      {/* Built into the site, unlike the tiles from the sheet */}
      <section className="flex flex-col gap-3">
        <h2 className="text-2xl">Nástroje</h2>
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(7.5rem,1fr))] gap-3">
          <li>
            <Link
              href={ROUTES.guestEmail}
              className="group flex size-full flex-col items-center gap-2 rounded-2xl border-2 border-black/6 bg-white px-2 pt-4 pb-3 text-center shadow-[0_6px_12px_-6px_rgba(0,0,0,0.18)] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black"
            >
              <TileIcon name="mail-plus" className="size-6 shrink-0" />
              <span className="text-sm/tight font-semibold decoration-brand-dark decoration-2 underline-offset-2 group-hover:underline">
                E-mail hosťom
              </span>
            </Link>
          </li>
        </ul>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <SheetLink href={sheetUrl}>Zdrojová tabuľka</SheetLink>
        <button
          type="button"
          disabled={isSigningOut}
          onClick={() => startSignOut(async () => signOut())}
          className="cursor-pointer text-sm text-muted underline decoration-black/15 decoration-2 underline-offset-4 transition-colors hover:text-ink hover:decoration-brand disabled:cursor-wait"
        >
          {isSigningOut ? 'Odhlasujem…' : 'Odhlásiť sa'}
        </button>
      </div>

      <TileDialog target={target} sections={sections} onClose={() => setTarget(null)} />
    </div>
  )
}

export default DashboardBoard
