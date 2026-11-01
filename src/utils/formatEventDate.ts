// Netlify functions run in UTC, so the time zone must be explicit
const dateTimeFormat = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Bratislava',
})

/**
 * "15. októbra 2026 o 18:00" or a range, e.g. "15. októbra 2026 o 18:00 – 20:00"
 */
export const formatEventDate = (start: string, end?: string | null) =>
  end
    ? dateTimeFormat.formatRange(new Date(start), new Date(end))
    : dateTimeFormat.format(new Date(start))
