# HTTPMAKER

HTTPMAKER is a visual website builder for creating and managing single-page websites without manually writing all of their code. It combines GitHub authentication, a database-backed project dashboard, a structured visual editor, browser previews, ZIP source export, and an experimental GitHub repository commit workflow.

The current editor supports selectable and editable sections, design presets, theme controls, responsive preview widths, image handling, and undo/redo history. Website documents are validated structured JSON, rather than only raw HTML.

> HTTPMAKER is under active development and should be treated as an early-stage application. Some controls and integrations are experimental or development-only.

## Screenshots

Screenshots and demonstrations will be added as the interface stabilizes.

## Current features

### Authentication and users

- GitHub OAuth sign-in is implemented with Auth.js and the Prisma adapter.
- Auth.js uses database sessions stored through Prisma.
- `/dashboard` and `/editor` perform server-side session checks and redirect unauthenticated users to `/login`.
- Project, profile, and GitHub API handlers independently require an authenticated session where appropriate.
- The session callback adds the database user ID to `session.user.id`.

Only GitHub is configured as an authentication provider. The email and password fields visible on the login page do not currently submit credentials, and Google OAuth is not implemented. Authentication is configured in [`auth.ts`](auth.ts), with the Auth.js route in [`app/api/auth/[...nextauth]/route.ts`](app/api/auth/%5B...nextauth%5D/route.ts).

### Project management

Authenticated users can create, list, open, update, and delete projects from the dashboard. New projects start with the validated default website document. Each project belongs to one user, and repository operations scope reads, updates, and deletes by both project ID and the authenticated owner ID.

Projects persist in PostgreSQL through Prisma and include creation and update timestamps. The schema also contains publication-status metadata, but this README does not describe a publishing workflow.

### Visual editor

The editor currently provides:

- Selection and inline editing of supported website elements.
- Layers, properties, design preset, and theme panels.
- Section duplication, removal, reordering, variant changes, height changes, and background controls.
- Text, button, link, image, layout, animation, and per-element style controls where supported by a block.
- Luxury and brutalist section variants.
- Navbar, hero, about, carousel, features, contact, and footer blocks.
- Desktop, tablet, and mobile canvas widths, plus a full-page preview.
- Undo and redo buttons and keyboard shortcuts, with grouped history entries.
- A validated JSON editing view and a generated-code preview.
- Debounced project autosave with `Saving…`, `All changes saved`, and `Save failed` states.

Image assets accept JPEG, PNG, WebP, and GIF files up to 10 MB. They are stored per user in the browser's IndexedDB database and referenced from website JSON as `asset://...` identifiers. This is development-oriented browser storage, not shared server-side object storage. Profile images are separately stored as Base64 data URLs in the user record and are limited by the profile API.

The editor also contains experimental structured-change UI. Detailed provider setup is intentionally outside this README's scope.

### Preview

`/preview` reads the current browser-stored website and resolves IndexedDB image assets after checking the current profile session in the client. `/sites/preview` is a separate development preview that reads browser storage directly. Neither is a dynamic, database-backed public website route.

### ZIP export

The editor can generate and download `httpmaker-website.zip`. The exporter converts website JSON into:

- `index.html`
- `styles.css`
- `website.json`
- an export-specific `README.md`
- local `assets/` files for supported embedded data-URL images

The output is a static representation of the supported schema. Some rich editor properties and specialized block behavior may not be reproduced exactly, so review the archive before using it elsewhere.

### GitHub integration (experimental)

The dashboard can:

- List repositories visible to one configured GitHub App installation.
- Save or remove a repository URL on an owned project.
- Read the latest commit from a linked repository.
- Generate the static website files and commit them to the repository's default branch.

The commit operation reads repository metadata, refs, commits, and trees, then creates a tree and commit and updates the branch ref. The GitHub App therefore needs **Contents: read and write**; GitHub supplies **Metadata: read-only**. The code uses GitHub App installation authentication, not the user's GitHub OAuth access token.

> Current limitation: all repository operations use one global `GITHUB_APP_INSTALLATION_ID`. Per-user installation management is not implemented.

### Validation and safety boundaries

