# Skautský inštitút – events website

Next.js (App Router) + Payload CMS 3 in one project, deployed to Netlify.
Postgres on Neon, media on Cloudflare R2. See [PROJECT_BRIEF_1.md](PROJECT_BRIEF_1.md).

## Local development

Requirements: Node 22 (see `.nvmrc`), Yarn 4 (`corepack enable`).

1. `cp .env.example .env` and fill in the values.
   - `DATABASE_URI`: a Neon **dev** branch, or local Postgres via `docker compose up -d`
     (`postgresql://postgres:postgres@127.0.0.1:5432/skautskyinstitut`).
     Never point the local dev server at the production database.
   - Leave `S3_*` empty to store uploads locally in `./media`.
2. `yarn install`
3. `yarn dev` and open http://localhost:3000 (admin: http://localhost:3000/admin).

In dev, Payload pushes schema changes to the database automatically.

## Scripts

| Script                        |                                                                      |
| ----------------------------- | -------------------------------------------------------------------- |
| `yarn dev`                    | dev server                                                           |
| `yarn build`                  | production build                                                     |
| `yarn lint` / `yarn lint:fix` | ESLint (`@bratislava/eslint-config-next`)                            |
| `yarn typecheck`              | TypeScript check                                                     |
| `yarn generate:types`         | regenerate `src/payload-types.ts` after changing collections         |
| `yarn generate:importmap`     | regenerate the admin import map after adding custom admin components |
| `yarn payload migrate:create` | create a migration after a schema change                             |

## Deployment (Netlify)

Build command (`netlify.toml`): `yarn build:netlify` = `payload migrate && next build`.
Set all variables from `.env.example` in Netlify site settings.
Schema changes reach production only via migrations in `src/migrations`.
