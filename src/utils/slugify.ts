/**
 * "Letný tábor 2027!" -> "letny-tabor-2027"
 */
export const slugify = (value: string) =>
  // eslint-disable-next-line sonarjs/null-dereference
  value
    .normalize('NFD')
    .replaceAll(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join('-')
