// Netlify functions run in UTC, so the time zone must be explicit
const dateTimeFormat = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Bratislava',
})

const dateFormat = new Intl.DateTimeFormat('sk-SK', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Europe/Bratislava',
})

/**
 * "15. októbra 2026 o 18:00" or a range, e.g. "15. októbra 2026 o 18:00 – 20:00".
 * Without time: "5. decembra 2026" or "5. – 19. decembra 2026".
 */
export const formatEventDate = (start: string, end?: string | null, hasTime = true) => {
  const format = hasTime ? dateTimeFormat : dateFormat

  return end ? format.formatRange(new Date(start), new Date(end)) : format.format(new Date(start))
}
