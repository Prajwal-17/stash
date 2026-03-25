import { bookmarks, tags } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/utils/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/bookmarks — fetch all bookmarks for the authenticated user
export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const userId = data.user.id;

    const result = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, userId))
      .orderBy(bookmarks.createdAt);

    return NextResponse.json(
      { msg: "Successfully fetched bookmarks", data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/bookmarks — create a new bookmark
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const userId = data.user.id;
    const body = await req.json();

    if (!body.url) {
      return NextResponse.json({ msg: "URL is required" }, { status: 400 });
    }

    const url = new URL(body.url);

    if (!body.tag) {
      const [insertedInbox] = await db
        .insert(tags)
        .values({
          userId: userId,
          name: "Inbox",
        })
        .returning({
          id: tags.id,
        });

      const [bookmark] = await db
        .insert(bookmarks)
        .values({
          userId: userId,
          tagId: insertedInbox.id,
          url: body.url,
          title: body.title ?? null,
          hostname: url.hostname,
          description: body.description ?? null,
        })
        .returning();

      if (!bookmark.id) {
        throw new Error("Could not create bookmark");
      }
      return NextResponse.json(
        { msg: "Url saved successfull" },
        { status: 201 },
      );
    } else {
      const [existingTag] = await db
        .select()
        .from(tags)
        .where(and(eq(tags.name, body.tag), eq(tags.userId, userId)));

      let newTag: string;
      if (!existingTag.id) {
        const [insertTag] = await db
          .insert(tags)
          .values({
            userId: userId,
            name: body.tag,
          })
          .returning();

        newTag = insertTag.id;
      }

      const [bookmark] = await db
        .insert(bookmarks)
        .values({
          userId: userId,
          tagId: existingTag.id ?? newTag!,
          url: body.url,
          title: body.title ?? null,
          hostname: url.hostname,
          description: body.description ?? null,
        })
        .returning();
      if (!bookmark.id) {
        throw new Error("Could not create bookmark");
      }
      return NextResponse.json(
        { msg: "Url saved successfull" },
        { status: 201 },
      );
    }
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