- Zod validates project parameters, create/update bodies, website documents, sections, themes, and element styles.
- Website objects use a strict versioned schema and are validated when loaded, updated, edited as JSON, exported to GitHub, and restored from browser storage.
- Project repository functions are server-only and scope mutations by the authenticated owner.
- API handlers reject invalid JSON and return explicit 4xx responses for invalid input.
- Internal structured-change proposals have separate validation and permission checks.

These layers reduce accidental invalid state; they are not a claim that the early-stage application has completed a security review.

## Technology stack

Versions are taken from [`package.json`](package.json).

| Category | Technology |
| --- | --- |
| Framework | Next.js 15.3.3 (App Router) |
| Language | TypeScript 5.7.3 |
| UI | React 19.1.0 |
| Styling | Tailwind CSS 3.4.15, CSS modules, and global CSS |
| Animation | GSAP 3.12.5 and Lenis 1.1.0 |
| Database | PostgreSQL 17 in the provided Docker setup |
| ORM | Prisma 7.8.0 with the PostgreSQL driver adapter |
| Authentication | Auth.js / NextAuth 5 beta with the Prisma adapter |
| Validation | Zod 4.4.3 |
| ZIP generation | JSZip 3.10.1 |
| GitHub | Octokit 5.0.5 and GitHub App installation authentication |
| Testing | Repository-specific Node.js deterministic test scripts |
| Local infrastructure | Docker Compose |

## Application architecture

```text
Browser
   ↓
Next.js pages and React client components
   ↓
API route handlers and server-only repositories
   ↓
Session, ownership, and Zod validation
   ↓
Prisma ORM
   ↓
PostgreSQL
```

GitHub operations follow a separate server-side path:

```text
Authenticated user action
   ↓
HTTPMAKER API route
   ↓
GitHub App installation client
   ↓
Linked GitHub repository
```

Website content is a versioned JSON document containing theme data and ordered sections. This representation supports validation, editor manipulation, history, persistence, preview rendering, and export.

## Project structure

```text
httpmaker/
├── app/
│   ├── api/
│   ├── dashboard/
│   ├── editor/
│   ├── login/
│   ├── preview/
│   └── sites/preview/
├── components/
│   ├── editor/
│   └── website-sections/
├── data/
├── docs/
├── features/projects/
├── hooks/
├── lib/
│   └── github/
├── presets/
├── prisma/
│   ├── migrations/
│   ├── schema.prisma
│   └── seed.ts
├── public/
├── renderer/
├── schemas/
├── scripts/
├── services/
├── tests/
├── types/
├── utils/
├── auth.ts
├── docker-compose.yml
├── next.config.ts
├── package.json
└── prisma.config.ts
```

- `app/` contains App Router pages, layouts, and API route handlers.
- `components/` contains reusable interface and website-section components.
- `features/projects/` contains project validation and server-only persistence logic.
- `schemas/` and `types/` define the website document contract.
- `renderer/` turns website JSON into the editable and preview interfaces.
- `utils/` contains browser storage, image assets, normalization, validation, and ZIP export utilities.
- `prisma/` contains the database schema, migrations, and development seed.
- `scripts/` contains the test runners invoked by npm scripts.
- `tests/` contains deterministic fixtures and validation cases.
- `docs/` contains focused technical notes, including the website schema and manual history tests.

## Database model

The Prisma schema defines `User`, `Account`, `Session`, `VerificationToken`, and `Project`.

```text
User 1 ─── many Accounts
User 1 ─── many Sessions
User 1 ─── many Projects
```

Auth.js uses `Account`, `Session`, and `VerificationToken`. Deleting a user cascades to that user's accounts, sessions, and projects.

Important `Project` fields are:

| Field | Purpose |
| --- | --- |
| `id` | CUID primary key |
| `name` | Project display name |
| `website` | Structured website data stored as PostgreSQL JSON/JSONB through Prisma |
| `repositoryUrl` | Optional linked GitHub repository URL |
| `ownerId` | Required relation to the owning user |
| `isPublished` | Boolean metadata, defaulting to `false` |
| `publishedAt` | Optional publication timestamp metadata |
| `createdAt` | Creation timestamp |
| `updatedAt` | Automatically updated timestamp |

