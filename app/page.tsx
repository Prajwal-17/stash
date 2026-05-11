import { BookmarkClient } from "@/components/BookmarkClient";
import { db } from "@/db/db";
import { bookmarks, tags } from "@/db/schema";
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

  const [bookmarkRows, tagRows] = await Promise.all([
    db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, user.id))
      .orderBy(bookmarks.createdAt),
    db
      .select()
      .from(tags)
      .where(eq(tags.userId, user.id))
      .orderBy(tags.createdAt),
  ]);

  const initialBookmarks = bookmarkRows
    .slice()
    .reverse()
    .map((bookmark) => ({
      ...bookmark,
      createdAt: new Date(bookmark.createdAt).toISOString(),
      updatedAt: new Date(bookmark.updatedAt).toISOString(),
    }));

  const initialTags = tagRows.map((tag) => ({
    ...tag,
    createdAt: new Date(tag.createdAt).toISOString(),
    updatedAt: new Date(tag.updatedAt).toISOString(),
  }));

  return (
    <BookmarkClient
      initialBookmarks={initialBookmarks}
      initialTags={initialTags}
      userEmail={user.email ?? "stash@local"}
      userInitial={userInitial}
      userName={userName}
    />
  );
}
