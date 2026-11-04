import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

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
    remotePatterns: [
      // TODO: Temporary – the homepage and mock events reuse images from the current WordPress site
      {
        protocol: 'https',
        hostname: 'www.skautskyinstitut.sk',
        pathname: '/wp-content/uploads/**',
      },
      // Google Drive – direct image URLs of publicly shared files
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/uc',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        pathname: '/thumbnail',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '/d/**',
      },
    ],
  },
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
