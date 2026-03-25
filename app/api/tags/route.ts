import { tags } from "@/db/schema";
import { createClient } from "@/lib/supabase/server";
import { db } from "@/utils/db";
import { and, eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const userId = data.user.id;

    const [allTags] = await db
      .select()
      .from(tags)
      .where(eq(tags.userId, userId));

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
    const supabase = await createClient();
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json({ msg: "Unauthorized" }, { status: 401 });
    }

    const userId = data.user.id;
    const body = await req.json();

    if (!body.name) {
      return NextResponse.json({ msg: "Name is required" }, { status: 400 });
    }

    const [tagExists] = await db
      .select()
      .from(tags)
      .where(and(eq(tags.name, body.name), eq(tags.userId, userId)));

    if (tagExists.id) {
      return NextResponse.json({ msg: "Tag Already Exists" }, { status: 400 });
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        userId: userId,
        name: body.name,
      })
      .returning();

    if (!newTag.id) {
      return NextResponse.json({ msg: "Could not create tag" });
    }
    return NextResponse.json({ msg: "Created a new tag" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