There is no separate GitHub database table; the current integration stores only `Project.repositoryUrl` and reads the installation ID from server configuration.

## Prerequisites

- Node.js **20.19 or newer**. Prisma 7.8 requires Node 20.19+, 22.12+, or 24+.
- npm (the repository contains `package-lock.json`).
- Git.
- Docker Desktop or another Docker Compose-compatible runtime, unless PostgreSQL is installed separately.
- A GitHub OAuth app for sign-in.
- Optionally, a GitHub App for repository integration.

## Local installation

### 1. Clone and install

```bash
git clone https://github.com/plavovic/httpmaker.git
cd httpmaker
npm ci
```

Use `npm ci` for the lockfile's exact dependency graph. Use `npm install` when intentionally updating dependencies.

### 2. Configure environment variables

macOS or Linux:

```bash
cp .env.example .env
```

Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Use this local database URL with the provided Docker Compose ports:

```env
DATABASE_URL="postgresql://httpmaker:httpmaker_dev_password@localhost:5433/httpmaker?schema=public"
HTTPMAKER_AI_PROVIDER=mock
AUTH_SECRET="replace-with-a-random-local-secret"
AUTH_GITHUB_ID="your-github-oauth-client-id"
AUTH_GITHUB_SECRET="your-github-oauth-client-secret"
```

`DATABASE_URL`, `AUTH_SECRET`, `AUTH_GITHUB_ID`, and `AUTH_GITHUB_SECRET` are required for the database and implemented GitHub sign-in flow. `HTTPMAKER_AI_PROVIDER=mock` is the repository's safe deterministic development value; external provider configuration is outside this README's scope.

Optional GitHub repository integration uses:

