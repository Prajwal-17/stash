import { db } from "@/db/db";
import { readingList } from "@/db/schema";
import { auth } from "@/lib/auth";
import { and, eq } from "drizzle-orm";
import { getLinkPreview } from "link-preview-js";
import { NextRequest, NextResponse } from "next/server";
import dns from "node:dns/promises";

// GET /api/reading-list — fetch reading list items
// ?all=true returns all items (including completed), default returns only unread
export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const { searchParams } = new URL(req.url);
    const showAll = searchParams.get("all") === "true";

    const where = showAll
      ? eq(readingList.userId, user.id)
      : and(eq(readingList.userId, user.id), eq(readingList.isRead, false));

    const result = await db.select().from(readingList).where(where).orderBy(readingList.createdAt);

    const mappedResult = result.map((item) => ({
      ...item,
      scheduledFor: item.scheduledFor ? item.scheduledFor.getTime() : null
    }));

    return NextResponse.json(
      { msg: "Successfully fetched reading list", data: mappedResult },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// POST /api/reading-list — add an item to the reading list
export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const body = await req.json();
    const { url, scheduledFor } = body;

    if (!url) {
      return NextResponse.json({ msg: "URL is required" }, { status: 400 });
    }

    const parsedUrl = new URL(url);
    let title = null;
    let description = null;

    // Auto-fetch metadata
    try {
      const preview = await getLinkPreview(url, {
        timeout: 5000,
        headers: { "user-agent": "googlebot" },
        followRedirects: "follow",
        resolveDNSHost: async (url: string) => {
          const hostname = new URL(url).hostname;
          const res = await dns.lookup(hostname);
          return res.address;
        }
      });

      if (preview && "title" in preview) {
        title = preview.title || null;
      }
      if (preview && "description" in preview) {
        description = preview.description || null;
      }
    } catch (metadataError) {
      console.error("Failed to fetch metadata for reading list item:", url, metadataError);
    }

    const [item] = await db
      .insert(readingList)
      .values({
        userId: user.id,
        url,
        title,
        description,
        hostname: parsedUrl.hostname,
        scheduledFor: scheduledFor || null,
        isRead: false
      })
      .returning();

    const mappedItem = {
      ...item,
      scheduledFor: item.scheduledFor ? item.scheduledFor.getTime() : null
    };

    return NextResponse.json({ msg: "Added to reading list", data: mappedItem }, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// PATCH /api/reading-list — update reading list item
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const body = await req.json();
    const { id, scheduledFor, isRead } = body;

    if (!id) {
      return NextResponse.json({ msg: "id is required" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString()
    };

    if (scheduledFor !== undefined) {
      updateData.scheduledFor = scheduledFor;
    }
    if (isRead !== undefined) {
      updateData.isRead = isRead;
    }

    const [updated] = await db
      .update(readingList)
      .set(updateData)
      .where(and(eq(readingList.id, id), eq(readingList.userId, user.id)))
      .returning();

    if (!updated) {
      return NextResponse.json({ msg: "Item not found or not owned by user" }, { status: 404 });
    }

    const mappedUpdated = {
      ...updated,
      scheduledFor: updated.scheduledFor ? updated.scheduledFor.getTime() : null
    };

    return NextResponse.json(
      { msg: "Reading list item updated", data: mappedUpdated },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

// DELETE /api/reading-list — delete a reading list item
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers
    });

    if (!session) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ msg: "id is required" }, { status: 400 });
    }

    const [deleted] = await db
      .delete(readingList)
      .where(and(eq(readingList.id, id), eq(readingList.userId, user.id)))
      .returning({ id: readingList.id });

    if (!deleted) {
      return NextResponse.json({ msg: "Item not found or not owned by user" }, { status: 404 });
    }

    return NextResponse.json({ msg: "Item deleted", data: { id: deleted.id } }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
