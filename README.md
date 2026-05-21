# Stash

A clean personal bookmark manager. Save URLs, auto-fetch metadata, organize with tags.

Built with Next.js 16, TypeScript, Tailwind CSS, shadcn, Turso (SQLite), better-auth (Google OAuth), Drizzle ORM, Zustand, TanStack Query.

## Features

- Save bookmarks with auto-fetched metadata (title, description, hostname)
- Tag based organization
- Full text search across titles, URLs, descriptions
- Google OAuth login
- PWA with share target (mobile share-to-stash)
- Quick Actions(shortcuts)

## Setup

```bash
pnpm install
cp .env.example .env
pnpm exec drizzle-kit push
pnpm dev                       # http://localhost:3000
```

## .env

```env
BETTER_AUTH_SECRET=<generate one via `openssl rand -hex 32`>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DB_FILE_NAME=./.dist/stash.sqlite

# Google OAuth (optional but needed to log in)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Turso (production only)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

- Dev uses a local SQLite file (`.dist/stash.sqlite` by default).
- Production uses Turso; set `NODE_ENV=production` and `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- Google OAuth is the only auth provider. Without it you cannot log in.

## Scripts

| cmd                         | desc                    |
| --------------------------- | ----------------------- |
| `pnpm dev`                  | Start dev server        |
| `pnpm build`                | Production build        |
| `pnpm start`                | Start production server |
| `pnpm drizzle-kit push`     | Push schema to DB       |
| `pnpm drizzle-kit generate` | Generate migration      |
| `pnpm drizzle-kit migrate`  | Apply migration         |
