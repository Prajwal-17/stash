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

  // Get user and redirect if not authenticated
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

  // Fetch bookmarks
  const fetchBookmarks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks");
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      // Reverse so newest are at top
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

  // Save bookmark
  const handleSave = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    // Auto-prepend https:// if missing
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
    <>
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
          background: #0f0f11;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          color: #f4f4f5;
          -webkit-font-smoothing: antialiased;
        }

        .lm-root {
          min-height: 100dvh;
          display: flex;
          flex-direction: column;
          align-items: center;
          background: #0f0f11;
        }

        /* ─── Header ─── */
        .lm-header {
          position: sticky;
          top: 0;
          z-index: 10;
          width: 100%;
          height: 60px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          padding: 0 16px;
          border-bottom: 1px solid #2a2a2e;
          background: #0f0f11;
          gap: 12px;
        }
        .lm-header-inner {
          width: 100%;
          max-width: 640px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
        }

        .lm-logout-btn {
          background: transparent;
          border: none;
          cursor: pointer;
          color: #ef4444;
          font-size: 13px;
          font-weight: 500;
          padding: 6px 10px;
          border-radius: 6px;
          letter-spacing: 0.01em;
          transition: opacity 0.15s;
        }
        .lm-logout-btn:hover { opacity: 0.75; }

        .lm-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: #3f3f46;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          user-select: none;
        }

        /* ─── Main content ─── */
        .lm-content {
          width: 100%;
          max-width: 640px;
          padding: 24px 24px 100px;
          flex: 1;
        }
        @media (max-width: 640px) {
          .lm-content { padding: 16px 16px 90px; }
        }

        /* ─── Empty state ─── */
        .lm-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 80px 0;
          color: #71717a;
        }
        .lm-empty svg { opacity: 0.5; }
        .lm-empty-text { font-size: 14px; }

        /* ─── Bookmark list ─── */
        .lm-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .lm-item {
          background: #18181b;
          border: 1px solid #2a2a2e;
          border-radius: 8px;
          padding: 12px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
          transition: background 0.15s, border-color 0.15s, transform 0.1s;
          text-decoration: none;
          overflow: hidden;
        }
        .lm-item:hover {
          background: #232326;
          border-color: #3a3a3e;
          transform: translateY(-1px);
        }
        .lm-item:active { transform: translateY(0); }

        .lm-favicon {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          flex-shrink: 0;
          object-fit: contain;
        }
        .lm-favicon-placeholder {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          background: #2a2a2e;
          flex-shrink: 0;
        }

        .lm-item-body {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .lm-item-url {
          font-size: 13px;
          color: #f4f4f5;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-weight: 500;
        }
        .lm-item-host {
          font-size: 11px;
          color: #71717a;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .lm-item-icon {
          color: #71717a;
          flex-shrink: 0;
          transition: color 0.15s;
        }
        .lm-item:hover .lm-item-icon { color: #a1a1aa; }

        /* ─── Error banner ─── */
        .lm-error {
          background: rgba(239,68,68,0.12);
          border: 1px solid rgba(239,68,68,0.3);
          border-radius: 8px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fca5a5;
          margin-bottom: 12px;
          animation: fadeIn 0.2s ease;
        }

        /* ─── Skeleton loader ─── */
        .lm-skeleton-list {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .lm-skeleton-item {
          background: #18181b;
          border: 1px solid #2a2a2e;
          border-radius: 8px;
          padding: 12px 14px;
          height: 58px;
          overflow: hidden;
        }
        .lm-skeleton-line {
          border-radius: 4px;
          background: linear-gradient(90deg, #2a2a2e 25%, #323236 50%, #2a2a2e 75%);
          background-size: 200% 100%;
          animation: shimmer 1.4s infinite;
        }
        .lm-skeleton-line-main {
          height: 13px;
          width: 72%;
          margin-bottom: 6px;
        }
        .lm-skeleton-line-sub {
          height: 11px;
          width: 40%;
        }

        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* ─── Bottom input bar ─── */
        .lm-input-bar {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background: #18181b;
          border-top: 1px solid #2a2a2e;
          padding: 12px;
          z-index: 20;
          display: flex;
          justify-content: center;
        }
        .lm-input-bar-inner {
          width: 100%;
          max-width: 640px;
          display: flex;
          gap: 8px;
        }

        .lm-url-input {
          flex: 1;
          height: 42px;
          border-radius: 6px;
          background: #0f0f11;
          border: 1px solid #2a2a2e;
          color: #f4f4f5;
          padding: 0 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.15s;
          font-family: inherit;
        }
        .lm-url-input::placeholder { color: #52525b; }
        .lm-url-input:focus { border-color: #6366f1; }

        .lm-save-btn {
          height: 42px;
          padding: 0 18px;
          border-radius: 6px;
          background: #6366f1;
          color: #fff;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.15s, transform 0.1s, opacity 0.15s;
          font-family: inherit;
          white-space: nowrap;
        }
        .lm-save-btn:hover:not(:disabled) { background: #5855eb; }
        .lm-save-btn:active:not(:disabled) { transform: scale(0.98); }
        .lm-save-btn:disabled { opacity: 0.6; cursor: not-allowed; }
      `}</style>

      <div className="lm-root">
        {/* Header */}
        <header className="lm-header">
          <div className="lm-header-inner">
            <button className="lm-logout-btn" onClick={handleLogout}>
              Logout
            </button>
            <div className="lm-avatar">{userInitial}</div>
          </div>
        </header>

        {/* Main content */}
        <main className="lm-content">
          {error && <div className="lm-error">{error}</div>}

          {loading ? (
            <ul className="lm-skeleton-list">
              {[...Array(5)].map((_, i) => (
                <li key={i} className="lm-skeleton-item">
                  <div className="lm-skeleton-line lm-skeleton-line-main" />
                  <div className="lm-skeleton-line lm-skeleton-line-sub" />
                </li>
              ))}
            </ul>
          ) : bookmarks.length === 0 ? (
            <div className="lm-empty">
              <LinkIcon />
              <span className="lm-empty-text">No links saved yet</span>
            </div>
          ) : (
            <ul className="lm-list">
              {bookmarks.map((bm) => (
                <li key={bm.id}>
                  <a
                    href={bm.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="lm-item"
                  >
                    <img
                      src={getFavicon(bm.url)}
                      alt=""
                      className="lm-favicon"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display =
                          "none";
                      }}
                    />
                    <span className="lm-item-body">
                      <span className="lm-item-url">{bm.title ?? bm.url}</span>
                      <span className="lm-item-host">
                        {getHostname(bm.url)}
                      </span>
                    </span>
                    <span className="lm-item-icon">
                      <ExternalLinkIcon />
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </main>

        {/* Fixed bottom input bar */}
        <div className="lm-input-bar">
          <div className="lm-input-bar-inner">
            <input
              type="text"
              className="lm-url-input"
              placeholder="Enter URL..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (error) setError(null);
              }}
              onKeyDown={handleKeyDown}
              disabled={saving}
            />
            <button
              className="lm-save-btn"
              onClick={handleSave}
              disabled={saving || !url.trim()}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
