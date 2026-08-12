# Authentication and tenant-isolation audit

## Baseline and reproduction

Starting revision: `3595b78719010fa8cc68eb8e8c2829f130878a91` (`master`, equal to `origin/master`). The initial tree was clean.

The report has two distinct causes. A browser with a valid database session can follow a direct `/dashboard` link without seeing GitHub login again; that is expected persistent-session behavior. Separately, `/preview` authenticated only after client hydration and `/sites/preview` had no server guard. Those pages exposed only that browser's local storage—not another tenant's database draft—but violated the documented route boundary and could convincingly resemble an authentication bypass. Both legacy routes were removed. No owner-agnostic project, asset, publication, or GitHub database read was found. The one check-then-update GitHub unlink operation was converted to an atomic `updateMany({ id, ownerId })` mutation.

Automated browser evidence records redirect/status behavior without cookies, tokens, personal data, or repository names. A clean context was redirected from dashboard, editor, publish, and draft-preview URLs before private data rendered. Valid A sessions saw only A data; exact B publish/preview URLs produced the 404 UI without B data. Expired, deleted, individually revoked, revoke-all-other, and signed-out sessions all lost access on the next request. Signed-out live snapshots returned 200 while unpublished and unknown slugs returned 404. Private responses are marked `private, no-store`; live immutable snapshots remain public.

## Route policy

| Route | Methods | Policy | Ownership key | Mutation protection | Coverage |
|---|---|---|---|---|---|
| `/`, `/login` | GET | Public | — | — | route policy, callback tests |
| `/[slug]`, `/[slug]/icon` | GET | Public only for live snapshot | validated global slug | read-only published selection | public-site/browser tests |
| `/sites/[slug]` | GET | Public compatibility redirect for live snapshot | validated global slug | read-only | public-site tests |
| `/dashboard/**` | GET | Authenticated | session user; project pages add project ID + owner | server protected layout | browser tests |
| `/editor/**` | GET | Authenticated | project API uses project ID + owner | server protected layout | browser tests |
| `/preview/[projectId]` | GET | Authenticated | project ID + owner | server protected layout | browser tests |
| `/api/auth/**` | Auth.js | Public Auth.js protocol | adapter session/user | Auth.js CSRF/state/PKCE | callback tests |
| `/api/profile` | GET/PATCH | Authenticated | session user ID | central origin middleware for PATCH | route policy |
| `/api/projects/**` | GET/POST/PATCH/DELETE | Authenticated | project ID + owner ID | origin, bounded input, owner predicates, rate limits | route/unit/browser tests |
| `/api/assets/**` | GET/POST/DELETE | Authenticated | asset/project ID + owner ID | origin, signatures, owner predicates, rate limits | existing route tests |
| `/api/ai`, `/api/maps/**` | POST | Authenticated | session user ID | origin, bounded input, rate limits | existing tests |
| `/api/github/installations/**` | mixed | Authenticated | internal installation/project ID + owner ID | origin, signed callback state/nonce | existing ownership tests |
| `/api/github/webhook` | POST | Public signed integration | installation delivery | HMAC + delivery replay protection; origin exempt | webhook tests |
| `/api/sessions` | GET | Authenticated | session user ID | no-store, bounded list | unit/browser tests |
| `/api/sessions/[sessionId]` | DELETE | Authenticated | session ID + user ID | same-origin, owner delete, current-session rejection | browser tests |
| `/api/sessions/revoke-others` | POST | Authenticated | user ID excluding current ID | same-origin atomic deleteMany | browser tests |

The route-policy test enumerates every `page.tsx` and API `route.ts` and fails for unclassified additions. Because Next.js may stream an App Router not-found shell with status 200, root publication requests receive a minimal existence preflight in stable Node.js middleware. It selects only an ID under `slug + isPublished + publishedWebsite != null`; unknown/unpublished slugs receive 404 before rendering. The page loader remains authoritative for the immutable public snapshot.

## Session policy

Auth.js retains the Prisma database strategy. Sessions have a seven-day maximum and 24-hour update interval. `Session.createdAt` and `updatedAt` were added without changing existing tokens. Deleting or expiring the database row makes the cookie unusable on the next authorized request. The security UI exposes only opaque row IDs and timestamps, never session tokens.

## Deployment and incident response

Required production configuration: `DATABASE_URL`, a non-placeholder 32-byte-or-longer `AUTH_SECRET`, `AUTH_GITHUB_ID`, `AUTH_GITHUB_SECRET`, HTTPS `NEXT_PUBLIC_APP_URL`/`AUTH_URL`, and distributed `RATE_LIMIT_REST_URL`/`RATE_LIMIT_REST_TOKEN`. Apply `prisma generate` and `prisma migrate deploy` before deploying application code. HTTPS termination must preserve the canonical host; do not trust arbitrary forwarded hosts.

If unexpected access is reported:

1. Establish whether it used a still-valid shared-browser session, an old deployment, a leaked cookie, or an ownership bypass. Preserve privacy-safe redirect/status/server-log evidence only.
2. Never copy cookies or OAuth/session tokens into tickets. Scope affected user IDs and timestamps.
3. With operator confirmation, revoke affected database sessions (or all sessions for affected users). Rotate `AUTH_SECRET` only when broad invalidation is intended. Rotate GitHub secrets only if exposure is suspected.
4. Apply migrations, deploy the fixed revision, then reopen access.
5. Retest from clean, user-A, and user-B browser contexts plus signed-out public snapshot access.

## Remaining risk

The CSP is report-only until production telemetry confirms all editor, OAuth, image, map, and Blob sources. HSTS begins with a one-day rollout and should be increased deliberately. The distributed limiter assumes an Upstash-compatible REST pipeline and must be exercised against the selected production provider. In-memory development limits are not globally consistent and are not represented as production protection.
