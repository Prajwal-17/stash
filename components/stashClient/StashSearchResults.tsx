"use client";

import { StashRow } from "@/components/stashClient/list/StashRow";
import { QueryStatus } from "@/components/shared/QueryStatus";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getTagLabel, Stash } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LuLoaderCircle, LuSearch, LuX } from "react-icons/lu";

export function StashSearchResults() {
  const listRef = useRef<HTMLDivElement>(null);

  const searchQuery = useStashStore((s) => s.searchQuery);
  const setSearchQuery = useStashStore((s) => s.setSearchQuery);
  const setActiveView = useStashStore((s) => s.setActiveView);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);

  const { tags, stashesQuery, stashes } = useStashQueries();

  const [localSearch, setLocalSearch] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(localSearch);
    }, 200);
    return () => clearTimeout(timer);
  }, [localSearch, setSearchQuery]);

  const visibleStashes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    return stashes
      .filter((stash) => {
        const titleMatch = (stash.title || "").toLowerCase().includes(query);
        const urlMatch = (stash.url || "").toLowerCase().includes(query);
        const descMatch = (stash.description || "").toLowerCase().includes(query);
        return titleMatch || urlMatch || descMatch;
      })
      .slice()
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
  }, [stashes, searchQuery]);

  const groupedStashes = useMemo(() => {
    const groups = new Map<string, Stash[]>();
    for (const stash of visibleStashes) {
      if (!groups.has(stash.tagId)) {
        groups.set(stash.tagId, []);
      }
      groups.get(stash.tagId)!.push(stash);
    }

    return Array.from(groups.entries()).map(([tagId, groupStashes]) => {
      const tag = tags.find((t) => t.id === tagId);
      return { tag, stashes: groupStashes };
    });
  }, [visibleStashes, tags]);

  const flatRenderedStashes = useMemo(() => {
    return groupedStashes.flatMap((group) => group.stashes);
  }, [groupedStashes]);

  useEffect(() => {
    setFocusedStashIndex(-1);
    setPreviewStash(null);
  }, [searchQuery, setFocusedStashIndex, setPreviewStash]);

  const closeSearch = useCallback(() => {
    setActiveView("stash");
    setLocalSearch("");
    setSearchQuery("");
    window.requestAnimationFrame(() => {
      const triggers = Array.from(document.querySelectorAll<HTMLElement>("[data-search-trigger]"));
      triggers.find((trigger) => trigger.offsetParent !== null)?.focus();
    });
  }, [setActiveView, setSearchQuery]);

  const scrollToIndex = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-stash-row]");
    const item = items[index] as HTMLElement | undefined;
    if (item) {
      item.querySelector<HTMLAnchorElement>("[data-row-link]")?.focus({ preventScroll: true });
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        if (e.target.closest("button, [contenteditable='true']")) return;
        if (e.key === "Enter" && e.target.closest("a")) return;
      }

      if (e.key === "Escape") {
        if (previewStash) {
          setPreviewStash(null);
        } else {
          closeSearch();
        }
        return;
      }

      const len = flatRenderedStashes.length;
      if (!len) return;

      const currentIndex = focusedStashIndex;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next = currentIndex < len - 1 ? currentIndex + 1 : 0;
        setFocusedStashIndex(next);
        scrollToIndex(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : len - 1;
        setFocusedStashIndex(prev);
        scrollToIndex(prev);
      } else if (e.key === "Enter" && currentIndex >= 0) {
        e.preventDefault();
        const stash = flatRenderedStashes[currentIndex];
        if (stash) {
          window.open(stash.url, "_blank", "noopener,noreferrer");
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    flatRenderedStashes,
    focusedStashIndex,
    setFocusedStashIndex,
    previewStash,
    setPreviewStash,
    scrollToIndex,
    closeSearch
  ]);

  const searchWords = searchQuery.trim() ? [searchQuery.trim()] : [];

  return (
    <main className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain">
      <header className="border-border/40 bg-background/90 sticky top-0 z-10 flex shrink-0 items-center gap-3 border-b px-4 py-3 backdrop-blur-md sm:px-6">
        <div className="group relative flex-1 shadow-sm">
          <LuSearch
            className="text-muted-foreground group-focus-within:text-foreground absolute top-1/2 left-3.5 -translate-y-1/2 transition-colors"
            size={18}
          />
          <input
            autoFocus
            data-stash-search-input
            type="text"
            aria-label="Search stashes"
            placeholder="Search stashes, titles, or descriptions..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="border-border/50 bg-muted/40 focus:bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-ring focus:ring-ring/20 w-full min-w-0 rounded-full border py-2.5 pr-12 pl-10 text-sm shadow-inner transition-all outline-none focus:ring-4 sm:text-base"
          />
          <button
            type="button"
            aria-label="Close search"
            className="text-muted-foreground hover:bg-muted hover:text-foreground absolute top-1/2 right-2.5 flex size-7 -translate-y-1/2 items-center justify-center rounded-full transition-colors"
            onClick={closeSearch}
          >
            <LuX size={16} />
          </button>
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-3 pt-4 pb-16 sm:px-6">
        {stashesQuery.isError && !stashes.length ? (
          <QueryStatus tone="error">
            Could not load stashes. Try again when you’re online.
          </QueryStatus>
        ) : stashesQuery.isFetching && !stashes.length ? (
          <QueryStatus>
            <span className="inline-flex items-center gap-2">
              <LuLoaderCircle size={14} className="animate-spin" />
              Searching...
            </span>
          </QueryStatus>
        ) : !searchQuery.trim() ? (
          <QueryStatus>Type to search stashes.</QueryStatus>
        ) : !visibleStashes.length ? (
          <QueryStatus>No stashes found matching your query.</QueryStatus>
        ) : (
          <>
            <div ref={listRef} className="mt-3 space-y-5">
              {(() => {
                let globalIndex = 0;
                return groupedStashes.map(({ tag, stashes }) => (
                  <div key={tag?.id || "unknown"}>
                    <h3 className="text-muted-foreground/60 mb-2 px-2 text-sm font-semibold tracking-tight">
                      {getTagLabel(tag)}
                    </h3>
                    <ul className="flex flex-col gap-1">
                      {stashes.map((stash) => {
                        const currentIndex = globalIndex++;
                        return (
                          <StashRow
                            key={stash.id}
                            stash={stash}
                            index={currentIndex}
                            searchWords={searchWords}
                            expandedLayout={true}
                          />
                        );
                      })}
                    </ul>
                  </div>
                ));
              })()}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
