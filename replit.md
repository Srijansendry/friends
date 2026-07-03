# LNCT GenZ Connect

A mobile-first, gentle-pink anonymous community board for LNCT students to post what they need (find friends, hackathon teammates, study groups, roommates, project collaborators) and connect with each other safely, with an admin mediating every connection so no one's identity is ever exposed.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/genz-connect run dev` — run the web frontend
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `ADMIN_PASSWORD` — admin dashboard password, `SESSION_SECRET` — admin session cookie secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, `express-session` for admin auth (cookie-based)
- DB: PostgreSQL + Drizzle ORM
- Frontend: React + Vite, wouter routing, shadcn/ui components, gentle-pink theme
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- OpenAPI contract: `lib/api-spec/openapi.yaml`
- DB schema: `lib/db/src/schema/` (`posts.ts`, `connection_requests.ts`, `admin_messages.ts`)
- API routes: `artifacts/api-server/src/routes/` (`categories.ts`, `posts.ts`, `admin.ts`)
- Frontend pages: `artifacts/genz-connect/src/pages/`
- Anon token storage/helpers: `artifacts/genz-connect/src/lib/token.ts`

## Architecture decisions

- **No accounts for students.** Anonymity is achieved via opaque bearer-style tokens (`ownerToken` on post creation, `requesterToken` on connection request) returned once and stored client-side (`localStorage`), sent back as the `x-anon-token` header. There is no way to recover a lost token — this is explained to users in the UI.
- **Students can hold multiple tokens** (multiple posts/requests over time). The frontend joins all known tokens into one comma-separated `x-anon-token` header; the backend splits and matches with `inArray` rather than exact equality. Any new `/me/*`-style route must follow this same split/`inArray` pattern, not `eq`.
- **Admin is the only real "account"** — password-based (`ADMIN_PASSWORD` env var) with `express-session` cookies. Admin mediates every connection: approve/reject requests and relay messages to either party via `admin_messages`, so direct contact info is never exchanged automatically.
- **Basic spam filtering** is regex-based (`artifacts/api-server/src/lib/anon.ts` `looksLikeSpam`) blocking URLs, phone numbers, and known contact-app mentions in post/request text at submit time.
- Trending sort ranks posts by `requestCount * 3 + viewCount` (recency as tiebreaker), not a separate view/analytics service.

## Product

- Homepage: hero, trending posts, category quick links, search.
- `/browse`: full listing with category filter, sort (recent/trending), search.
- `/post`: anonymous posting form; explains the no-account/anon-token model.
- `/posts/:id`: post detail + "Request to Connect" form.
- `/my-activity`: token-based view of a student's own posts (with incoming requests + admin messages) and their own outgoing requests (with status + admin messages).
- `/admin/login`, `/admin`: password-gated dashboard — stats, request queue (approve/reject/message), post moderation (active/closed/removed).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Any new anon-token-authenticated route must split the `x-anon-token` header on commas and use `inArray`, since a browser may hold several tokens across multiple posts/requests — see the multi-token gotcha in `.agents/memory/`.
- `SESSION_SECRET` and `ADMIN_PASSWORD` must both be set or the API server throws on startup / admin login always fails.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
