import { db } from "@/db/db";
import { stashes } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// GET /api/stashes — fetch all stashes for the authenticated user
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    const result = await db
      .select()
      .from(stashes)
      .where(eq(stashes.userId, user.id))
      .orderBy(stashes.createdAt);

    return NextResponse.json(
      { msg: "Successfully fetched stashes", data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/stashes — create a new stash
// Body: { tagId, url, title?, description? }
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    const body = await req.json();
    const { tagId, url, title, description } = body;

    if (!tagId || !url) {
      return NextResponse.json(
        { msg: "tagId and url are required" },
        { status: 400 },
      );
    }

    const parsedUrl = new URL(url);

    const [stash] = await db
      .insert(stashes)
      .values({
        userId: user.id,
        tagId,
        url,
        title: title || null,
        hostname: parsedUrl.hostname,
        description: description || null,
      })
      .returning();

    return NextResponse.json({ msg: "Stashed", data: stash }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// PATCH /api/stashes — update an existing stash
// Body: { stashId, tagId, url, title?, description? }
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    const body = await req.json();
    const { stashId, tagId, url, title, description } = body;

    if (!stashId || !tagId || !url) {
      return NextResponse.json(
        { msg: "stashId, tagId, and url are required" },
        { status: 400 },
      );
    }

    const parsedUrl = new URL(url);

    const [updated] = await db
      .update(stashes)
      .set({
        tagId,
        url,
        title: title || null,
        hostname: parsedUrl.hostname,
        description: description || null,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(stashes.id, stashId), eq(stashes.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { msg: "Stash not found or not owned by user" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { msg: "Stash updated", data: updated },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;

    const body = await req.json();
    const { stashId } = body;

    if (!stashId) {
      return NextResponse.json({ msg: "stashId is required" }, { status: 400 });
    }

    const [deletedStash] = await db
      .delete(stashes)
      .where(and(eq(stashes.id, stashId), eq(stashes.userId, user.id)))
      .returning();

    if (!deletedStash) {
      return NextResponse.json(
        { msg: "Stash not found or not owned by user" },
        { status: 404 },
      );
    }

    return NextResponse.json(
      { msg: "Stash removed", data: deletedStash },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
