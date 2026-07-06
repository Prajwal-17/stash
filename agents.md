# Stash - AI Agent Instructions

Welcome to the Stash project. This document serves as the primary system prompt and context guide for any AI agents, coding assistants, or LLMs interacting with this repository.

## 1. Project Overview

**Stash** is a clean, minimal, and fast personal bookmark manager. It allows users to save URLs, automatically fetch metadata (title, description, hostname), organize items with tags, and perform full-text search.

**Core Philosophy:** Keep it clean, simple, and functional. Focus on high performance, excellent user experience, and readable code.

## 2. Tech Stack

The project is built on a modern, React-based web stack:

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS (v4) with shadcn/ui
- **Database:** SQLite (Turso in production, local file in dev)
- **ORM:** Drizzle ORM (v1.0.0-beta)
- **Authentication:** better-auth (Google OAuth)
- **State Management:** Zustand (Client-side global state)
- **Data Fetching:** TanStack Query (React Query)
- **Animations:** Motion (Framer Motion API)

## 3. Project Structure

The repository follows standard Next.js App Router conventions:

- `app/` - Next.js App Router pages, layouts, and API routes.
- `components/` - React components, including shadcn UI components (`components/ui`).
- `db/` - Database connection (`db.ts`) and Drizzle schema (`schema.ts`).
- `lib/` - Utility functions, auth client, and other shared logic.
- `hooks/` - Custom React hooks.
- `public/` - Static assets.
- `store/` - Zustand store definitions.

## 4. Architectural Guidelines

### 4.1. Next.js & React

- Use the **App Router** paradigm strictly.
- Default to **Server Components** (`page.tsx`, `layout.tsx`) unless interactivity or state is required.
- Use `"use client"` at the top of the file only when using hooks (e.g., `useState`, `useQuery`, `useStore`) or handling DOM events (e.g., `onClick`).
- Keep Client Components as lean as possible. Pass data down from Server Components as props when feasible.

### 4.2. Database & ORM (Drizzle & Turso)

- All schema definitions live in `db/schema.ts`.
- When making schema changes, always instruct the user to run migrations:
  - `pnpm drizzle-kit generate`
  - `pnpm drizzle-kit push` (for dev)
- The database is instantiated in `db/db.ts` using `@libsql/client`.
- Always use Drizzle's typed querying APIs (e.g., `db.select()`, `db.insert()`, `db.query`). Avoid raw SQL strings unless absolutely necessary for complex SQLite operations.

### 4.3. Authentication (better-auth)

- Authentication is handled by `better-auth`.
- Server-side auth logic is in `lib/auth.ts`. Client-side auth is in `lib/auth-client.ts`.
- Google OAuth is the sole provider. Ensure UI states account for unauthenticated vs. authenticated users.
- Use `better-auth` helper hooks and functions for session validation and routing protection.

### 4.4. State Management (Zustand & React Query)

- **Server Data:** Use TanStack React Query for fetching, caching, and mutating asynchronous server data. Keep query keys organized.
- **Client UI State:** Use Zustand (`store/`) for synchronous client-side UI state (e.g., active tags, search queries, sidebar toggles). Do not duplicate server data in Zustand.

### 4.5. Styling (Tailwind CSS v4 & shadcn/ui)

- Use Tailwind CSS for all custom styling. Do not write raw CSS unless strictly required (e.g., in `app/globals.css`).
- Use the `cn()` utility (`lib/utils.ts`) for conditionally joining Tailwind classes (combines `clsx` and `tailwind-merge`).
- Stick to the design system established by shadcn/ui.
- Ensure a clean, "less is more" aesthetic. Keep the UI uncluttered. Use generous whitespace, subtle borders, and muted text for secondary information.

## 5. Coding Standards

- **Clean and Simple:** Avoid over-engineering. Write code that is easy to read, test, and maintain.
- **Strict TypeScript:** Do not use `any`. Define interfaces or types for all props, API responses, and complex objects.
- **Error Handling:** Gracefully handle errors on both the client (toast notifications via `react-hot-toast`) and the server (returning appropriate HTTP status codes).
- **ESLint & Prettier:** Ensure code conforms to the project's formatting rules. Run `pnpm format` before committing.
- **Comments & Documentation:** Document complex logic or non-obvious workarounds. Keep docstrings clear and concise.

## 6. Agent Workflows

When implementing a new feature or fixing a bug, agents should follow this general workflow:

1. **Analyze:** Understand the user's request. Read relevant files (`db/schema.ts`, `package.json`, existing components).
2. **Plan:** Determine if the change requires DB schema updates, API route additions, or UI modifications.
3. **Execute:**
   - Write/Update the schema first (if applicable).
   - Write/Update the Server/API logic.
   - Update the UI/Client logic.
4. **Refine:** Ensure the styling aligns with the existing minimal aesthetic. Verify responsive behavior.
5. **Summarize:** Provide the user with a concise summary of changes and any commands they need to run (e.g., `drizzle-kit push`).

---

_End of agents.md. Always abide by these principles when suggesting or making modifications to the Stash repository._