```env
GITHUB_APP_ID="your-github-app-id"
GITHUB_APP_INSTALLATION_ID="positive-integer-installation-id"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

Instead of `GITHUB_APP_PRIVATE_KEY`, the application also accepts a development file path relative to the repository root:

```env
GITHUB_APP_PRIVATE_KEY_PATH="secrets/your-private-key.pem"
```

The inline key parser converts literal `\n` sequences to line breaks. Never commit either the PEM file or its contents.

> The current `.env.example` does not contain `DATABASE_URL` or the optional GitHub App variables used by the source code.

## Local PostgreSQL with Docker

The Compose service is named `postgres`, maps host port `5433` to container port `5432`, and persists data in the named `httpmaker_postgres_data` volume.

```bash
docker compose up -d
docker compose ps
docker compose logs postgres
```

Stop the service without deleting its data:

```bash
docker compose down
```

> Warning: the following command deletes the local PostgreSQL volume and all local development data.

```bash
docker compose down -v
```

## Prisma setup

Generate Prisma Client and apply existing migrations:

```bash
npx prisma generate
npx prisma migrate deploy
```

`migrate deploy` applies committed migrations without creating a new one. During active schema development, use:

```bash
npx prisma migrate dev
```

Seed the development user and two sample projects:

```bash
npx prisma db seed
```

The seed command is configured in `prisma.config.ts` and runs `tsx prisma/seed.ts`. The seeded user is not a credentials-login account; normal UI access still uses GitHub OAuth.

Open Prisma Studio, a local database browser:

```bash
npx prisma studio
```

To create a migration after editing the schema:

```bash
npx prisma migrate dev --name add_example_field
```

Choose a migration name that describes the change.

## Running the application

Start PostgreSQL first, ensure Prisma Client has been generated, then run:

```bash
npm run dev
```

Open <http://localhost:3000>. To verify a local production build (not deploy it):

```bash
npm run build
npm run start
```

## Authentication setup

### GitHub OAuth sign-in

GitHub OAuth signs users into HTTPMAKER. Create a GitHub OAuth app and configure its local authorization callback URL as:

```text
http://localhost:3000/api/auth/callback/github
```

Put its client ID and secret in `AUTH_GITHUB_ID` and `AUTH_GITHUB_SECRET`. Generate a local Auth.js secret with Node.js:

```bash
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"
```

The dashboard page and editor layout perform server-side redirects. Project and integration APIs also call `auth()` and derive ownership from `session.user.id`; they do not accept an `ownerId` from the browser.

### GitHub App repository access

GitHub OAuth and the GitHub App have separate jobs:

- GitHub OAuth authenticates the HTTPMAKER user.
- Installing the GitHub App grants server-side access to selected repositories.

Create a GitHub App with **Contents: read and write** repository permission and install it on the repositories used for local testing. Configure `GITHUB_APP_ID`, one private-key source, and the numeric `GITHUB_APP_INSTALLATION_ID`. The current code does not implement a GitHub App callback or setup route; installation is configured manually in GitHub and the environment.

> Never commit a GitHub App private key, OAuth secret, Auth.js secret, or populated `.env` file.

## Available routes

### Pages

| Route | Purpose | Authentication |
| --- | --- | --- |
| `/` | Marketing landing page | No |
| `/login` | GitHub sign-in page | No |
| `/dashboard` | List and manage owned projects | Server-side session required |
| `/editor?projectId=...` | Edit an owned database project; without the query it uses browser-stored data | Server-side session required |
| `/preview` | Preview browser-stored editor data | Client profile check |
| `/sites/preview` | Development browser-storage preview | No server-side guard |

### API routes

| Method | Route | Purpose | Authentication |
| --- | --- | --- | --- |
| GET, POST | `/api/auth/*` | Auth.js handlers | Managed by Auth.js |
| GET | `/api/projects` | List the signed-in user's projects | Required |
| POST | `/api/projects` | Create a project | Required |
| GET | `/api/projects/[projectId]` | Read one owned project | Required |
| PATCH | `/api/projects/[projectId]` | Update name, website, or repository URL | Required |
| DELETE | `/api/projects/[projectId]` | Delete one owned project | Required |
| GET | `/api/profile` | Read the current user's basic profile | Required |
| PATCH | `/api/profile` | Update the current user's Base64 profile image | Required |
| GET | `/api/github/test-repositories` | List repositories for the configured installation | Required |
| GET | `/api/projects/[projectId]/github/test-commit` | Read the latest linked-repository commit | Required |
| POST | `/api/projects/[projectId]/github/test-commit` | Commit generated website files | Required |
| POST | `/api/maps/resolve` | Resolve a secure Google Maps short URL to an embed URL | No session check in the handler |

The route names containing `test-` reflect the GitHub integration's current development status. Internal structured-change endpoints are omitted from this README's scope.

## Project API examples

Browser requests use the current Auth.js session cookie.

### List projects

```ts
const response = await fetch("/api/projects");
if (!response.ok) throw new Error("Failed to load projects");

const { projects } = await response.json();
```

### Create a project

```ts
const response = await fetch("/api/projects", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Portfolio" }),
});

if (!response.ok) throw new Error("Failed to create project");
const { project } = await response.json();
```

Names are trimmed, required, and limited to 100 characters.

### Rename a project

```ts
const response = await fetch(`/api/projects/${projectId}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ name: "Updated portfolio" }),
});

if (!response.ok) throw new Error("Failed to update project");
```

The same endpoint accepts a validated `website` document or an HTTPS `repositoryUrl` (with an empty string removing the link).

## Website data model

A website contains schema version `1`, an optional preset ID and customization flag, one theme, and at least one ordered section. Sections have stable IDs, a supported type and variant, common content properties, and optional style, link, layout, background, navigation, and animation settings.

A simplified valid example:

```json
{
  "schemaVersion": 1,
  "theme": {
    "backgroundColor": "#ffffff",
    "surfaceColor": "#f5f5f5",
    "primaryColor": "#111111",
    "secondaryColor": "#555555",
    "accentColor": "#0057ff",
    "textColor": "#111111",
    "mutedTextColor": "#666666",
    "headingFont": "Georgia",
    "bodyFont": "Inter",
    "borderRadius": 16,
    "spacingScale": "comfortable",
    "visualDensity": "balanced",
    "imageTreatment": "natural"
  },
  "sections": [
    {
      "id": "hero-1",
      "type": "hero",
      "variant": "luxury",
      "props": {
        "title": "A clear headline",
        "subtitle": "A concise introduction.",
        "buttonText": "Start",
        "secondaryButtonText": "Learn more",
        "imageUrl": "",
        "alignment": "left",
        "statLabel": "Projects",
        "statValue": "12"
      }
    }
  ]
}
```

Structured JSON makes database persistence, validation, editor updates, undo/redo, preview rendering, ZIP generation, and schema evolution practical. See [`docs/website-data-schema.md`](docs/website-data-schema.md) for the focused schema notes.

## Editor persistence flow

```text
User edits website
        ↓
React reducer records a validated history state
        ↓
Compact asset references are saved to localStorage
        ↓
700 ms debounced PATCH for an active project
        ↓
Zod validates the request and website
        ↓
Owner-scoped Prisma update stores JSON in PostgreSQL
```

`useWebsiteHistory` holds the current website plus bounded past/future entries. Undo and redo operate locally; consecutive grouped edits can become one history step. When a project ID is present, the editor loads that owned project from the API. Every change is also copied to localStorage for preview support. A failed autosave changes the toolbar status to `Save failed`; there is currently no queued retry or conflict-resolution system.

## ZIP export flow

```text
Website JSON and resolved browser images
        ↓
Static source-file generator
        ↓
HTML, CSS, JSON, README, and optional image assets
        ↓
JSZip archive
        ↓
Browser download
```

The current generator creates framework-free static files. It escapes text placed into HTML, downloads data-URL images into `assets/`, and rewrites those image references. Review the generated output because advanced editor capabilities are only partially represented.

## Testing

The repository has three test commands:

```bash
npm run test:website-schema
npm run test:ai-stage2
npm run test:ai-stage3
```

- `test:website-schema` checks valid and invalid website documents and browser-storage recovery.
- `test:ai-stage2` runs deterministic internal structured-proposal validation tests.
- `test:ai-stage3` runs deterministic proposal application, permission, and history-oriented tests.

There is no general `npm test`, lint script, type-check script, browser integration suite, or end-to-end suite currently configured. `npm run build` is the broadest configured compile-time quality check.

Recommended future scripts (not yet configured): linting, a standalone type check, unit/API integration tests, and Playwright end-to-end tests.

## Development workflow

```bash
git checkout -b feature/example
npm ci
docker compose up -d
npx prisma generate
npx prisma migrate dev
npm run dev
```

Before committing:

```bash
npm run test:website-schema
npm run test:ai-stage2
npm run test:ai-stage3
npm run build
```

Keep new database migrations committed, and do not edit migrations already applied to shared databases. Validate API input, scope project queries to the authenticated owner, keep Prisma and integration secrets in server-only code, and never commit `.env` or private keys. Keep client rendering/storage concerns separate from server authorization and persistence.

## Common development tasks

### Add a Prisma field

1. Edit `prisma/schema.prisma`.
2. Run `npx prisma migrate dev --name descriptive_change`.
3. Run `npx prisma generate` if it was not run automatically.
4. Update Zod schemas, repository selects/writes, API responses, and UI types.
5. Consider how existing rows receive a valid value.
6. Run tests and `npm run build`.

### Add an API route

1. Add an App Router `route.ts` in the appropriate `app/api/` directory.
2. Read the server session when the operation is user-specific.
3. Validate asynchronous route params and the JSON body with Zod.
4. Check ownership using both project ID and `session.user.id`.
5. Call a server-only repository or integration function.
6. Return consistent status codes and JSON errors.
7. Handle expected external-service failures without leaking secrets.

### Add a new editor property

1. Update the appropriate schema in `schemas/` and type in `types/website.ts`.
2. Update default and preset website documents where the field is required.
3. Add a labeled history update in the editor state flow.
4. Add the control to the relevant properties or theme panel.
5. Update both `WebsiteRenderer` behavior and `utils/exportWebsiteZip.ts` if the property must export.
6. Add schema, history, and rendering tests as appropriate.

### Add a new website block

1. Extend the section type and discriminated Zod union.
2. Add valid defaults to `data/initialWebsite.ts` or the block insertion factory.
3. Add its renderer/component under `components/website-sections/`.
4. Wire selection, properties, duplication, and reordering behavior.
5. Update design presets and normalization where needed.
6. Add a corresponding static-export representation.
7. Add validation and manual editor coverage.

## Troubleshooting

### Prisma cannot connect

Confirm the container is healthy and the URL uses host port `5433`:

```bash
docker compose ps
docker compose logs postgres
```

Check the username, password, database, and port in `DATABASE_URL`. A locally installed PostgreSQL server or another container may already occupy the configured port.

### Prisma Client is outdated

```bash
npx prisma generate
```

Restart the Next.js development server afterward.

### Migration errors

```bash
npx prisma validate
npx prisma format
```

Read the migration error before changing database state. Do not delete committed migrations as a default fix.

### Port 5433 is already in use

Use your operating system's network tools or `docker ps` to identify the process/container using port 5433. Stop that service or deliberately update both the Compose mapping and `DATABASE_URL`; do not change only one side.

### Prisma Studio closes unexpectedly

Confirm the database connection, regenerate Prisma Client, inspect the terminal error, restart Studio, or try `npx prisma studio --port 5556`.

### Authentication callback errors

Check the exact GitHub OAuth callback URL, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, `AUTH_SECRET`, the local application URL, and the provider configuration in `auth.ts`.

### GitHub private-key errors

Check that the key is the GitHub App's private PEM key, matches `GITHUB_APP_ID`, contains correct line breaks, and has no accidental surrounding whitespace. For an inline environment value, use literal `\n` separators; for a file, ensure `GITHUB_APP_PRIVATE_KEY_PATH` resolves from the repository root.

### GitHub repository access fails

Confirm that the App is installed, the repository is included in installation access, the global installation ID is correct, Contents permission is read/write, and the private key belongs to the configured App ID.

### Empty JSON request errors

POST and PATCH routes that expect JSON require both a serialized body and content type:

```ts
headers: { "Content-Type": "application/json" },
body: JSON.stringify(payload),
```

### Next.js dynamic route params

In this Next.js version, the repository's route-handler context types `params` as a promise. Follow the existing pattern:

```ts
const params = await context.params;
```

## Security notes

- Never expose database credentials, Auth.js/OAuth secrets, or GitHub App private keys.
- Never trust `ownerId` supplied by the browser; derive the user from the server session.
- Scope project reads and mutations by project ID and owner ID.
- Validate request bodies, route parameters, and persisted website JSON.
- Keep Prisma, filesystem access, and GitHub clients server-only.
- Preserve upload MIME-type and size limits; do not trust file extensions alone.
- Treat Base64 profile storage and browser-only image assets as development-oriented designs.
- Do not render untrusted raw HTML without sanitization.
- Do not log secrets or complete private integration responses.

## Known limitations

- The editor architecture is early-stage, with several dense components and limited automated UI coverage.
- There are no general unit, API integration, or end-to-end test suites.
- GitHub App access uses one global installation ID rather than per-user installations.
- GitHub routes retain development-oriented `test-` names and push directly to the default branch.
- Editor image assets are local to one browser profile in IndexedDB and are not synchronized between devices.
- Profile images are stored as Base64 strings in PostgreSQL.
- Preview routes use browser-stored state rather than a database-backed dynamic project route.
- ZIP output supports the core static block representation but not every rich editor property.
- The login form displays nonfunctional credentials fields even though only GitHub OAuth is configured.
- Save failures have a status indicator but no automatic retry or conflict resolution.

## Roadmap

- Add linting, standalone type checking, unit tests, API integration tests, and Playwright coverage.
- Store GitHub App installations per user.
- Move user images to external object storage.
- Split and simplify editor state and UI responsibilities.
- Add more website blocks and improve responsive editing.
- Improve accessibility, error handling, and contributor documentation.

## Contributing

Create a focused branch, make one coherent change, run the relevant tests and build, and commit generated Prisma migrations when the schema changes. Open a pull request that explains what changed, why, and how it was tested. Keep large refactors separate from feature changes so each review remains understandable.

## License

No license has been added yet. Until a license is provided, all rights are reserved by the repository owner.
