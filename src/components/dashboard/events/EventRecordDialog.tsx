'use client'

import { Pencil, X } from 'lucide-react'
import { type SubmitEvent, useState, useTransition } from 'react'
import {
  Button,
  Dialog,
  Heading,
  Input,
  Label,
  Link,
  Modal,
  ModalOverlay,
  TextArea,
  TextField,
} from 'react-aria-components'

import {
  createEvent,
  deleteEvent,
  saveEvent,
} from '@/app/(frontend)/(dashboard)/dashboard/podujatia/actions'
import {
  dangerButton,
  fieldLabel,
  primaryButton,
  secondaryButton,
  textInput,
} from '@/components/dashboard/styles'
import Markdown from '@/components/Markdown'
import { readUrl } from '@/lib/google-sheets/cells'
import {
  DATE_FORMAT_HINT,
  emptyEventFields,
  eventFieldLabels,
  type EventFieldName,
  eventFieldNames,
  type EventFields,
  type EventRecord,
  parseEventFields,
} from '@/utils/eventRecord'

export type EventDialogTarget =
  { mode: 'view'; row: number } | { mode: 'edit'; row: number } | { mode: 'add' } | null

interface Props {
  target: EventDialogTarget
  /** The event the target's row holds now; the dialog closes when it's gone */
  record: EventRecord | undefined
  canEdit: boolean
  onTargetChange: (target: EventDialogTarget) => void
}

const CloseButton = ({ onPress }: { onPress: () => void }) => (
  <Button
    aria-label="Zavrieť"
    onPress={onPress}
    className="flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors hover:bg-black/5 focus-visible:outline-3 focus-visible:outline-black"
  >
    <X aria-hidden className="size-5" strokeWidth={2.5} />
  </Button>
)

