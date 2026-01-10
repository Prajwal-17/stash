import { bookmarks } from "@/db/schema";
import { db } from "@/utils/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await db.select().from(bookmarks);

    return NextResponse.json(
      {
        msg: "Successfully fetched all bookmarks",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await db.insert(bookmarks).values({
      url: body.url,
      title: body.title,
      description: body.description,
    });

    if (!result) {
      return NextResponse.json(
        { msg: "Something went wrong" },
        { status: 500 },
      );
    }
    return NextResponse.json({ msg: "Bookmark added" }, { status: 201 });
  } catch (error) {
    console.log(error);
    return NextResponse.json({ msg: "Something went wrong" }, { status: 500 });
  }
}
