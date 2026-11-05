'use client'

import { type SubmitEvent, useEffect, useId, useRef, useState, useTransition } from 'react'

import { createTile, deleteTile, saveTile } from '@/app/(frontend)/(dashboard)/dashboard/actions'
import {
  dangerButton,
  fieldLabel,
  primaryButton,
  secondaryButton,
  textInput,
} from '@/components/dashboard/styles'
import TileIcon, { iconNames, isIconName } from '@/components/dashboard/TileIcon'
import { type DashboardTile, parseTileFields, type TileFields } from '@/utils/dashboardTile'

export type TileDialogTarget =
  { mode: 'edit'; tile: DashboardTile } | { mode: 'add'; section: string } | null

interface Props {
  /** What the dialog is for; it is closed without one */
  target: TileDialogTarget
  /** Existing sections, suggested in the form */
  sections: string[]
  onClose: () => void
}

const emptyFields = (section: string): TileFields => ({
  label: '',
  link: '',
  section,
  icon: '',
  isFeatured: false,
  color: '',
})

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const toFields = ({ row: _row, ...fields }: DashboardTile): TileFields => ({
  ...fields,
  color: fields.color.toLowerCase(),
})

interface FormProps {
  target: NonNullable<TileDialogTarget>
  sections: string[]
  titleId: string
  onDone: () => void
}

