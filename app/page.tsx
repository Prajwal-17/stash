"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

interface Bookmark {
  id: string;
  url: string;
  title: string | null;
  description: string | null;
  createdAt: string;
}

function LinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function isValidUrl(url: string): boolean {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function getFavicon(url: string): string {
  try {
    const { hostname } = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
  } catch {
    return "";
  }
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export default function Home() {
  const supabase = createClient();
  const router = useRouter();

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userInitial, setUserInitial] = useState("U");

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.replace("/auth/login");
        return;
      }
      setUserId(data.user.id);
      const email = data.user.email ?? "";
      setUserInitial(email.charAt(0).toUpperCase() || "U");
    });
  }, []);

  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setBookmarks((json.data ?? []).slice().reverse());
    } catch {
      setError("Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) fetchBookmarks();
  }, [userId, fetchBookmarks]);

  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    const normalized =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;

    if (!isValidUrl(normalized)) {
      setError("Please enter a valid URL.");
      return;
    }

    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: normalized }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const json = await res.json();
      setBookmarks((prev) => [json.data, ...prev]);
      setUrl("");
    } catch {
      setError("Failed to save bookmark.");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace("/auth/login");
  };

  return (
    <div className="flex min-h-dvh flex-col items-center bg-[#0f0f11]">
      {/* ── Header ── */}
      <header className="sticky top-0 z-10 w-full border-b border-[#2a2a2e] bg-[#0f0f11]">
        <div className="mx-auto flex h-[60px] max-w-[640px] items-center justify-end gap-3 px-4">
          <button
            onClick={handleLogout}
            className="rounded-md px-3 py-1.5 text-sm font-medium text-[#ef4444] transition-opacity hover:opacity-70"
          >
            Logout
          </button>
          <div className="flex size-9 shrink-0 select-none items-center justify-center rounded-full bg-[#3f3f46] text-sm font-semibold text-white">
            {userInitial}
          </div>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="w-full max-w-[640px] flex-1 px-6 pt-6 pb-28 max-sm:px-4">
        {/* Error banner */}
        {error && (
          <div className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
            {error}
          </div>
        )}

        {/* Skeleton loader */}
        {loading ? (
          <ul className="flex flex-col gap-2">
            {[...Array(5)].map((_, i) => (
              <li
                key={i}
                className="rounded-lg border border-[#2a2a2e] bg-[#18181b] px-4 py-3"
              >
                <div className="mb-1.5 h-3 w-3/4 animate-pulse rounded bg-[#2a2a2e]" />
                <div className="h-2.5 w-2/5 animate-pulse rounded bg-[#2a2a2e]" />
              </li>
            ))}
          </ul>
        ) : bookmarks.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-[#71717a]">
            <LinkIcon />
            <span className="text-sm">No links saved yet</span>
          </div>
        ) : (
          /* Bookmark list */
          <ul className="flex flex-col gap-2">
            {bookmarks.map((bm) => (
              <li key={bm.id}>
                <a
                  href={bm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 overflow-hidden rounded-lg border border-[#2a2a2e] bg-[#18181b] px-4 py-3 transition-all duration-150 hover:-translate-y-px hover:border-[#3a3a3e] hover:bg-[#232326] active:translate-y-0"
                >
                  {/* Favicon */}
                  <img
                    src={getFavicon(bm.url)}
                    alt=""
                    className="size-5 shrink-0 rounded object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />

                  {/* Text */}
                  <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate text-sm font-medium text-[#f4f4f5]">
                      {bm.title ?? bm.url}
                    </span>
                    <span className="truncate text-[11px] text-[#71717a]">
                      {getHostname(bm.url)}
                    </span>
                  </span>

                  {/* External link icon */}
                  <span className="shrink-0 text-[#71717a] transition-colors group-hover:text-[#a1a1aa]">
                    <ExternalLinkIcon />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* ── Fixed bottom input bar ── */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#2a2a2e] bg-[#18181b] px-3 py-3">
        <div className="mx-auto flex w-full max-w-[640px] gap-2">
          <input
            type="text"
            placeholder="Enter URL..."
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null);
            }}
            onKeyDown={handleKeyDown}
            disabled={saving}
            className="h-[42px] flex-1 rounded-md border border-[#2a2a2e] bg-[#0f0f11] px-3 text-sm text-[#f4f4f5] outline-none placeholder:text-[#52525b] focus:border-[#6366f1] disabled:opacity-60"
          />
          <button
            onClick={handleSave}
            disabled={saving || !url.trim()}
            className="h-[42px] rounded-md bg-[#6366f1] px-[18px] text-sm font-semibold text-white transition-all duration-150 hover:bg-[#5855eb] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
