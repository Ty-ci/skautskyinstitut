# Project Brief: Events Website (Next.js + Payload CMS on Netlify)

> Purpose of this file: bootstrap a bare repository with Claude Code.
> Read the whole brief before scaffolding. Items marked **[DECIDED]** are fixed;
> items marked **[PROPOSED]** are defaults to implement unless I say otherwise;
> items marked **[OPEN]** need my input before implementation — ask first.

## Goal

A website that lists upcoming events (currently promoted on the Facebook page
`facebook.com/sinaslovensku/events`), with a CMS for editors, subscription options
for visitors, and optional automated sharing of new events to Facebook and Instagram.

## Hard constraints

- **Cost: free tier everywhere at the start.** Prefer services that pause or cap
  rather than bill overages. Flag any step that could incur cost.
- **Hosting: Netlify** (I always stay within its free tier). No separate always-on server.
- Keep the setup simple and maintainable by one developer.

## Stack

| Concern | Choice | Status |
|---|---|---|
| Framework | Next.js (App Router, TypeScript) | [DECIDED] |
| CMS | Payload CMS 3, **in the same Next.js project** | [DECIDED] |
| Hosting | Netlify | [DECIDED] |
| Database | Postgres on Neon, **pooled connection string** | [PROPOSED] |
| Media storage | Cloudflare R2 via `@payloadcms/storage-s3` (`region: 'auto'`) | [PROPOSED] |
| Rich text | Lexical (Payload default) | [PROPOSED] |

## Architecture

- Scaffold with `npx create-payload-app@latest` (blank template, PostgreSQL adapter).
- Route groups:
  - `src/app/(frontend)/` — public site, its own root layout
  - `src/app/(payload)/` — admin panel + `/api` (generated, don't edit)
- Frontend reads content via Payload's **Local API** (`getPayload({ config })`) in
  Server Components — no HTTP calls to our own API.
- Pages are statically rendered and refreshed on demand: collection `afterChange`
  and `afterDelete` hooks call `revalidatePath` / `revalidateTag`. No full rebuilds
  on content edits.
- Local API bypasses access control by default — use `overrideAccess: false` + `user`
  whenever querying on behalf of a logged-in user.

## Data model (initial)

**Events** [PROPOSED]
- `title` (text, required)
- `slug` (text, unique, derived from title)
- `start` (date + time, required), `end` (date + time, optional)
- `place` (text)
- `description` (rich text)
- `cover` (upload → media)
- `shareToSocial` (checkbox, default false)
- `fbPostId`, `igPostId` (text, read-only in admin; used to prevent duplicate posts)
- Drafts enabled; frontend queries must filter `_status: 'published'`.
- Public read access for published events only.

**Media** — standard Payload upload collection, stored in R2.

**Users** — Payload auth for editors/admins.

## Features by phase

### Phase 1 — Foundation [DECIDED]
1. Scaffold Payload + Next.js, connect Neon, configure R2 media.
2. Events collection as above.
3. Frontend: upcoming events list (sorted by `start`, only future events) and
   event detail page (`/events/[slug]`).
4. On-demand revalidation hooks.
5. Deploy the minimal project to Netlify **early** to catch runtime issues
   (function size, timeouts) before building features.

### Phase 2 — Visitor notifications [PROPOSED]
1. **ICS calendar feed** at `/events.ics` (static, regenerated on revalidation),
   with a "Subscribe to calendar" link (`webcal://`). Use the `ics` package.
2. **Weekly email digest of upcoming events**: subscribers stored in the email
   provider's list (not in our DB), double opt-in handled by the provider.
   Sending triggered by a Netlify Scheduled Function reading events via the Local API.
   - [OPEN] Email provider (candidates: MailerLite, Brevo, Resend).
3. Web push — out of scope for now (iOS requires the site installed as a PWA).

### Phase 3 — Social sharing [OPEN]
Automatically post new published events to Facebook and Instagram when
`shareToSocial` is ticked and the post IDs are empty.
- Facebook: `POST /{page-id}/photos` with image URL + caption (Graph API).
  Note: creating real Facebook **Events** via the API is not possible; only posts.
- Instagram: two-step publish — `POST /{ig-user-id}/media` then `/media_publish`.
  Image must be at a public URL (R2). No clickable links in captions.
- Run in a Payload hook with try/catch (never block saving), ideally via
  Payload Jobs Queue for retries. Store returned post IDs.
- Requires a Meta app, a long-lived Page access token, and an IG Business/Creator
  account linked to the Page.
- [OPEN] Do I have admin access to the Facebook page? If not, this phase is blocked.
- [OPEN] Custom integration vs. no-code tool (Buffer / Make / Zapier).

### Not planned
- Importing events *from* Facebook — the Graph API only allows reading events of
  pages you administer, and even then availability is unreliable. CMS is the
  source of truth; Facebook is a downstream channel.

## Environment variables

```
DATABASE_URI=            # Neon pooled connection string
PAYLOAD_SECRET=          # openssl rand -hex 32
NEXT_PUBLIC_SERVER_URL=  # public site URL
S3_BUCKET=
S3_ENDPOINT=             # https://<account-id>.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
# Phase 3 only:
FB_PAGE_ID=
FB_PAGE_TOKEN=
IG_USER_ID=
```

Provide a `.env.example` with these keys and no values.

## Database migrations

- Dev: Payload's schema push is fine against a **local/dev** database only.
- Production: `npx payload migrate:create` for schema changes; Netlify build
  command runs `payload migrate && next build`.
- Never point the local dev server at the production database.

## Working style

- Work iteratively: propose a plan per phase, wait for my confirmation, then implement.
- Prefer practical, minimal solutions; explain trade-offs briefly when choosing.
- Ask before adding any paid service or extra dependency beyond those listed.
- Site content and UI language: [OPEN] (likely Slovak).
