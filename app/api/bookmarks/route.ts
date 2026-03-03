import { bookmarks } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/utils/db";
import { eq } from "drizzle-orm";
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

// POST /api/bookmarks — create a new bookmark for the authenticated user
export async function POST(req: NextRequest) {
  try {
    console.log(process.env.DATABASE_URL);
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const userId = data.user.id;
    const body = await req.json();

    console.log(userId, body);
    if (!body.url) {
      return NextResponse.json({ msg: "URL is required" }, { status: 400 });
    }

    const [bookmark] = await db
      .insert(bookmarks)
      .values({
        userId,
        url: body.url,
        title: body.title ?? null,
        description: body.description ?? null,
      })
      .returning();

    return NextResponse.json(
      { msg: "Bookmark added", data: bookmark },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
