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
pnpm db:setup                  # sync local schema and add sample data
pnpm dev                       # start http://localhost:3000
```

## .env

```env
BETTER_AUTH_SECRET=<generate one via `openssl rand -hex 32`>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DB_FILE_NAME=./.data/stash.sqlite

# Google OAuth (optional but needed to log in)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Turso (production only)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

- Dev uses a gitignored local SQLite file (`.data/stash.sqlite` by default).
- `pnpm db:dev` synchronizes the schema to the development database. `pnpm db:seed` is idempotent and adds active and archived sample records for `prajwalk1702@gmail.com`, creating that development user when needed.
- Production uses Turso; set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
- Google OAuth is the only auth provider. Without it you cannot log in.

## Database workflow

Synchronize schema changes to development, then production:

```bash
pnpm db:dev
pnpm db:prod
```

`db:dev` uses `drizzle.dev.config.ts` and the local `DB_FILE_NAME`. `db:prod` uses
`drizzle.prod.config.ts` and requires `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
Drizzle asks for confirmation before applying data-loss statements.

## Scripts

| cmd                | desc                                       |
| ------------------ | ------------------------------------------ |
| `pnpm dev`         | Start the development server               |
| `pnpm build`       | Production build                           |
| `pnpm start`       | Start production server                    |
| `pnpm db:setup`    | Sync and seed the development database     |
| `pnpm db:dev`      | Synchronize the schema to development      |
| `pnpm db:prod`     | Synchronize the schema to production Turso |
| `pnpm db:generate` | Generate a migration snapshot              |
| `pnpm db:seed`     | Add idempotent development seed data       |
