import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import { sk } from '@payloadcms/translations/languages/sk'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Events } from './collections/Events/Events'
import { Media } from './collections/Media'
import { Users } from './collections/Users'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Fail fast with one clear message instead of Payload's secret error followed by an opaque
// Postgres connection error (e.g. on Netlify, where the variables must be set in site settings)
const requiredEnv = {
  PAYLOAD_SECRET: process.env.PAYLOAD_SECRET,
  DATABASE_URI: process.env.DATABASE_URI,
}
const missingEnv = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([name]) => name)
if (missingEnv.length > 0) {
  throw new Error(
    `Missing environment variables: ${missingEnv.join(', ')}. See .env.example for the full list.`,
  )
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    dateFormat: 'd. M. yyyy HH:mm',
    meta: {
      titleSuffix: ' – Skautský inštitút',
    },
  },
  i18n: {
    supportedLanguages: { sk },
    fallbackLanguage: 'sk',
  },
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  collections: [Events, Media, Users],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      // Neon: use the pooled connection string (host contains `-pooler`)
      connectionString: process.env.DATABASE_URI || '',
    },
    migrationDir: path.resolve(dirname, 'migrations'),
  }),
  sharp,
  plugins: [
    // Cloudflare R2 (S3-compatible). Disabled when S3_BUCKET is not set,
    // in which case uploads are stored on local disk (./media) - fine for local dev only.
    s3Storage({
      enabled: Boolean(process.env.S3_BUCKET),
      collections: {
        media: true,
      },
      bucket: process.env.S3_BUCKET || '',
      config: {
        endpoint: process.env.S3_ENDPOINT,
        region: 'auto',
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
      },
    }),
  ],
})
