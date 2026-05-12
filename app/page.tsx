import { StashShell } from "@/components/StashShell";
import { db } from "@/db/db";
import { stashes, tags } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function Home() {
  // auth check (server-side)
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;
  const userInitial = (user.email ?? "U").charAt(0).toUpperCase();
  const userName = user.name || user.email || "Stash User";

  const [stashRows, tagRows] = await Promise.all([
    db
      .select()
      .from(stashes)
      .where(eq(stashes.userId, user.id))
      .orderBy(stashes.createdAt),
    db
      .select()
      .from(tags)
      .where(eq(tags.userId, user.id))
      .orderBy(tags.createdAt),
  ]);

  const initialStashes = stashRows
    .slice()
    .reverse()
    .map((stash) => ({
      ...stash,
      createdAt: new Date(stash.createdAt).toISOString(),
      updatedAt: new Date(stash.updatedAt).toISOString(),
    }));

  const initialTags = tagRows.map((tag) => ({
    ...tag,
    createdAt: new Date(tag.createdAt).toISOString(),
    updatedAt: new Date(tag.updatedAt).toISOString(),
  }));

  return (
    <StashShell
      initialStashes={initialStashes}
      initialTags={initialTags}
      userEmail={user.email ?? "stash@local"}
      userInitial={userInitial}
      userName={userName}
    />
  );
}
