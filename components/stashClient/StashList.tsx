"use client";

import { StashRow } from "@/components/stashClient/list/StashRow";
import { QueryStatus } from "@/components/stashClient/ui";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { useStashActions } from "@/hooks/useStashActions";
import { useStashQueries } from "@/hooks/useStashQueries";
import { getDefaultTagId, getTagLabel, Stash } from "@/lib/stash-client";
import { useStashStore } from "@/store/stashStore";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { LuEllipsis, LuLoaderCircle, LuPencil, LuRefreshCw, LuTrash2 } from "react-icons/lu";

export function StashList() {
  const listRef = useRef<HTMLDivElement>(null);

  const activeTagId = useStashStore((s) => s.activeTagId);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);

  const { openDeleteConfirmation } = useStashActions();

  const { tagsQuery, stashesQuery, tags, stashes } = useStashQueries();

  const resolvedActiveTagId =
    activeTagId && tags.some((tag) => tag.id === activeTagId) ? activeTagId : getDefaultTagId(tags);

  const activeTag = useMemo(
    () => tags.find((tag) => tag.id === resolvedActiveTagId) ?? null,
    [resolvedActiveTagId, tags]
  );

  const visibleStashes = useMemo(() => {
    const filtered = resolvedActiveTagId
      ? stashes.filter((stash) => stash.tagId === resolvedActiveTagId)
      : stashes;

    return filtered
      .slice()
      .sort(
        (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
      );
  }, [stashes, resolvedActiveTagId]);

  const groupedStashes = useMemo(() => {
    const today: Stash[] = [];
    const thisWeek: Stash[] = [];
    const older: Stash[] = [];

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const weekStart = todayStart - 6 * 24 * 60 * 60 * 1000;

    for (const stash of visibleStashes) {
      const time = new Date(stash.createdAt).getTime();
      if (time >= todayStart) {
        today.push(stash);
      } else if (time >= weekStart) {
        thisWeek.push(stash);
      } else {
        older.push(stash);
      }
    }

    return { today, thisWeek, older };
  }, [visibleStashes]);

  const showTagLoadState = tagsQuery.isPending && !tags.length;
  const showStashLoadState = stashesQuery.isPending && !stashes.length;
  const showTagErrorState = tagsQuery.isError && !tags.length;

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
      if (e.target instanceof HTMLElement && ["INPUT", "TEXTAREA"].includes(e.target.tagName)) {
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
    scrollToIndex
  ]);

  const isDefaultTag = resolvedActiveTagId === getDefaultTagId(tags);

  let globalIndex = 0;

  return (
    <main className="flex flex-1 flex-col overflow-y-auto">
      <header className="border-border/40 bg-background/80 sticky top-0 z-10 flex items-center justify-between border-b px-4 py-3 backdrop-blur-md sm:px-8 sm:py-3">
        <h1 className="text-base font-medium tracking-tight">
          {isDefaultTag ? (
            <span className="text-foreground">Inbox</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <span className="text-muted-foreground/60">Tags</span>
              <span className="text-muted-foreground/30 font-normal">/</span>
              <span className="text-foreground font-semibold">
                {activeTag ? getTagLabel(activeTag) : "unknown"}
              </span>
            </span>
          )}
        </h1>
        <div className="flex items-center gap-2">
          {!isDefaultTag && activeTag && (
            <DropdownMenu>
              <DropdownMenuTrigger id="list-tag-options-dropdown-trigger" asChild>
                <Button
                  id="list-tag-options-dropdown-trigger"
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground h-8 w-8 rounded-full"
                >
                  <LuEllipsis size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() =>
                    setTagEditor({
                      mode: "edit",
                      tagId: activeTag.id,
                      name: activeTag.name || getTagLabel(activeTag)
                    })
                  }
                >
                  <LuPencil className="mr-2 h-4 w-4" />
                  Edit tag
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  className="text-red-500 focus:bg-red-500/10 focus:text-red-500"
                  onClick={() =>
                    openDeleteConfirmation({
                      kind: "tag",
                      id: activeTag.id,
                      title: `Remove "${getTagLabel(activeTag)}"?`,
                      description: "This removes the tag and all stashes inside it permanently.",
                      confirmLabel: "Remove tag"
                    })
                  }
                >
                  <LuTrash2 className="mr-2 h-4 w-4" />
                  Delete tag
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </header>

      <div className="mx-auto w-full max-w-3xl px-3 pt-2 pb-16 sm:px-6">
        <div className="mb-4 space-y-3">
          {tagsQuery.isError ? (
            <QueryStatus tone="error">
              <div className="flex items-center justify-between gap-3">
                <span>{tags.length ? "Could not refresh tags." : "Could not load tags."}</span>
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
                {stashes.length ? "Could not refresh stashes." : "Could not load stashes."}
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
            {resolvedActiveTagId ? "No stashes in this tag yet." : "No stashes here yet."}
          </QueryStatus>
        ) : (
          <div ref={listRef} className="flex flex-col gap-6">
            {groupedStashes.today.length > 0 && (
              <section>
                <h3 className="text-muted-foreground/60 mb-2 px-2 text-sm font-semibold tracking-tight">
                  Today
                </h3>
                <ul className="flex flex-col gap-1">
                  {groupedStashes.today.map((stash) => {
                    const currentIndex = globalIndex++;
                    return <StashRow key={stash.id} stash={stash} index={currentIndex} />;
                  })}
                </ul>
              </section>
            )}

            {groupedStashes.thisWeek.length > 0 && (
              <section>
                <h3 className="text-muted-foreground/60 mb-2 px-2 text-sm font-semibold tracking-tight">
                  This week
                </h3>
                <ul className="flex flex-col gap-1">
                  {groupedStashes.thisWeek.map((stash) => {
                    const currentIndex = globalIndex++;
                    return <StashRow key={stash.id} stash={stash} index={currentIndex} />;
                  })}
                </ul>
              </section>
            )}

            {groupedStashes.older.length > 0 && (
              <section>
                <h3 className="text-muted-foreground/60 mb-2 px-2 text-sm font-semibold tracking-tight">
                  Older
                </h3>
                <ul className="flex flex-col gap-1">
                  {groupedStashes.older.map((stash) => {
                    const currentIndex = globalIndex++;
                    return <StashRow key={stash.id} stash={stash} index={currentIndex} />;
                  })}
                </ul>
              </section>
            )}
          </div>
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
