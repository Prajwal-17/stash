"use client";

import { StashRow } from "@/components/stashClient/list/StashRow";
import { QueryStatus } from "@/components/shared/QueryStatus";
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
import {
  LuArchive,
  LuEllipsis,
  LuLoaderCircle,
  LuPencil,
  LuRefreshCw,
  LuTrash2
} from "react-icons/lu";

export function StashList() {
  const listRef = useRef<HTMLDivElement>(null);

  const activeTagId = useStashStore((s) => s.activeTagId);
  const setTagEditor = useStashStore((s) => s.setTagEditor);
  const focusedStashIndex = useStashStore((s) => s.focusedStashIndex);
  const setFocusedStashIndex = useStashStore((s) => s.setFocusedStashIndex);
  const previewStash = useStashStore((s) => s.previewStash);
  const setPreviewStash = useStashStore((s) => s.setPreviewStash);

  const { handleTagArchiveAction, isSetTagArchivedPending, openDeleteConfirmation } =
    useStashActions();

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
    setPreviewStash(null);
  }, [resolvedActiveTagId, setFocusedStashIndex, setPreviewStash]);

  useEffect(() => {
    if (focusedStashIndex >= visibleStashes.length) {
      setFocusedStashIndex(-1);
    }
    if (previewStash && !visibleStashes.some((stash) => stash.id === previewStash.id)) {
      setPreviewStash(null);
    }
  }, [focusedStashIndex, previewStash, setFocusedStashIndex, setPreviewStash, visibleStashes]);

  const scrollToIndex = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll("[data-stash-row]");
    const item = items[index] as HTMLElement | undefined;
    if (item) {
      item.querySelector<HTMLAnchorElement>("[data-row-link]")?.focus({ preventScroll: true });
      item.scrollIntoView({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement) {
        if (
          e.target.closest(
            "input, textarea, button, select, [contenteditable='true'], [role='dialog'], [role='menu'], [role='listbox'], [data-slot='popover-content']"
          )
        )
          return;
        if (e.key === "Enter" && e.target.closest("a")) return;
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
    <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <header className="mx-auto flex h-13 w-full max-w-2xl shrink-0 items-center justify-between gap-3 px-3 sm:px-5">
        <h1 className="min-w-0 truncate text-base font-medium tracking-tight">
          {isDefaultTag ? (
            <span className="text-foreground">Inbox</span>
          ) : (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="text-muted-foreground shrink-0 font-normal">Tags</span>
              <span className="text-muted-foreground shrink-0 font-normal">/</span>
              <span className="text-foreground truncate font-medium">
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
                  aria-label="Tag options"
                  className="text-muted-foreground hover:bg-muted hover:text-foreground size-8 rounded-md"
                >
                  <LuEllipsis size={18} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-44"
                onCloseAutoFocus={(event) => {
                  const { tagEditor, confirmation } = useStashStore.getState();
                  if (tagEditor || confirmation) event.preventDefault();
                }}
              >
                <DropdownMenuItem
                  onSelect={() =>
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
                <DropdownMenuItem
                  disabled={isSetTagArchivedPending}
                  onSelect={() => void handleTagArchiveAction(activeTag.id, "archive")}
                >
                  <LuArchive className="mr-2 h-4 w-4" />
                  Archive tag
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() =>
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

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-2xl px-3 pt-2 pb-4 sm:px-5">
          <div className="mb-3 space-y-2 empty:hidden">
            {tagsQuery.isError ? (
              <QueryStatus tone="error">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span>{tags.length ? "Could not refresh tags." : "Could not load tags."}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 px-3"
                    onClick={() => void tagsQuery.refetch()}
                  >
                    Retry
                  </Button>
                </div>
              </QueryStatus>
            ) : null}

            {!showTagLoadState && !showTagErrorState && !tags.length ? (
              <QueryStatus>
                <div className="flex flex-wrap items-center justify-between gap-3">
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
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>
                  {stashes.length ? "Could not refresh stashes." : "Could not load stashes."}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive h-9 px-3"
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
            <div ref={listRef} className="flex flex-col gap-5">
              {groupedStashes.today.length > 0 && (
                <section>
                  <h3 className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">Today</h3>
                  <ul className="flex flex-col">
                    {groupedStashes.today.map((stash) => {
                      const currentIndex = globalIndex++;
                      return <StashRow key={stash.id} stash={stash} index={currentIndex} />;
                    })}
                  </ul>
                </section>
              )}

              {groupedStashes.thisWeek.length > 0 && (
                <section>
                  <h3 className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">
                    This week
                  </h3>
                  <ul className="flex flex-col">
                    {groupedStashes.thisWeek.map((stash) => {
                      const currentIndex = globalIndex++;
                      return <StashRow key={stash.id} stash={stash} index={currentIndex} />;
                    })}
                  </ul>
                </section>
              )}

              {groupedStashes.older.length > 0 && (
                <section>
                  <h3 className="text-muted-foreground mb-1.5 px-2 text-xs font-medium">Older</h3>
                  <ul className="flex flex-col">
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
      </div>
    </main>
  );
}
