import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm/_relations";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { v4 as uuidv4 } from "uuid";

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" })
    .default(false)
    .notNull(),
  image: text("image"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
});

export const session = sqliteTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    token: text("token").notNull().unique(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = sqliteTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: integer("access_token_expires_at", {
      mode: "timestamp_ms",
    }),
    refreshTokenExpiresAt: integer("refresh_token_expires_at", {
      mode: "timestamp_ms",
    }),
    scope: text("scope"),
    password: text("password"),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = sqliteTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
    updatedAt: text("updated_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const stashes = sqliteTable("stashes", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  userId: text("user_id").notNull(),
  tagId: text("tag_id")
    .references(() => tags.id)
    .notNull(),
  url: text("url").notNull(),
  title: text("title"),
  hostname: text("hostname"),
  description: text("description"),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
});

export const tags = sqliteTable("tags", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  name: text("name", { length: 50 }),
  userId: text("user_id").notNull(),
  createdAt: text("created_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
  updatedAt: text("updated_at")
    .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
    .notNull(),
});

export const stashToTags = sqliteTable(
  "stash_to_tags",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
    stashId: text("stash_id")
      .references(() => stashes.id)
      .notNull(),
    tagId: text("tag_id")
      .references(() => tags.id)
      .notNull(),
    createdAt: text("created_at")
      .default(sql`(STRFTIME('%Y-%m-%dT%H:%M:%fZ', 'now'))`)
      .notNull(),
  },
  (t) => [
    uniqueIndex("stash_tag_unique").on(t.stashId, t.tagId),
    index("stash_id_idx").on(t.stashId),
    index("tag_id_idx").on(t.tagId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
