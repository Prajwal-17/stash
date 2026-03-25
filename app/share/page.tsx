import { ShareHandler } from "@/components/ShareHandler";
import { tags } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    redirect("/auth/login");
  }

  const user = data.user;

  const tagRows = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, user.id))
    .orderBy(tags.createdAt);

  const initialTags = tagRows.map((tag) => ({
    ...tag,
    createdAt: tag.createdAt.toISOString(),
    updatedAt: tag.updatedAt.toISOString(),
  }));

  const params = await searchParams;
  const urlParam = typeof params.url === "string" ? params.url : "";
  const titleParam = typeof params.title === "string" ? params.title : "";
  const textParam = typeof params.text === "string" ? params.text : "";

  return (
    <ShareHandler
      initialTags={initialTags}
      sharedUrl={urlParam}
      sharedTitle={titleParam}
      sharedText={textParam}
    />
  );
}