/** Every column of an event, empty ones included, so it shows what's still missing */
const EventDetails = ({
  record,
  canEdit,
  onEdit,
  onClose,
}: {
  record: EventRecord
  canEdit: boolean
  onEdit: () => void
  onClose: () => void
}) => {
  const renderValue = (name: EventFieldName) => {
    // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
    const value = record.fields[name]
    if (value === '') {
      return <span className="text-muted">—</span>
    }
    if (name === 'description') {
      return <Markdown source={value} />
    }

    const url = readUrl(value)

    return url ? (
      <Link
        href={url}
        target="_blank"
        rel="noreferrer"
        className="break-all underline decoration-brand-dark decoration-2 underline-offset-2"
      >
        {value}
      </Link>
    ) : (
      <span>{value}</span>
    )
  }

  return (
    <div className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Heading slot="title" className="text-3xl/tight">
          {record.fields.title}
        </Heading>
        <CloseButton onPress={onClose} />
      </div>

      <dl className="grid gap-x-4 gap-y-3 sm:grid-cols-[9rem_1fr]">
        {eventFieldNames
          .filter((name) => name !== 'title')
          .map((name) => (
            <div key={name} className="contents">
              <dt className="text-sm font-semibold text-muted">
                {/* eslint-disable-next-line security/detect-object-injection -- our own keys */}
                {eventFieldLabels[name]}
              </dt>
              <dd className="min-w-0 max-sm:mb-1">{renderValue(name)}</dd>
            </div>
          ))}
      </dl>

      {canEdit ? (
        <div>
          <Button onPress={onEdit} className={primaryButton}>
            <Pencil aria-hidden className="size-4" />
            Upraviť
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/** Fields that take up the whole width of the form, the others sit in two columns */
const wideFields: EventFieldName[] = ['title', 'description', 'place', 'coverUrl', 'calendarLink']

const fieldHints: Partial<Record<EventFieldName, string>> = {
  startDate: `Napr. ${DATE_FORMAT_HINT}`,
  endDate: 'Nepovinné',
  description: 'Jednoduchý Markdown, zobrazuje sa na verejnej stránke.',
  slug: 'Nepovinné, inak sa vytvorí z názvu. Po zmene prestanú platiť staré odkazy na podujatie.',
}

const EventForm = ({
  record,
  onDone,
  onClose,
}: {
  /** None when adding a new event */
  record: EventRecord | undefined
  /** Saved or cancelled */
  onDone: () => void
  onClose: () => void
}) => {
  const [fields, setFields] = useState<EventFields>(record?.fields ?? emptyEventFields)
  const [error, setError] = useState('')
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false)
  const [isPending, startTransition] = useTransition()

  const run = (
    action: () => Promise<{ ok: true } | { ok: false; error: string }>,
    onSuccess: () => void,
  ) => {
    setError('')
    startTransition(async () => {
      const result = await action().catch(() => ({
        ok: false as const,
        error: 'Zmenu sa nepodarilo uložiť. Skús to znova.',
      }))
      if (result.ok) {
        onSuccess()
      } else {
        setError(result.error)
      }
    })
  }

  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = parseEventFields(fields)
    if (!parsed.ok) {
      setError(parsed.error)

      return
    }

    run(
      async () =>
        record
          ? saveEvent({ row: record.row, fields: record.fields }, parsed.fields)
          : createEvent(parsed.fields),
      onDone,
    )
  }

  const remove = () => {
    if (!record) {
      return
    }
    if (!isConfirmingDelete) {
      setIsConfirmingDelete(true)

      return
    }
    run(async () => deleteEvent({ row: record.row, fields: record.fields }), onClose)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <Heading slot="title" className="text-3xl/tight">
          {record ? 'Upraviť podujatie' : 'Nové podujatie'}
        </Heading>
        <CloseButton onPress={onClose} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {eventFieldNames.map((name) => (
          <TextField
            key={name}
            // eslint-disable-next-line security/detect-object-injection -- `name` is one of our own keys
            value={fields[name]}
            onChange={(value) => setFields((current) => ({ ...current, [name]: value }))}
            isRequired={name === 'title' || name === 'startDate'}
            className={wideFields.includes(name) ? 'sm:col-span-2' : ''}
          >
            {/* eslint-disable-next-line security/detect-object-injection */}
            <Label className={fieldLabel}>{eventFieldLabels[name]}</Label>
            {name === 'description' ? (
              <TextArea rows={6} className={`mt-1.5 ${textInput} py-2`} />
            ) : (
              <Input className={`mt-1.5 ${textInput}`} />
            )}
            {/* eslint-disable-next-line security/detect-object-injection */}
            {fieldHints[name] ? (
              // eslint-disable-next-line security/detect-object-injection
              <p className="mt-1 text-sm text-muted">{fieldHints[name]}</p>
            ) : null}
          </TextField>
        ))}
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl bg-[#a11b1b]/10 p-3 text-sm font-semibold text-[#a11b1b]"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 pt-1">
        <Button type="submit" className={primaryButton} isDisabled={isPending}>
          {isPending ? 'Ukladám…' : 'Uložiť'}
        </Button>
        <Button onPress={onDone} className={secondaryButton} isDisabled={isPending}>
          Zrušiť
        </Button>
        {record ? (
          <Button onPress={remove} className={`ml-auto ${dangerButton}`} isDisabled={isPending}>
            {isConfirmingDelete ? 'Naozaj odstrániť z tabuľky?' : 'Odstrániť'}
          </Button>
        ) : null}
      </div>
    </form>
  )
}

/** One event's every column, and with the edit password the form changing them, in a modal */
const EventRecordDialog = ({ target, record, canEdit, onTargetChange }: Props) => {
  const close = () => onTargetChange(null)
  // Nothing typed into a form should be lost by a stray click or key
  const isViewing = target?.mode === 'view'

  return (
    <ModalOverlay
      isOpen={target !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          close()
        }
      }}
      isDismissable={isViewing}
      isKeyboardDismissDisabled={!isViewing}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
    >
      <Modal className="max-h-full w-full max-w-2xl overflow-y-auto rounded-2xl bg-white text-ink shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
        <Dialog className="outline-none">
          {target?.mode === 'view' && record ? (
            <EventDetails
              record={record}
              canEdit={canEdit}
              onEdit={() => onTargetChange({ mode: 'edit', row: target.row })}
              onClose={close}
            />
          ) : null}
          {target?.mode === 'edit' && record ? (
            <EventForm
              // A fresh form for every event, so nothing typed for one leaks into another
              key={`edit-${target.row}`}
              record={record}
              onDone={() => onTargetChange({ mode: 'view', row: target.row })}
              onClose={close}
            />
          ) : null}
          {target?.mode === 'add' ? (
            <EventForm key="add" record={undefined} onDone={close} onClose={close} />
          ) : null}
        </Dialog>
      </Modal>
    </ModalOverlay>
  )
}

export default EventRecordDialog
