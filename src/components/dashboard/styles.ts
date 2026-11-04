/** Shared looks of the dashboard's controls, after the buttons of the main site */

const focusRing =
  'focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-black'

export const primaryButton = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-2.5 font-semibold transition-colors hover:bg-brand-dark disabled:cursor-wait disabled:opacity-60 ${focusRing}`

export const secondaryButton = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border-2 border-black/10 bg-white px-4 py-2 font-semibold transition-colors hover:border-brand disabled:cursor-wait disabled:opacity-60 ${focusRing}`

export const dangerButton = `inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl px-4 py-2 font-semibold text-[#a11b1b] transition-colors hover:bg-[#a11b1b]/10 disabled:cursor-wait disabled:opacity-60 ${focusRing}`

export const textInput =
  'block min-h-11 w-full rounded-xl border-2 border-black/15 bg-white px-3 text-base text-ink transition-colors focus:border-brand-dark focus:outline-none aria-invalid:border-[#a11b1b]'

export const fieldLabel = 'block text-sm font-semibold'
