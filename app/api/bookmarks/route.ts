import { bookmarks } from "@/db/schema";
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

    const result = await db
      .select()
      .from(bookmarks)
      .where(eq(bookmarks.userId, data.user.id))
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
// Body: { tagId, url, title?, description? }
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tagId, url, title, description } = body;

    if (!tagId || !url) {
      return NextResponse.json(
        { msg: "tagId and url are required" },
        { status: 400 },
      );
    }

    const parsedUrl = new URL(url);

    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        userId: data.user.id,
        tagId,
        url,
        title: title || null,
        hostname: parsedUrl.hostname,
        description: description || null,
      })
      .returning();

    return NextResponse.json(
      { msg: "Bookmark created", data: bookmark },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// PATCH /api/bookmarks — update an existing bookmark
// Body: { bookmarkId, tagId, url, title?, description? }
export async function PATCH(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookmarkId, tagId, url, title, description } = body;

    if (!bookmarkId || !tagId || !url) {
      return NextResponse.json(
        { msg: "bookmarkId, tagId, and url are required" },
        { status: 400 },
      );
    }

    const parsedUrl = new URL(url);

    const [updated] = await db
      .update(bookmarks)
      .set({
        tagId,
        url,
        title: title || null,
        hostname: parsedUrl.hostname,
        description: description || null,
        updatedAt: new Date(),
      })
      .where(
        and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, data.user.id)),
      )
      .returning();

    if (!updated) {
      return NextResponse.json(
        { msg: "Bookmark not found or not owned by user" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { msg: "Bookmark updated", data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bookmarkId } = body;

    if (!bookmarkId) {
      return NextResponse.json(
        { msg: "bookmarkId is required" },
        { status: 400 },
      );
    }

    const [deletedBookmark] = await db
      .delete(bookmarks)
      .where(
        and(eq(bookmarks.id, bookmarkId), eq(bookmarks.userId, data.user.id)),
      )
      .returning();

    if (!deletedBookmark) {
      return NextResponse.json(
        { msg: "Bookmark not found or not owned by user" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { msg: "Bookmark deleted", data: deletedBookmark },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
