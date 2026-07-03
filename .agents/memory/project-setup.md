---
name: LNCT GenZ Connect project setup
description: How the imported project is wired together on Replit — dev ports, proxy, start script, secrets.
---

The project is a pnpm monorepo with two artifact services:
- API server: Express + Drizzle + PostgreSQL, runs on PORT=8080 in dev
- Frontend: React + Vite, runs on PORT=5000 in dev (Replit webview port)

**Why PORT=5000 for frontend:** Replit's webview output type requires port 5000. The artifact.toml uses 22077, but for the unified dev workflow, the frontend is started with PORT=5000 override.

**Vite proxy:** `artifacts/genz-connect/vite.config.ts` proxies `/api` → `http://localhost:8080`. Any new API routes are automatically accessible from the frontend without CORS issues.

**Start script:** `start-dev.sh` — starts API first, health-checks `/api/healthz`, then starts Vite. Has `trap` for cleanup and explicit failure if API never comes up.

**Secrets required:** SESSION_SECRET (set), ADMIN_PASSWORD (set). DATABASE_URL is runtime-managed by Replit.

**DB schema push:** `pnpm --filter @workspace/db run push` (uses drizzle-kit push).

**Admin login:** /admin/login using ADMIN_PASSWORD secret value.
