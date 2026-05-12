import { getLinkPreview } from "link-preview-js";
import { NextResponse } from "next/server";
import dns from "node:dns/promises";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }

  try {
    const preview = await getLinkPreview(url, {
      timeout: 5000,
      headers: {
        "user-agent": "googlebot",
      },
      followRedirects: "follow",
      resolveDNSHost: async (url: string) => {
        const hostname = new URL(url).hostname;
        const res = await dns.lookup(hostname);
        return res.address;
      },
    });
    return NextResponse.json(preview);
  } catch (error) {
    console.error("Failed to fetch link preview for:", url, error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 },
    );
  }
}
