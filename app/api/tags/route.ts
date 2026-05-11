import { db } from "@/db/db";
import { bookmarks, tags } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const userId = user.id;

    const allTags = await db.select().from(tags).where(eq(tags.userId, userId));

    return NextResponse.json(
      { msg: "Successfully fetch tags", data: allTags },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const userId = user.id;
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!name) {
      return NextResponse.json({ msg: "Name is required" }, { status: 400 });
    }

    const [tagExists] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.name, name), eq(tags.userId, userId)));

    if (tagExists && tagExists.id) {
      return NextResponse.json({ msg: "Tag Already Exists" }, { status: 400 });
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        userId: userId,
        name,
      })
      .returning();

    if (!newTag.id) {
      return NextResponse.json({ msg: "Could not create tag" });
    }
    return NextResponse.json(
      {
        msg: "Created a new tag",
        data: {
          ...newTag,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const userId = user.id;
    const body = await req.json();

    const name = typeof body.name === "string" ? body.name.trim() : "";

    if (!body.tagId || !name) {
      return NextResponse.json({ msg: "Missing body" }, { status: 400 });
    }

    const [updatedTag] = await db
      .update(tags)
      .set({
        name,
        updatedAt: new Date().toISOString(),
      })
      .where(and(eq(tags.id, body.tagId), eq(tags.userId, userId)))
      .returning();

    if (updatedTag && updatedTag.id) {
      return NextResponse.json(
        { msg: "Updated tag", data: updatedTag },
        { status: 200 },
      );
    }

    return NextResponse.json({ msg: "Tag not found" }, { status: 404 });
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
    const userId = user.id;
    const body = await req.json();
    const { tagId } = body;

    if (!tagId) {
      return NextResponse.json({ msg: "tagId is required" }, { status: 400 });
    }

    const [tag] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)));

    if (!tag) {
      return NextResponse.json({ msg: "Tag not found" }, { status: 404 });
    }

    await db
      .delete(bookmarks)
      .where(and(eq(bookmarks.tagId, tagId), eq(bookmarks.userId, userId)));

    const [deletedTag] = await db
      .delete(tags)
      .where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
      .returning();

    return NextResponse.json(
      { msg: "Deleted tag and its bookmarks", data: deletedTag },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
