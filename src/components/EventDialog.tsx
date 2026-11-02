'use client'

import Image from 'next/image'
import { useEffect, useId, useRef } from 'react'

import EventActions from '@/components/EventActions'
import EventBadges from '@/components/EventBadges'
import Markdown from '@/components/Markdown'
import type { EventStatus, SiteEvent } from '@/services/events'

interface Props {
  /** The event to show; the dialog is closed without one */
  event: SiteEvent | undefined
  status: EventStatus
  /** Called whenever the dialog closes: close button, Escape or a click on the backdrop */
  onClose: () => void
}

/** All there is to an event, in a modal over the homepage */
const EventDialog = ({ event, status, onClose }: Props) => {
  const titleId = useId()
  const dialogRef = useRef<HTMLDialogElement>(null)

  // A `<dialog>` is only modal when opened by `showModal`, so it can't be driven by an attribute
  useEffect(() => {
    const dialog = dialogRef.current
    if (event && dialog && !dialog.open) {
      dialog.showModal()
    } else if (!event && dialog?.open) {
      dialog.close()
    }
  }, [event])

  return (
    // Escape is handled by the dialog itself; the click only adds closing by the backdrop
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      onClose={onClose}
      // The content fills the whole dialog, so a click on the dialog itself is one on the backdrop
      onClick={(clickEvent) => {
        if (clickEvent.target === clickEvent.currentTarget) {
          clickEvent.currentTarget.close()
        }
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-2xl overflow-hidden rounded-2xl bg-white p-0 text-ink shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)] backdrop:bg-black/60"
    >
      {event ? (
        // Scrolls inside, so the backdrop stays put
        <article className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
          {/* Sticks to the top of the scrolled content: stays in view, but clear of the scrollbar */}
          <div className="sticky top-0 z-10 h-0">
            <button
              type="button"
              onClick={() => dialogRef.current?.close()}
              aria-label="Zavrieť"
              className="absolute top-3 right-3 flex size-9 cursor-pointer items-center justify-center rounded-full text-white/90 shadow-md transition-colors hover:bg-white/20"
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
          {event.coverUrl ? (
            <div className="relative aspect-video">
              {/* Covers can live on any host (Facebook, Drive, …), so they skip the image optimizer */}
              <Image src={event.coverUrl} alt="" fill unoptimized className="object-cover" />
            </div>
          ) : null}
          <div className="flex flex-col items-start gap-4 p-5 sm:p-6">
            <EventBadges event={event} status={status} />
            <header className="flex flex-col gap-1 pr-10">
              <h2 id={titleId} className="text-3xl/tight">
                {event.title}
              </h2>
              {event.place ? <p className="text-muted">{event.place}</p> : null}
            </header>
            <EventActions event={event} isPast={status === 'past'} />
            {event.description ? <Markdown source={event.description} /> : null}
          </div>
        </article>
      ) : null}
    </dialog>
  )
}

export default EventDialog
