# HTTPMAKER

HTTPMAKER is a Next.js visual website builder with authenticated projects,
versioned WebsiteJSON editing, server-backed image assets, immutable publication
snapshots, static ZIP/GitHub export, and a deterministic mock AI proposal flow.

## Supported workflow

1. Sign in with GitHub OAuth.
2. Create or open an owned project.
3. Edit the database-backed draft and upload images.
4. Preview the latest confirmed draft at `/preview/[projectId]`.
5. Publish a validated snapshot to `/sites/[slug]`.
6. Continue editing without changing the live snapshot, then republish or
   unpublish explicitly.

Only `/sites/[slug]` is a public project-content read. Project, preview, asset,
AI, Maps, publication, and GitHub management routes require an authenticated
user and derive ownership from `session.user.id`.

## Technology

- Next.js 15.5.23 App Router, React 19.1.2, TypeScript
- Auth.js GitHub OAuth with database sessions
- PostgreSQL, Prisma 7.9.1 and `@prisma/adapter-pg`
- Zod WebsiteJSON validation
- Vercel Blob behind a server-only storage adapter
- Per-user GitHub App installations through Octokit
- Vitest plus the existing deterministic Node test suites

## Configuration

Copy `.env.example` to `.env` and configure:

```dotenv
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/httpmaker"
HTTPMAKER_AI_PROVIDER="mock"
AUTH_SECRET="a-random-secret-at-least-32-characters"
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
BLOB_READ_WRITE_TOKEN=""

GITHUB_APP_ID=""
GITHUB_APP_SLUG=""
GITHUB_APP_PRIVATE_KEY=""
GITHUB_APP_PRIVATE_KEY_PATH=""
GITHUB_APP_STATE_SECRET=""
GITHUB_APP_WEBHOOK_SECRET=""
```

Use either `GITHUB_APP_PRIVATE_KEY` or `GITHUB_APP_PRIVATE_KEY_PATH`, never both
unless there is a deliberate local fallback. Secrets are server-only and must be
configured through the deployment provider rather than committed.

### GitHub OAuth

Configure the OAuth callback as:

```text
https://YOUR_HOST/api/auth/callback/github
```

Only GitHub OAuth is implemented. There is no email/password or Google login.

### Per-user GitHub App

The GitHub App needs repository **Contents: read and write** permission. Configure
its setup URL as:

```text
https://YOUR_HOST/api/github/installations/callback
```

Configure its webhook URL as:

```text
https://YOUR_HOST/api/github/webhook
```

The connection flow creates signed, expiring, single-use state tied to the
signed-in user. The callback verifies the installation with GitHub before it is
stored. Installation IDs are unique across HTTPMAKER users. Repository listing,
linking, commit reads, and pushes re-check the user-owned active installation and
stable GitHub repository ID. Installation access tokens are generated only by
Octokit on the server and are never stored or returned to the browser.

Existing legacy `repositoryUrl` values are retained by migration but are not
trusted or attached automatically. Owners must relink them through an owned
installation.

## Database

Start the included PostgreSQL service if desired:

```bash
docker compose up -d postgres
```

Generate the client and apply committed migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

`Project.website` is the mutable draft. `publishedWebsite` is a separately
serialized validated snapshot. `slug` is nullable and globally unique;
`isPublished` controls public visibility, and `publishedAt` records the most
recent successful publication.

## Image assets

New JPEG, PNG, WebP, and GIF uploads are authenticated, magic-byte checked,
limited to 10 MB, stored in Vercel Blob using random keys, and recorded in the
database with user/project ownership. WebsiteJSON stores the resulting HTTPS
URL. Blob credentials never enter client code.

Older IndexedDB images remain available as `asset://` references. The editor's
**Upload local assets** action uploads each unique local image, replaces every
matching reference, and saves after each successful replacement. It is safe to
retry after partial failure and retains the original local copies. Publication
stays blocked while any unresolved local reference remains.

Deleting an image that is used by an owned draft or published snapshot returns
`409`. Remote deletion occurs before database deletion; failures retain the
database record for retry. Project deletion explicitly removes related remote
objects before deleting database records and reports partial failures.

## Autosave, preview and publishing

Autosave is debounced. Starting a newer save aborts the previous request, and a
revision coordinator prevents stale success/failure responses from changing the
current status. Failed work stays in browser recovery storage and exposes a
Retry action.

- `/preview` is the labeled legacy browser-storage preview.
- `/preview/[projectId]` is authenticated and renders the owned database draft.
- `/sites/[slug]` is public and renders only a valid published snapshot.
- `POST /api/projects/[projectId]/publish` validates the current database draft,
  slug and unresolved assets before atomically replacing the snapshot.
- `DELETE /api/projects/[projectId]/publish` hides the public site while retaining
  its last snapshot and slug.

## Security boundaries

- Website strings and collections are bounded.
- Colors use strict hex/RGB/HSL/approved-variable parsing; injected CSS grammar,
  braces, comments, `url()` and trailing tokens are rejected.
- Image and link protocols use explicit allowlists.
- JSON and multipart routes enforce body limits.
- AI and Maps require authentication and use a fail-closed in-memory rate-limit
  adapter. This adapter is process-local and must be replaced with distributed
  storage for globally consistent serverless limits.
- Maps resolves only secure `maps.app.goo.gl` inputs and returns bounded generic
  errors.
- AI remains the deterministic mock provider; no arbitrary AI HTML or React is
  evaluated.

## Development and verification

```bash
npm ci
npx prisma generate
npx prisma validate
npx prisma migrate deploy
npm run typecheck
npm test
npm run build
npm audit --omit=dev
npm run check
```

`npm run check` generates Prisma Client, validates the schema, type-checks from a
fresh-clone-safe configuration, runs all deterministic tests, and performs the
production build. CI additionally starts an isolated PostgreSQL service and
applies all committed migrations before verification.

Run locally with:

```bash
npm run dev
```

## Deployment checklist

1. Create the production PostgreSQL database and Vercel Blob store.
2. Configure GitHub OAuth and the GitHub App setup/webhook URLs.
3. Add all environment variables through the hosting provider.
4. Run `npx prisma migrate deploy` as a controlled release step.
5. Build and deploy.
6. Run the smoke test below with two separate users.
7. Inspect sanitized logs and verify that no secrets, signatures, tokens, or
   private payloads appear.

## Manual smoke test

1. User A signs in, creates a project, uploads and selects an image.
2. Reload and confirm the draft and HTTPS image persisted.
3. Migrate a legacy local image and confirm its IndexedDB copy remains.
4. Preview the latest confirmed database draft.
5. Publish and open `/sites/[slug]` signed out.
6. Edit the draft and confirm the live snapshot is unchanged.
7. Republish, then unpublish and confirm the public route returns not found.
8. Confirm User B cannot access User A's private project, preview, assets,
   publication endpoints, installations, or repositories.
9. User A connects a GitHub App installation, selects a repository, confirms a
   push, and verifies that only generated static files changed.
10. Disconnect, suspend, or delete the installation and confirm later reads and
    pushes are blocked.

## Current limitations

- Production deployment and live provider smoke tests require the operator's own
  PostgreSQL, Vercel Blob, OAuth and GitHub App credentials.
- The rate limiter is not globally consistent across serverless instances.
- Custom domains, billing, collaborative editing, arbitrary user HTML/JavaScript,
  and real AI providers are outside the current scope.
