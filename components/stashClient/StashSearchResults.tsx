"use client";

import { StashRow } from "@/components/stashClient/list/StashRow";
import { QueryStatus } from "@/components/stashClient/ui";
import { Kbd } from "@/components/ui/kbd";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getTagLabel, Stash } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { LuLoaderCircle } from "react-icons/lu";

export function StashSearchResults() {
  const listRef = useRef<HTMLDivElement>(null);

  const searchQuery = useStashStore((s) => s.searchQuery);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);

  const { tags, stashesQuery, stashes } = useStashQueries();

  const visibleStashes = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();

    return stashes
      .filter((stash) => {
        const titleMatch = (stash.title || "").toLowerCase().includes(query);
        const urlMatch = (stash.url || "").toLowerCase().includes(query);
        const descMatch = (stash.description || "")
          .toLowerCase()
          .includes(query);
        return titleMatch || urlMatch || descMatch;
      })
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
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

  // reset focused index when search changes
  useEffect(() => {
    setFocusedStashIndex(-1);
  }, [searchQuery, setFocusedStashIndex]);

  const scrollToIndex = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-stash-row]");
    const item = items[index] as HTMLElement | undefined;
    if (item) {
      item.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
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
      } else if (e.key === "Escape") {
        if (previewStash) {
          setPreviewStash(null);
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
  ]);

  const searchWords = searchQuery.trim() ? [searchQuery.trim()] : [];

  return (
    <main className="flex-1 overflow-y-auto px-3 sm:px-5">
      <div className="mx-auto w-full max-w-2xl">
        {stashesQuery.isFetching && !stashes.length ? (
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
            <div className="border-border/40 mb-1 flex items-center justify-center border-b px-2 pb-2 sm:justify-between">
              <span className="text-muted-foreground hidden text-[10px] font-semibold tracking-[0.15em] uppercase sm:block">
                Search Results
              </span>

              <span className="text-muted-foreground/60 text-[10px] sm:hidden">
                Hold on a link to view details
              </span>

              <div className="hidden items-center gap-1.5 sm:flex">
                <Kbd>↑</Kbd>
                <Kbd>↓</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  navigate
                </span>
                <span className="text-muted-foreground/30 mx-0.5">·</span>
                <Kbd>↵</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  open
                </span>
              </div>
            </div>

            <div ref={listRef} className="mt-3 space-y-5">
              {(() => {
                let globalIndex = 0;
                return groupedStashes.map(({ tag, stashes }) => (
                  <div key={tag?.id || "unknown"}>
                    <h3 className="text-muted-foreground mb-1.5 px-2 text-xs font-semibold tracking-wider uppercase">
                      {getTagLabel(tag)}
                    </h3>
                    <ul className="divide-y divide-white/5">
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
