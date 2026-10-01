import { prettierBase } from '@bratislava/eslint-config-next'

export default {
  ...prettierBase,
  plugins: ['prettier-plugin-tailwindcss'],
  tailwindFunctions: ['cx', 'classnames', 'clsx', 'cn', 'twMerge', 'tw'],
  tailwindStylesheet: './src/app/(frontend)/globals.css',
}
