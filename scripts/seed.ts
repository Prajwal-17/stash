import "dotenv/config";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

import { db } from "@/db/db";
import { stashes, tags, user } from "@/db/schema";

type SeedTag = typeof tags.$inferSelect;

const seedUserEmail = "prajwalk1702@gmail.com";
const seedUserName = "Prajwal";
const seededAt = "2026-01-15T12:00:00.000Z";

async function getSeedUser() {
  const [existingUser] = await db.select().from(user).where(eq(user.email, seedUserEmail)).limit(1);

  if (existingUser) return existingUser;

  const [createdUser] = await db
    .insert(user)
    .values({
      id: uuidv4(),
      name: seedUserName,
      email: seedUserEmail,
      emailVerified: false
    })
    .returning();

  return createdUser;
}

async function ensureTag(userId: string, name: string, archived: boolean) {
  const archiveCondition = archived ? isNotNull(tags.archivedAt) : isNull(tags.archivedAt);
  const [existingTag] = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, name), archiveCondition))
    .limit(1);

  if (existingTag) return { tag: existingTag, created: false };

  const [createdTag] = await db
    .insert(tags)
    .values({ userId, name, archivedAt: archived ? seededAt : null })
    .returning();

  return { tag: createdTag, created: true };
}

async function ensureStash(
  userId: string,
  tag: SeedTag,
  values: {
    url: string;
    title: string;
    hostname: string;
    description: string;
    archivedAt?: string;
  }
) {
  const [existingStash] = await db
    .select({ id: stashes.id })
    .from(stashes)
    .where(and(eq(stashes.userId, userId), eq(stashes.url, values.url)))
    .limit(1);

  if (existingStash) return false;

  await db.insert(stashes).values({
    userId,
    tagId: tag.id,
    url: values.url,
    title: values.title,
    hostname: values.hostname,
    description: values.description,
    archivedAt: values.archivedAt ?? null
  });

  return true;
}

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Refusing to seed while NODE_ENV=production.");
  }

  const seedUser = await getSeedUser();
  const tagDefinitions = [
    ["Inbox", false],
    ["Development", false],
    ["Reading", false],
    ["Reference", true]
  ] as const;

  const seededTags = new Map<string, SeedTag>();
  let createdTagCount = 0;

  for (const [name, archived] of tagDefinitions) {
    const result = await ensureTag(seedUser.id, name, archived);
    seededTags.set(name, result.tag);
    if (result.created) createdTagCount += 1;
  }

  const samples = [
    {
      tag: "Inbox",
      url: "https://nextjs.org/docs",
      title: "Next.js Documentation",
      hostname: "nextjs.org",
      description: "The React framework documentation."
    },
    {
      tag: "Development",
      url: "https://orm.drizzle.team/docs/overview",
      title: "Drizzle ORM Documentation",
      hostname: "orm.drizzle.team",
      description: "TypeScript ORM documentation for SQL databases."
    },
    {
      tag: "Reading",
      url: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
      title: "JavaScript | MDN",
      hostname: "developer.mozilla.org",
      description: "JavaScript language documentation and learning resources."
    },
    {
      tag: "Development",
      url: "https://developer.mozilla.org/en-US/docs/Web/API",
      title: "Web APIs | MDN",
      hostname: "developer.mozilla.org",
      description: "Reference material for browser APIs.",
      archivedAt: seededAt
    },
    {
      tag: "Reference",
      url: "https://www.typescriptlang.org/docs/",
      title: "TypeScript Documentation",
      hostname: "typescriptlang.org",
      description: "TypeScript handbook and reference documentation."
    }
  ] as const;

  let createdStashCount = 0;

  for (const sample of samples) {
    const tag = seededTags.get(sample.tag);
    if (!tag) throw new Error(`Missing seed tag: ${sample.tag}`);
    if (await ensureStash(seedUser.id, tag, sample)) createdStashCount += 1;
  }

  console.log(
    `Seed ready for ${seedUserEmail}: ${tagDefinitions.length} tags and ${samples.length} bookmarks (${createdTagCount} tags and ${createdStashCount} bookmarks added).`
  );
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
