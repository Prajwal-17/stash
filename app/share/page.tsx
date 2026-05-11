import { ShareHandler } from "@/components/ShareHandler";
import { db } from "@/db/db";
import { tags } from "@/db/schema";
import { auth } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;

  const tagRows = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, user.id))
    .orderBy(tags.createdAt);

  const initialTags = tagRows.map((tag) => ({
    ...tag,
    createdAt: new Date(tag.createdAt).toISOString(),
    updatedAt: new Date(tag.updatedAt).toISOString(),
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
