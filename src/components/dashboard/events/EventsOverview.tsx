'use client'

import { ChevronDown, ChevronLeft, ChevronRight, FolderOpen, Plus, Search, X } from 'lucide-react'
import { type ReactNode, useMemo, useState } from 'react'
import {
  Button,
  Cell,
  Column,
  I18nProvider,
  Input,
  Label,
  Link,
  ListBox,
  ListBoxItem,
  Popover,
  Row,
  SearchField,
  Select,
  SelectValue,
  Table,
  TableBody,
  TableHeader,
} from 'react-aria-components'

import EditUnlock from '@/components/dashboard/EditUnlock'
import EventRecordDialog, {
  type EventDialogTarget,
} from '@/components/dashboard/events/EventRecordDialog'
import {
  fieldLabel,
  primaryButton,
  secondaryButton,
  textInput,
} from '@/components/dashboard/styles'
import { FacebookIcon, InstagramIcon } from '@/components/EventActions'
import SheetLink from '@/components/SheetLink'
import { normalize, readUrl } from '@/lib/google-sheets/cells'
import type { EventRecord } from '@/utils/eventRecord'
import { formatEventDate } from '@/utils/formatEventDate'

const PAGE_SIZE = 30

/** The filter's option for "don't filter"; no value from the sheet can be this */
const ALL = '__all__'

interface Props {
  /** The newest first */
  records: EventRecord[]
  sheetUrl: string
  /** `edit`: the edit password is entered, events can be changed */
  access: 'view' | 'edit'
}

/**
 * The text a search goes through. Normalized like the query, so neither diacritics nor spaces
 * matter: "12.11.2026" finds "12. 11. 2026". The written-out date makes "novembra" work as well.
 */
const searchTextOf = ({ fields, start, end, hasTime }: EventRecord) =>
  normalize(
    [
      fields.title,
      fields.description,
      fields.place,
      fields.startDate,
      fields.endDate,
      formatEventDate(start, end, hasTime),
    ].join('|'),
  )

const collator = new Intl.Collator('sk')

/** The distinct, non-empty values of a column, in alphabetical order */
const distinct = (values: string[]) =>
  [...new Set(values.filter((value) => value !== ''))].sort(collator.compare)

