"use client";

import { StashRow } from "@/components/stashClient/list/StashRow";
import { QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { LuLoaderCircle, LuRefreshCw } from "react-icons/lu";

export function StashList() {
  const listRef = useRef<HTMLUListElement>(null);

  const activeTagId = useStashStore((s) => s.activeTagId);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);

  const { tagsQuery, stashesQuery, tags, stashes } = useStashQueries();

  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId)
      ? activeTagId
      : getDefaultTagId(tags);

  const visibleStashes = useMemo(() => {
    const filtered = resolvedActiveTagId
      ? stashes.filter((stash) => stash.tagId === resolvedActiveTagId)
      : stashes;

    return filtered
      .slice()
      .sort(
        (left, right) =>
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime(),
      );
  }, [stashes, resolvedActiveTagId]);

  const showTagLoadState = tagsQuery.isPending && !tags.length;
  const showStashLoadState = stashesQuery.isPending && !stashes.length;
  const showTagErrorState = tagsQuery.isError && !tags.length;

  // Reset focused index when visible stashes change
  useEffect(() => {
    setFocusedStashIndex(-1);
  }, [resolvedActiveTagId, setFocusedStashIndex]);

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
      // don't capture when typing in input
      if (
        e.target instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(e.target.tagName)
      ) {
        return;
      }

      const len = visibleStashes.length;
      if (!len) return;

      const currentIndex = focusedStashIndex;

      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        const next = currentIndex < len - 1 ? currentIndex + 1 : 0;
        setFocusedStashIndex(next);
        scrollToIndex(next);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        const prev = currentIndex > 0 ? currentIndex - 1 : len - 1;
        setFocusedStashIndex(prev);
        scrollToIndex(prev);
      } else if (e.key === "Enter" && currentIndex >= 0) {
        e.preventDefault();
        const stash = visibleStashes[currentIndex];
        if (stash) {
          window.open(stash.url, "_blank", "noopener,noreferrer");
        }
      } else if (e.key === " " && currentIndex >= 0) {
        e.preventDefault();
        const stash = visibleStashes[currentIndex];
        if (stash) {
          setPreviewStash(previewStash?.id === stash.id ? null : stash);
        }
      } else if (e.key === "Escape") {
        if (previewStash) {
          setPreviewStash(null);
        } else {
          setFocusedStashIndex(-1);
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    visibleStashes,
    focusedStashIndex,
    setFocusedStashIndex,
    previewStash,
    setPreviewStash,
    scrollToIndex,
  ]);

  return (
    <main className="flex-1 overflow-y-auto px-3 sm:px-5">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-4 space-y-3">
          {tagsQuery.isError ? (
            <QueryStatus tone="error">
              <div className="flex items-center justify-between gap-3">
                <span>
                  {tags.length
                    ? "Could not refresh tags."
                    : "Could not load tags."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="hover:text-foreground h-8 px-2 text-red-100 hover:bg-red-500/10"
                  onClick={() => void tagsQuery.refetch()}
                >
                  Retry
                </Button>
              </div>
            </QueryStatus>
          ) : null}

          {!showTagLoadState && !showTagErrorState && !tags.length ? (
            <QueryStatus>
              <div className="flex items-center justify-between gap-3">
                <span>No tags yet. Create one with the `+` button.</span>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-foreground hover:bg-accent hover:text-foreground h-8 px-2"
                  onClick={() => setTagEditor({ mode: "create", name: "" })}
                >
                  New tag
                </Button>
              </div>
            </QueryStatus>
          ) : null}

          {tagsQuery.isFetching && !showTagLoadState ? (
            <QueryStatus compact>
              <span className="inline-flex items-center gap-2">
                <LuRefreshCw size={12} className="animate-spin" />
                Syncing tags...
              </span>
            </QueryStatus>
          ) : null}
        </div>

        {stashesQuery.isError ? (
          <QueryStatus tone="error">
            <div className="flex items-center justify-between gap-3">
              <span>
                {stashes.length
                  ? "Could not refresh stashes."
                  : "Could not load stashes."}
              </span>
              <Button
                type="button"
                variant="ghost"
                className="hover:text-foreground h-8 px-2 text-red-100 hover:bg-red-500/10"
                onClick={() => void stashesQuery.refetch()}
              >
                Retry
              </Button>
            </div>
          </QueryStatus>
        ) : showStashLoadState ? (
          <QueryStatus>
            <span className="inline-flex items-center gap-2">
              <LuLoaderCircle size={14} className="animate-spin" />
              Loading stashes...
            </span>
          </QueryStatus>
        ) : !visibleStashes.length ? (
          <QueryStatus>
            {resolvedActiveTagId
              ? "No stashes in this tag yet."
              : "No stashes here yet."}
          </QueryStatus>
        ) : (
          <>
            <div className="border-border/40 mb-1 flex items-center justify-center border-b px-2 pb-2 sm:justify-between">
              <span className="text-muted-foreground hidden text-[10px] font-semibold tracking-[0.15em] uppercase sm:block">
                Title
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
                <Kbd>Space</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  preview
                </span>
                <span className="text-muted-foreground/30 mx-0.5">·</span>
                <Kbd>↵</Kbd>
                <span className="text-muted-foreground/50 text-[10px]">
                  open
                </span>
              </div>
            </div>

            <ul ref={listRef} className="divide-y divide-white/5">
              {visibleStashes.map((stash, index) => (
                <StashRow key={stash.id} stash={stash} index={index} />
              ))}
            </ul>
          </>
        )}

        {stashesQuery.isFetching && !showStashLoadState ? (
          <div className="mt-3">
            <QueryStatus compact>
              <span className="inline-flex items-center gap-2">
                <LuRefreshCw size={12} className="animate-spin" />
                Syncing stashes...
              </span>
            </QueryStatus>
          </div>
        ) : null}
      </div>
    </main>
  );
}
