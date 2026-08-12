# Vercel prototype deployment

HTTPMAKER's prototype stack is Next.js on Vercel, pooled hosted PostgreSQL,
Vercel Blob, an Upstash-compatible Redis REST limiter, and GitHub plus Google
OAuth. AI is deterministic `mock`; CSP remains report-only; access is intended
for invited users; published sites do not have individual custom domains.

## Provision and configure

Import `master` into Vercel, select Node 22, and use `npm run vercel-build`.
Connect a public Blob store. Create PostgreSQL 17-compatible hosting and use its
pooled, TLS-enabled runtime URL. Create an Upstash-compatible REST database.
Use one stable production domain; do not use per-commit preview domains for
OAuth. Preview environments should use separate OAuth clients or have OAuth
disabled and must never silently callback to production.

| Variable | Requirement | Visibility | Phase/source |
|---|---|---|---|
| `DATABASE_URL` | Required | Secret | Runtime; pooled PostgreSQL TLS URL |
| `HTTPMAKER_AI_PROVIDER` | Required, `mock` | Server | Build/runtime |
| `NEXT_PUBLIC_APP_URL` | Required stable HTTPS origin | Public | Build/runtime |
| `AUTH_URL` | Required; same origin | Server | Runtime |
| `AUTH_SECRET` | Required, 32+ random bytes | Secret | Runtime |
| `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET` | Required pair | Secret | Runtime; GitHub OAuth |
| `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | Required pair | Secret | Runtime; Google OAuth |
| `BLOB_READ_WRITE_TOKEN` | Required | Secret | Runtime; Vercel Blob |
| `RATE_LIMIT_REST_URL`, `RATE_LIMIT_REST_TOKEN` | Required pair | Secret | Runtime; Redis REST |
| `GITHUB_APP_ID`, `GITHUB_APP_SLUG`, `GITHUB_APP_CLIENT_ID`, `GITHUB_APP_CLIENT_SECRET`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_STATE_SECRET`, `GITHUB_APP_WEBHOOK_SECRET` | Optional complete group | Secret except slug/id | Runtime; GitHub App |

Generate `AUTH_SECRET` locally with `openssl rand -base64 32` and paste only into
Vercel's encrypted environment settings. Preserve private-key newlines in
`GITHUB_APP_PRIVATE_KEY`; do not use `GITHUB_APP_PRIVATE_KEY_PATH` on Vercel.

Configure callbacks at
`https://YOUR_DOMAIN/api/auth/callback/github`,
`https://YOUR_DOMAIN/api/auth/callback/google`,
`https://YOUR_DOMAIN/api/github/installations/callback`, and
`https://YOUR_DOMAIN/api/github/webhook`. Google's authorized JavaScript origin
is exactly `https://YOUR_DOMAIN`.

## Release and recovery

1. Confirm a current database backup and tested restore procedure.
2. Run `npm ci && npm run prisma:generate && npm run verify:deploy` in CI.
3. Run `npm run db:migrate:deploy` once against the intended production database.
4. Deploy/promote the application; preview builds never run migrations or seed.
5. Check logs and perform the two-user smoke test from the README.

On failure, roll back application code; never blindly reverse migrations.
Restore data only through the database provider's documented process. Reconcile
Blob orphans by comparing the `assets/` objects with Asset storage keys and
deleting only verified unreferenced objects. A limiter outage intentionally
returns 429 for sensitive operations. Logs should contain generic categories,
never URLs with credentials, tokens, cookies, payloads, or provider responses.

Watch Vercel function/build/bandwidth usage, PostgreSQL connections/storage and
backup status, Blob storage/operations/transfer, and Redis commands/storage.
Provider prices and quotas change; use their current dashboards rather than a
hard-coded cost estimate.

## Smoke test

Use anonymous, User A, and User B isolated browser contexts. Verify private-route
redirects and both login controls; create and preset a project; direct-upload an
image and wait for validation; reload draft and preview; publish, edit without
changing the snapshot, republish, then unpublish to a 404. Verify User B cannot
read or mutate A's project, assets, preview, publication, GitHub data, or
sessions, and verify session revocation. Test missing Blob/limiter configuration
fails closed. The optional GitHub App flow is tested only when its complete
environment group is configured.
