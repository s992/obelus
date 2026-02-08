# Obelus

Obelus is a private, multi-user reading record app focused on judgment and notes.

## Stack

- Frontend: React + TypeScript + Vite SPA
- Styling: vanilla-extract
- Forms/validation: react-hook-form + zod
- Data fetching: TanStack Query
- Backend: Fastify + tRPC + Drizzle ORM
- Database: Postgres
- Cache: Redis (OpenLibrary API caching)

## Features implemented

- Multi-user accounts with email/password auth
- Optional SSO-ready OAuth2/OIDC bootstrap endpoints and env-based configuration
- Reading log with start date, optional end date, optional progress percent
- To-read list with optional priority/notes
- Per-book Accepted/Rejected judgment and notes
- Collection privacy toggle (private/public)
- Public read-only collection endpoint
- Reading reports dashboard (totals + monthly trend)
- OpenLibrary book search
- Book detail with series context and related books in the series
- Cached OpenLibrary metadata (Redis + Postgres cache table)

## Project layout

- `apps/web` - Vite SPA frontend
- `apps/api` - Fastify+tRPC backend
- `packages/shared` - shared zod schemas/types

## Setup

1. Copy env values:

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. Install dependencies:

```bash
npm install
```

3. Generate DB migration (already generated, rerun if schema changes):

```bash
npm run db:generate -w @obelus/api
```

4. Bootstrap Postgres role/database and apply migrations:

```bash
npm run db:bootstrap
```

`db:bootstrap` uses `DATABASE_URL` as the app connection and `ADMIN_DATABASE_URL` for admin-level creation/grants.

5. Start apps:

```bash
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`

### WSL / host-IP access

If you open the web app via a WSL host IP (for example `http://172.25.71.27:5173`), keep API/CORS aligned:

- Prefer leaving `VITE_API_URL` empty in `apps/web/.env` so the frontend targets `http://<current-host>:4000`.
- Add that web origin to `APP_ORIGINS` in `apps/api/.env` (comma-separated for multiple origins), for example:
  - `APP_ORIGINS=http://172.25.71.27:5173`

## Quality checks

```bash
npm run typecheck
npm run lint
```