const TileForm = ({ target, sections, titleId, onDone }: FormProps) => {
  const ids = {
    label: useId(),
    link: useId(),
    section: useId(),
    sections: useId(),
    icon: useId(),
    icons: useId(),
    color: useId(),
    featured: useId(),
    error: useId(),
  }
  const [fields, setFields] = useState<TileFields>(() =>
    target.mode === 'edit' ? toFields(target.tile) : emptyFields(target.section),
  )
  const [error, setError] = useState('')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const set = <Name extends keyof TileFields>(name: Name, value: TileFields[Name]) =>
    setFields((current) => ({ ...current, [name]: value }))

  const run = (action: () => Promise<{ ok: true } | { ok: false; error: string }>) => {
    setError('')
    startTransition(async () => {
      const result = await action().catch(() => ({
        ok: false as const,
        error: 'Zmenu sa nepodarilo uložiť. Skús to znova.',
      }))
      if (result.ok) {
        onDone()
      } else {
        setError(result.error)
      }
    })
  }

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseTileFields(fields)
    if (!parsed.ok) {
      setError(parsed.error)

      return
    }

    run(async () =>
      target.mode === 'edit' ? saveTile(target.tile, parsed.fields) : createTile(parsed.fields),
    )
  }

  const remove = () => {
    if (target.mode !== 'edit') {
      return
    }
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)

      return
    }
    run(async () => deleteTile(target.tile))
  }

  const iconIsUnknown = fields.icon !== '' && !isIconName(fields.icon.trim().toLowerCase())

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-5 p-5 sm:p-6"
      aria-describedby={error ? ids.error : undefined}
    >
      <h2 id={titleId} className="pr-10 text-3xl/tight">
        {target.mode === 'edit' ? 'Upraviť dlaždicu' : 'Nová dlaždica'}
      </h2>

      <div>
        <label htmlFor={ids.label} className={fieldLabel}>
          Názov
        </label>
        <input
          id={ids.label}
          required
          maxLength={100}
          value={fields.label}
          onChange={(event) => set('label', event.target.value)}
          className={`mt-1.5 ${textInput}`}
        />
      </div>

      <div>
        <label htmlFor={ids.link} className={fieldLabel}>
          Odkaz
        </label>
        <input
          id={ids.link}
          type="url"
          inputMode="url"
          placeholder="https://"
          maxLength={2000}
          value={fields.link}
          onChange={(event) => set('link', event.target.value)}
          className={`mt-1.5 ${textInput}`}
        />
        <p className="mt-1 text-sm text-muted">
          Bez odkazu sa dlaždica zobrazí svetlejšia a nebude klikateľná.
        </p>
      </div>

      <div>
        <label htmlFor={ids.section} className={fieldLabel}>
          Sekcia
        </label>
        <input
          id={ids.section}
          required
          maxLength={100}
          list={ids.sections}
          value={fields.section}
          onChange={(event) => set('section', event.target.value)}
          className={`mt-1.5 ${textInput}`}
        />
        <datalist id={ids.sections}>
          {sections.map((section) => (
            // A suggestion: its value is its label
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            <option key={section} value={section} />
          ))}
        </datalist>
      </div>

      <div>
        <label htmlFor={ids.icon} className={fieldLabel}>
          Ikonka
        </label>
        <div className="mt-1.5 flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface">
            <TileIcon name={fields.icon.trim().toLowerCase()} className="size-6" />
          </span>
          <input
            id={ids.icon}
            list={ids.icons}
            maxLength={64}
            placeholder="napr. book-text"
            autoCapitalize="none"
            spellCheck={false}
            value={fields.icon}
            onChange={(event) => set('icon', event.target.value)}
            aria-invalid={iconIsUnknown || undefined}
            className={textInput}
          />
          <datalist id={ids.icons}>
            {iconNames.map((name) => (
              // eslint-disable-next-line jsx-a11y/control-has-associated-label
              <option key={name} value={name} />
            ))}
          </datalist>
        </div>
        <p className="mt-1 text-sm text-muted">
          {iconIsUnknown ? 'Takú ikonku nepoznáme. ' : null}
          Názvy ikoniek nájdeš na{' '}
          <a
            href="https://lucide.dev/icons"
            target="_blank"
            rel="noreferrer"
            className="underline decoration-brand-dark decoration-2 underline-offset-2"
          >
            lucide.dev/icons
          </a>
          .
        </p>
      </div>

      <div>
        <label htmlFor={ids.color} className={fieldLabel}>
          Farba orámovania
        </label>
        <div className="mt-1.5 flex items-center gap-3">
          <input
            type="color"
            aria-label="Vybrať farbu"
            value={/^#[\da-f]{6}$/i.test(fields.color) ? fields.color : '#cdcdcd'}
            onChange={(event) => set('color', event.target.value)}
            className="size-11 shrink-0 cursor-pointer rounded-xl border-2 border-black/15 bg-white p-1"
          />
          <input
            id={ids.color}
            placeholder="bez farby"
            maxLength={7}
            autoCapitalize="none"
            spellCheck={false}
            value={fields.color}
            onChange={(event) => set('color', event.target.value)}
            className={textInput}
          />
          {fields.color ? (
            <button type="button" onClick={() => set('color', '')} className={secondaryButton}>
              Zrušiť
            </button>
          ) : null}
        </div>
      </div>

      <label htmlFor={ids.featured} className="flex cursor-pointer items-center gap-3">
        <input
          id={ids.featured}
          type="checkbox"
          checked={fields.isFeatured}
          onChange={(event) => set('isFeatured', event.target.checked)}
          className="size-5 cursor-pointer accent-brand-dark"
        />
        <span className="font-semibold">Zvýrazniť dlaždicu</span>
      </label>

      {error ? (
        <p
          id={ids.error}
          role="alert"
          className="rounded-xl bg-[#a11b1b]/10 p-3 text-sm font-semibold text-[#a11b1b]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <button type="submit" className={primaryButton} disabled={isPending}>
          {isPending ? 'Ukladám…' : 'Uložiť'}
        </button>
        <button type="button" onClick={onDone} className={secondaryButton} disabled={isPending}>
          Zrušiť
        </button>
        {target.mode === 'edit' ? (
          <button
            type="button"
            onClick={remove}
            className={`ml-auto ${dangerButton}`}
            disabled={isPending}
          >
            {isConfirmingDelete ? 'Naozaj odstrániť?' : 'Odstrániť'}
          </button>
        ) : null}
      </div>
    </form>
  )
}

/** Adding, changing or removing one tile, in a modal over the dashboard */
const TileDialog = ({ target, sections, onClose }: Props) => {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  // A `<dialog>` is only modal when opened by `showModal`, so it can't be driven by an attribute
  useEffect(() => {
    const dialog = dialogRef.current
    if (target && dialog && !dialog.open) {
      dialog.showModal()
    } else if (!target && dialog?.open) {
      dialog.close()
    }
  }, [target])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      className="m-auto w-[calc(100%-2rem)] max-w-xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] backdrop:bg-black/60"
    >
      {target ? (
        <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          <div className="sticky top-0 z-10 h-0">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Zavrieť"
              className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                strokeLinecap="round"
                aria-hidden
                className="size-5"
              >
                <path d="M6 6l12 12M18 6 6 18" />
              </svg>
            </button>
          </div>
          <TileForm
            // A fresh form for every tile, so nothing typed for one leaks into another
            key={target.mode === 'edit' ? `edit-${target.tile.row}` : `add-${target.section}`}
            target={target}
            sections={sections}
            titleId={titleId}
            onDone={() => dialogRef.current?.close()}
          />
        </div>
      ) : null}
    </dialog>
  )
}

export default TileDialog
