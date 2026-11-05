import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { ROUTES } from './src/utils/routes'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  experimental: {
    // Unmatched URLs get the site's 404 page (see `src/app/global-not-found.tsx`)
    globalNotFound: true,
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    // TODO: Temporary – the homepage and mock events reuse images from the current WordPress site
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'www.skautskyinstitut.sk',
        pathname: '/wp-content/uploads/**',
      },
    ],
  },
  // Temporary, so browsers don't remember it: the site has no homepage of its own yet
  redirects: () =>
    Promise.resolve([{ source: ROUTES.home, destination: ROUTES.events, permanent: false }]),
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
