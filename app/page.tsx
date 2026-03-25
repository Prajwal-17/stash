import { BookmarkClient } from "@/components/BookmarkClient";
import { bookmarks, tags } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function Home() {
  // auth check (server-side)
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const user = data.user;
  const userInitial = (user.email ?? "U").charAt(0).toUpperCase();
  const userName =
    typeof user.user_metadata?.full_name === "string" &&
    user.user_metadata.full_name.trim()
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string" &&
          user.user_metadata.name.trim()
        ? user.user_metadata.name
        : (user.email ?? "Stash User");

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
      createdAt: bookmark.createdAt.toISOString(),
      updatedAt: bookmark.updatedAt.toISOString(),
    }));

  const initialTags = tagRows.map((tag) => ({
    ...tag,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
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
