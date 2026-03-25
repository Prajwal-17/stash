import { BookmarkClient } from "@/components/BookmarkClient";
import { bookmarks } from "@/db/schema";
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

  const rows = await db
    .select()
    .from(bookmarks)
    .where(eq(bookmarks.userId, user.id))
    .orderBy(bookmarks.createdAt);

  const initialBookmarks = rows.slice().reverse();

  return (
    <BookmarkClient
      initialBookmarks={initialBookmarks}
      userInitial={userInitial}
    />
  );
}
