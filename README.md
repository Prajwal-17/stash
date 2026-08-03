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
pnpm db:setup                  # migrate and add sample data
pnpm dev                       # migrates, then starts http://localhost:3000
```

## .env

```env
BETTER_AUTH_SECRET=<generate one via `openssl rand -hex 32`>
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_BASE_URL=http://localhost:3000
DB_FILE_NAME=./.data/stash.sqlite

# Optional: select or create this user when seeding
SEED_USER_EMAIL=
SEED_USER_NAME=Development User

# Google OAuth (optional but needed to log in)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Turso (production only)
TURSO_DATABASE_URL=
TURSO_AUTH_TOKEN=
```

- Dev uses a gitignored local SQLite file (`.data/stash.sqlite` by default).
- `pnpm dev` applies committed migrations automatically. `pnpm db:seed` is idempotent and adds active and archived sample records to the user selected by `SEED_USER_EMAIL`, to the oldest existing user when it is unset, or creates a local-only development user on an empty database.
- Production uses Turso; set `NODE_ENV=production` and `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
- Google OAuth is the only auth provider. Without it you cannot log in.

## Scripts

| cmd                | desc                                  |
| ------------------ | ------------------------------------- |
| `pnpm dev`         | Migrate and start the dev server      |
| `pnpm build`       | Production build                      |
| `pnpm start`       | Start production server               |
| `pnpm db:setup`    | Apply migrations and seed sample data |
| `pnpm db:migrate`  | Apply committed migrations            |
| `pnpm db:generate` | Generate a migration                  |
| `pnpm db:seed`     | Add idempotent development seed data  |