interface FilterSelectProps {
  label: string
  allLabel: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

const FilterSelect = ({ label, allLabel, value, options, onChange }: FilterSelectProps) => (
  <Select
    value={value}
    onChange={(key) => onChange(String(key))}
    // Nothing to choose from yet, when the column is empty in the whole sheet
    isDisabled={options.length === 0}
    className="min-w-36 flex-1 sm:flex-none"
  >
    <Label className={fieldLabel}>{label}</Label>
    <Button
      className={`mt-1.5 flex cursor-pointer items-center justify-between gap-2 text-left disabled:cursor-not-allowed disabled:opacity-50 ${textInput}`}
    >
      <SelectValue className="truncate" />
      <ChevronDown aria-hidden className="size-4 shrink-0" />
    </Button>
    <Popover className="max-h-72 w-(--trigger-width) overflow-y-auto rounded-xl bg-white shadow-[0_12px_24px_-6px_rgba(0,0,0,0.3)] ring-1 ring-black/10">
      <ListBox className="p-1 outline-none">
        {[
          { id: ALL, name: allLabel },
          ...options.map((option) => ({ id: option, name: option })),
        ].map(({ id, name }) => (
          <ListBoxItem
            key={id}
            id={id}
            textValue={name}
            className="cursor-pointer rounded-lg px-3 py-2 outline-none data-focused:bg-surface data-selected:font-semibold"
          >
            {name}
          </ListBoxItem>
        ))}
      </ListBox>
    </Popover>
  </Select>
)

/** A small icon linking out of the table, for cells that have an address to link to */
const IconLink = ({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: ReactNode
}) => {
  const url = readUrl(href)

  return url ? (
    // Unlike a plain `<a>`, this keeps the press to itself: it doesn't open the row's modal as well
    <Link
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="inline-flex size-8 items-center justify-center rounded-lg transition-colors hover:bg-brand focus-visible:outline-3 focus-visible:outline-black"
    >
      {children}
    </Link>
  ) : null
}

const headerCell = 'px-3 py-3 text-left text-sm font-semibold whitespace-nowrap outline-none'
const iconHeaderCell = `${headerCell} w-px text-center`
const bodyCell =
  'px-3 py-2 align-middle outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black'

/** The internal table of all events: search, filters, pages, and a modal with all there is */
const EventsOverview = ({ records, sheetUrl, access }: Props) => {
  const [query, setQuery] = useState('')
  const [year, setYear] = useState(ALL)
  const [garant, setGarant] = useState(ALL)
  const [team, setTeam] = useState(ALL)
  const [page, setPage] = useState(1)
  const [target, setTarget] = useState<EventDialogTarget>(null)

  const canEdit = access === 'edit'

  const searchable = useMemo(
    () => records.map((record) => ({ record, text: searchTextOf(record) })),
    [records],
  )
  const options = useMemo(
    () => ({
      years: [...new Set(records.map((record) => String(record.year)))].sort((a, b) =>
        b.localeCompare(a),
      ),
      garants: distinct(records.map((record) => record.fields.garant1)),
      teams: distinct(records.map((record) => record.fields.team)),
    }),
    [records],
  )

  const terms = query.split(/\s+/).map(normalize).filter(Boolean)
  const matching = searchable
    .filter(
      ({ record, text }) =>
        (year === ALL || String(record.year) === year) &&
        (garant === ALL || record.fields.garant1 === garant) &&
        (team === ALL || record.fields.team === team) &&
        terms.every((term) => text.includes(term)),
    )
    .map(({ record }) => record)

  const pageCount = Math.max(1, Math.ceil(matching.length / PAGE_SIZE))
  // The list can shrink under the current page, when an event is removed
  const currentPage = Math.min(page, pageCount)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const visible = matching.slice(firstIndex, firstIndex + PAGE_SIZE)

  /** Any change of what's listed starts over from its first page */
  const filterBy =
    <Value,>(setter: (value: Value) => void) =>
    (value: Value) => {
      setter(value)
      setPage(1)
    }

  const openRecord =
    target && target.mode !== 'add'
      ? records.find((record) => record.row === target.row)
      : undefined
  // The event can be gone after a refresh; the dialog then has nothing to show
  const dialogTarget = target && target.mode !== 'add' && !openRecord ? null : target

  return (
    // Without a fixed locale, the server's and the browser's default would differ while hydrating
    <I18nProvider locale="sk-SK">
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-start justify-end gap-3">
          {canEdit ? (
            <Button onPress={() => setTarget({ mode: 'add' })} className={primaryButton}>
              <Plus aria-hidden className="size-4" />
              Pridať podujatie
            </Button>
          ) : (
            <EditUnlock>
              Upravovať podujatia môžeš po zadaní hesla na úpravy. Tento prehliadač si ho zapamätá.
            </EditUnlock>
          )}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <SearchField
            value={query}
            onChange={filterBy(setQuery)}
            className="group min-w-64 grow basis-64"
          >
            <Label className={fieldLabel}>Hľadať</Label>
            <div className="relative mt-1.5">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted"
              />
              <Input
                placeholder="Názov, dátum, miesto alebo popis"
                className={`${textInput} pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden`}
              />
              <Button
                aria-label="Vymazať hľadanie"
                className="absolute top-1/2 right-2 flex size-7 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full group-data-empty:hidden hover:bg-black/5"
              >
                <X aria-hidden className="size-4" />
              </Button>
            </div>
          </SearchField>
          <FilterSelect
            label="Rok"
            allLabel="Všetky roky"
            value={year}
            options={options.years}
            onChange={filterBy(setYear)}
          />
          <FilterSelect
            label="Garant"
            allLabel="Všetci garanti"
            value={garant}
            options={options.garants}
            onChange={filterBy(setGarant)}
          />
          <FilterSelect
            label="Tím"
            allLabel="Všetky tímy"
            value={team}
            options={options.teams}
            onChange={filterBy(setTeam)}
          />
        </div>

        <div className="overflow-x-auto rounded-2xl bg-white shadow-[0_6px_12px_-6px_rgba(0,0,0,0.18)]">
          <Table
            aria-label="Podujatia"
            onRowAction={(key) => setTarget({ mode: 'view', row: Number(key) })}
            className="w-full border-collapse"
          >
            <TableHeader className="border-b-2 border-black/10">
              <Column isRowHeader className={`${headerCell} min-w-64`}>
                Názov
              </Column>
              <Column className={headerCell}>Začiatok</Column>
              <Column className={`${headerCell} min-w-40`}>Miesto</Column>
              <Column className={iconHeaderCell}>Facebook</Column>
              <Column className={iconHeaderCell}>Instagram</Column>
              <Column className={iconHeaderCell}>Priečinok</Column>
            </TableHeader>
            <TableBody
              items={visible}
              renderEmptyState={() => (
                <p className="p-8 text-center text-muted">
                  {records.length === 0
                    ? 'V tabuľke podujatí zatiaľ nie je žiadne podujatie.'
                    : 'Tomuto hľadaniu nezodpovedá žiadne podujatie.'}
                </p>
              )}
            >
              {(record) => (
                <Row
                  id={record.row}
                  textValue={record.fields.title}
                  className="cursor-pointer border-b border-black/6 transition-colors outline-none last:border-b-0 hover:bg-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-black"
                >
                  <Cell className={`${bodyCell} font-semibold`}>{record.fields.title}</Cell>
                  <Cell className={`${bodyCell} whitespace-nowrap`}>{record.fields.startDate}</Cell>
                  <Cell className={bodyCell}>{record.fields.place}</Cell>
                  <Cell className={`${bodyCell} text-center`}>
                    <IconLink
                      href={record.fields.facebookLink}
                      label={`Facebook: ${record.fields.title}`}
                    >
                      <FacebookIcon />
                    </IconLink>
                  </Cell>
                  <Cell className={`${bodyCell} text-center`}>
                    <IconLink
                      href={record.fields.instagramLink}
                      label={`Instagram: ${record.fields.title}`}
                    >
                      <InstagramIcon />
                    </IconLink>
                  </Cell>
                  <Cell className={`${bodyCell} text-center`}>
                    <IconLink
                      href={record.fields.folderLink}
                      label={`Priečinok: ${record.fields.title}`}
                    >
                      <FolderOpen aria-hidden className="size-5" />
                    </IconLink>
                  </Cell>
                </Row>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p aria-live="polite" className="text-sm text-muted">
            {matching.length === 0
              ? 'Žiadne podujatia'
              : `${firstIndex + 1}–${firstIndex + visible.length} z ${matching.length}`}
          </p>
          {pageCount > 1 ? (
            <nav aria-label="Stránkovanie" className="flex items-center gap-3">
              <Button
                aria-label="Predchádzajúca strana"
                isDisabled={currentPage === 1}
                onPress={() => setPage(currentPage - 1)}
                className={`${secondaryButton} disabled:cursor-not-allowed`}
              >
                <ChevronLeft aria-hidden className="size-4" />
              </Button>
              <span className="text-sm font-semibold">
                Strana {currentPage} z {pageCount}
              </span>
              <Button
                aria-label="Ďalšia strana"
                isDisabled={currentPage === pageCount}
                onPress={() => setPage(currentPage + 1)}
                className={`${secondaryButton} disabled:cursor-not-allowed`}
              >
                <ChevronRight aria-hidden className="size-4" />
              </Button>
            </nav>
          ) : null}
        </div>

        <SheetLink href={sheetUrl} className="self-end">
          Zdrojová tabuľka
        </SheetLink>

        <EventRecordDialog
          target={dialogTarget}
          record={openRecord}
          canEdit={canEdit}
          onTargetChange={setTarget}
        />
      </div>
    </I18nProvider>
  )
}

export default EventsOverview
