import {
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";
import { v4 as uuidv4 } from "uuid";

export const bookmarks = pgTable("bookmarks", {
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
  hostname: varchar("hostname", { length: 255 }),
  rootDomain: varchar("root_domain", { length: 255 }),
  description: varchar("description", { length: 255 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const tags = pgTable("tags", {
  id: text("id")
    .primaryKey()
    .notNull()
    .$defaultFn(() => uuidv4()),
  name: varchar("name", { length: 50 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bookmarkToTags = pgTable(
  "bookmark_to_tags",
  {
    id: text("id")
      .primaryKey()
      .notNull()
      .$defaultFn(() => uuidv4()),
    bookmarkId: text("bookmark_id")
      .references(() => bookmarks.id)
      .notNull(),
    tagId: text("tag_id")
      .references(() => bookmarks.id)
      .notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("bookmark_tag_unique").on(t.bookmarkId, t.tagId),
    index("bookmark_id_idx").on(t.bookmarkId),
    index("tag_id_idx").on(t.tagId),
  ],
);
